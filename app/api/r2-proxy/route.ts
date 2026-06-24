import { NextRequest, NextResponse } from "next/server";
import { getDownloadUrl } from "@/src/lib/r2";
import { createClient } from "@/src/lib/supabase/server";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const storedUrl = req.nextUrl.searchParams.get("url");
  if (!storedUrl) return new NextResponse("url required", { status: 400 });

  // Extrai a chave R2 removendo o domínio da URL pública
  let key: string;
  try {
    key = new URL(storedUrl).pathname.slice(1); // remove a barra inicial
  } catch {
    key = storedUrl;
  }

  const signedUrl = await getDownloadUrl(key);
  // Redireciona para a URL assinada (expira em 1h mas o browser re-requisita via proxy)
  return NextResponse.redirect(signedUrl);
}
