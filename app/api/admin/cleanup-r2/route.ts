import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/src/lib/supabase/server";
import { ADMIN_EMAIL } from "@/app/admin/config";
import { S3Client, ListObjectsV2Command, DeleteObjectsCommand } from "@aws-sdk/client-s3";

const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const r2Base = process.env.R2_PUBLIC_URL!;
  const bucket = process.env.R2_BUCKET_NAME!;

  // 1. Lista todos os objetos do R2
  const allKeys = new Set<string>();
  let token: string | undefined;
  do {
    const res = await r2.send(new ListObjectsV2Command({ Bucket: bucket, ContinuationToken: token }));
    for (const obj of res.Contents ?? []) {
      if (obj.Key) allKeys.add(obj.Key);
    }
    token = res.IsTruncated ? res.NextContinuationToken : undefined;
  } while (token);

  // 2. Busca todas as URLs referenciadas no banco
  const admin = createAdminClient();
  const [arquivosRes, reunioesRes] = await Promise.all([
    admin.from("arquivos").select("url"),
    admin.from("reunioes").select("ata_url"),
  ]);

  const referencedKeys = new Set<string>();
  const extractKey = (url: string) => {
    try {
      if (url && url.startsWith(r2Base)) referencedKeys.add(new URL(url).pathname.slice(1));
    } catch {}
  };

  for (const row of arquivosRes.data ?? []) extractKey(row.url);
  for (const row of reunioesRes.data ?? []) if (row.ata_url) extractKey(row.ata_url);

  // 3. Identifica órfãos (existem no R2 mas não estão em nenhuma URL do banco)
  const orphaned = [...allKeys].filter((k) => !referencedKeys.has(k));

  if (orphaned.length === 0) {
    return NextResponse.json({ deleted: 0 });
  }

  // 4. Exclui em lotes de 1000 (limite da API S3)
  for (let i = 0; i < orphaned.length; i += 1000) {
    const batch = orphaned.slice(i, i + 1000).map((Key) => ({ Key }));
    await r2.send(new DeleteObjectsCommand({ Bucket: bucket, Delete: { Objects: batch, Quiet: true } }));
  }

  return NextResponse.json({ deleted: orphaned.length });
}
