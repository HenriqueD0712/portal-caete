import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const BUCKET = process.env.R2_BUCKET_NAME!;
const PUBLIC_URL = process.env.R2_PUBLIC_URL!;

/** Gera URL assinada para upload direto do browser (expira em 60 min) */
export async function getUploadUrl(chave: string, tipoArquivo: string) {
  const url = await getSignedUrl(
    r2,
    new PutObjectCommand({ Bucket: BUCKET, Key: chave, ContentType: tipoArquivo }),
    { expiresIn: 3600 }
  );
  return url;
}

/** Gera URL pública permanente (bucket deve ser público) */
export function getPublicUrl(chave: string) {
  return `${PUBLIC_URL}/${chave}`;
}

/** Gera URL assinada para download privado (expira em 1 hora) */
export async function getDownloadUrl(chave: string) {
  return getSignedUrl(
    r2,
    new GetObjectCommand({ Bucket: BUCKET, Key: chave }),
    { expiresIn: 3600 }
  );
}

/** Remove arquivo do R2 */
export async function deleteFile(chave: string) {
  await r2.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: chave }));
}
