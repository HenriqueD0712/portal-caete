import { NextRequest, NextResponse } from "next/server";
import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { createClient } from "@/src/lib/supabase/server";

const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

export async function GET(req: NextRequest) {
  // Verifica autenticação
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const storedUrl = req.nextUrl.searchParams.get("url");
  if (!storedUrl) return new NextResponse("Missing url", { status: 400 });

  // Extrai a chave R2 a partir da URL pública armazenada
  let key: string;
  try {
    key = new URL(storedUrl).pathname.slice(1); // remove barra inicial
  } catch {
    key = storedUrl;
  }

  try {
    const obj = await r2.send(new GetObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: key,
    }));

    const bytes = await obj.Body?.transformToByteArray();
    if (!bytes) return new NextResponse("Not found", { status: 404 });

    return new NextResponse(Buffer.from(bytes), {
      status: 200,
      headers: {
        "Content-Type": obj.ContentType ?? "image/jpeg",
        "Cache-Control": "private, max-age=3600",
        "Content-Length": String(bytes.byteLength),
      },
    });
  } catch {
    return new NextResponse("File not found in R2", { status: 404 });
  }
}
