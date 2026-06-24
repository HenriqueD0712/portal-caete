import { NextRequest, NextResponse } from "next/server";
import { getDownloadUrl } from "@/src/lib/r2";
import { createClient } from "@/src/lib/supabase/server";

export function keyFromUrl(storedUrl: string): string {
  try {
    return new URL(storedUrl).pathname.slice(1);
  } catch {
    return storedUrl;
  }
}

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const storedUrl = req.nextUrl.searchParams.get("url");
  if (!storedUrl) return new NextResponse("Missing url", { status: 400 });

  const key = keyFromUrl(storedUrl);
  const signedUrl = await getDownloadUrl(key);

  // Redireciona o browser diretamente para a URL assinada do R2
  // Para <img>, redirecionar é mais confiável do que fazer proxy binário
  return NextResponse.redirect(signedUrl, { status: 302 });
}
