import { NextRequest, NextResponse } from "next/server";
import { getUploadUrl, getPublicUrl } from "@/src/lib/r2";
import { createClient } from "@/src/lib/supabase/server";
import { ADMIN_EMAIL } from "@/app/admin/config";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { chave, tipoArquivo } = await req.json();
  const uploadUrl = await getUploadUrl(chave, tipoArquivo);
  const publicUrl = getPublicUrl(chave);
  return NextResponse.json({ uploadUrl, publicUrl });
}
