"use server";

import { createClient, createAdminClient } from "@/src/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function clienteResponderAprovacao(
  id: string,
  status: "aprovado" | "revisao",
  comentario?: string
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autorizado");

  const { data: aprov } = await supabase
    .from("aprovacoes")
    .select("cliente_id")
    .eq("id", id)
    .single();

  if (!aprov || aprov.cliente_id !== user.id) throw new Error("Não autorizado");

  const admin = createAdminClient();
  await admin
    .from("aprovacoes")
    .update({ status, comentario: comentario ?? null, updated_at: new Date().toISOString() })
    .eq("id", id);

  revalidatePath("/dashboard");
}
