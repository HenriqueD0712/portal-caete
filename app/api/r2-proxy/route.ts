import { NextRequest, NextResponse } from "next/server";
import { getDownloadUrl } from "@/src/lib/r2";
import { createClient } from "@/src/lib/supabase/server";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const storedUrl = req.nextUrl.searchParams.get("url");
  if (!storedUrl) return new NextResponse("Missing url", { status: 400 });

  // Extrai a chave R2 a partir da URL pública armazenada
  let key: string;
  try {
    key = new URL(storedUrl).pathname.slice(1); // remove barra inicial: /panoramas/... → panoramas/...
  } catch {
    key = storedUrl;
  }

  // Gera URL assinada com credenciais do servidor e faz fetch direto
  const signedUrl = await getDownloadUrl(key);
  const upstream = await fetch(signedUrl);

  if (!upstream.ok) {
    return new NextResponse(`R2 error: ${upstream.status}`, { status: upstream.status });
  }

  const contentType = upstream.headers.get("content-type") ?? "image/jpeg";

  return new NextResponse(upstream.body, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
