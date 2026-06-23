"use server";

import { createClient, createAdminClient } from "@/src/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { ADMIN_EMAIL } from "@/app/admin/config";

async function enviarEmailAdmin(etapa: string, status: string, comentario: string | undefined, nomeProjeto: string, nomeCliente: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;

  const statusTexto = status === "aprovado" ? "✅ Aprovado" : "⚠️ Revisão solicitada";
  const html = `
    <h2 style="color:#2d4a3e">Nova resposta de aprovação — Portal Caeté</h2>
    <p><strong>Projeto:</strong> ${nomeProjeto}</p>
    <p><strong>Cliente:</strong> ${nomeCliente}</p>
    <p><strong>Etapa:</strong> ${etapa}</p>
    <p><strong>Resposta:</strong> ${statusTexto}</p>
    ${comentario ? `<p><strong>Comentário:</strong> <em>"${comentario}"</em></p>` : ""}
    <hr/>
    <p style="font-size:12px;color:#888">Portal Estúdio Caeté</p>
  `;

  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.RESEND_FROM_EMAIL ?? "Portal Caeté <onboarding@resend.dev>",
        to: ADMIN_EMAIL,
        subject: `[Portal Caeté] ${nomeCliente} respondeu: ${etapa} — ${statusTexto}`,
        html,
      }),
    });
  } catch {}
}

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
    .select("cliente_id, etapa")
    .eq("id", id)
    .single();

  if (!aprov || aprov.cliente_id !== user.id) throw new Error("Não autorizado");

  const admin = createAdminClient();
  await admin
    .from("aprovacoes")
    .update({ status, comentario: comentario ?? null, updated_at: new Date().toISOString(), bloqueado: true })
    .eq("id", id);

  // Busca nome do projeto e cliente para o e-mail
  const { data: profile } = await admin
    .from("profiles")
    .select("nome, nome_projeto")
    .eq("id", user.id)
    .single();

  await enviarEmailAdmin(
    aprov.etapa,
    status,
    comentario,
    profile?.nome_projeto ?? "—",
    profile?.nome ?? user.email ?? "—",
  );

  revalidatePath("/dashboard");
}
