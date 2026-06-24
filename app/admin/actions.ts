"use server";

import { createAdminClient } from "@/src/lib/supabase/server";
import { createClient } from "@/src/lib/supabase/server";
import { deleteFile, deleteAllClientFiles } from "@/src/lib/r2";
import { revalidatePath } from "next/cache";
import { ADMIN_EMAIL } from "./config";

async function checkAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email !== ADMIN_EMAIL) throw new Error("Não autorizado");
}

// ── CLIENTES ───────────────────────────────────────────────
export async function createNewClient(email: string, password: string, nome: string, nomeProjeto: string) {
  await checkAdmin();
  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.createUser({
    email, password, email_confirm: true, user_metadata: { nome },
  });
  if (error) throw error;
  await admin.from("profiles").update({ nome, nome_projeto: nomeProjeto }).eq("id", data.user.id);
  revalidatePath("/admin");
  return data.user.id;
}

export async function updateProfile(id: string, data: {
  nome?: string;
  nome_projeto?: string;
  google_sheets_url?: string;
  progresso_criativo?: number;
  progresso_executivo?: number;
  data_entrega_criativo?: string | null;
  data_entrega_executivo?: string | null;
  subcategorias_executivo?: string[];
}) {
  await checkAdmin();
  const admin = createAdminClient();
  await admin.from("profiles").update(data).eq("id", id);
  revalidatePath(`/admin/clientes/${id}`);
  revalidatePath("/admin");
}

export async function changeClientPassword(id: string, password: string) {
  await checkAdmin();
  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(id, { password });
  if (error) throw new Error(error.message);
}

export async function adminToggleBloqueio(id: string, bloqueado: boolean, clienteId: string) {
  await checkAdmin();
  const admin = createAdminClient();
  await admin.from("aprovacoes").update({ bloqueado }).eq("id", id);
  revalidatePath(`/admin/clientes/${clienteId}`);
}

export async function deleteClient(id: string) {
  await checkAdmin();
  await deleteAllClientFiles(id);
  const admin = createAdminClient();
  await admin.auth.admin.deleteUser(id);
  revalidatePath("/admin");
}

// ── ARQUIVOS ───────────────────────────────────────────────
export async function saveArquivo(clienteId: string, data: {
  nome: string; descricao?: string; categoria: string; url: string; tipo_arquivo?: string; tamanho_bytes?: number;
}) {
  await checkAdmin();
  const admin = createAdminClient();

  // Para planta: substitui atomicamente no servidor (evita race condition no cliente)
  if (data.categoria === "planta") {
    const { data: existing } = await admin.from("arquivos")
      .select("id, url")
      .eq("cliente_id", clienteId)
      .eq("categoria", "planta")
      .maybeSingle();
    if (existing) {
      try {
        const key = new URL(existing.url).pathname.slice(1);
        await deleteFile(key);
      } catch {}
      await admin.from("arquivos").delete().eq("id", existing.id);
    }
  }

  await admin.from("arquivos").insert({ cliente_id: clienteId, ...data });
  revalidatePath(`/admin/clientes/${clienteId}`);
  revalidatePath("/dashboard/midias/panoramas");
}

export async function updateArquivo(
  id: string,
  data: { nome?: string; descricao?: string; url?: string; x_pos?: number | null; y_pos?: number | null },
  clienteId: string
) {
  await checkAdmin();
  const admin = createAdminClient();
  await admin.from("arquivos").update(data).eq("id", id);
  revalidatePath(`/admin/clientes/${clienteId}`);
  revalidatePath("/dashboard/midias/panoramas");
}

export async function reorderPanoramas(updates: { id: string; ordem: number }[], clienteId: string) {
  await checkAdmin();
  const admin = createAdminClient();
  await Promise.all(updates.map(({ id, ordem }) =>
    admin.from("arquivos").update({ ordem }).eq("id", id)
  ));
  revalidatePath(`/admin/clientes/${clienteId}`);
  revalidatePath("/dashboard/midias/panoramas");
}

export async function deleteArquivo(id: string, chave: string, clienteId: string) {
  await checkAdmin();
  try { await deleteFile(chave); } catch {}
  const admin = createAdminClient();
  await admin.from("arquivos").delete().eq("id", id);
  revalidatePath(`/admin/clientes/${clienteId}`);
}

// ── CRONOGRAMA ─────────────────────────────────────────────
export async function saveCronograma(clienteId: string, data: { titulo: string; descricao?: string; data_prevista: string }) {
  await checkAdmin();
  const admin = createAdminClient();
  await admin.from("cronograma").insert({ cliente_id: clienteId, ...data });
  revalidatePath(`/admin/clientes/${clienteId}`);
}

export async function updateCronograma(id: string, data: Partial<{ titulo: string; descricao: string; data_prevista: string; concluido: boolean }>, clienteId: string) {
  await checkAdmin();
  const admin = createAdminClient();
  await admin.from("cronograma").update(data).eq("id", id);
  revalidatePath(`/admin/clientes/${clienteId}`);
}

export async function deleteCronograma(id: string, clienteId: string) {
  await checkAdmin();
  const admin = createAdminClient();
  await admin.from("cronograma").delete().eq("id", id);
  revalidatePath(`/admin/clientes/${clienteId}`);
}

// ── PROGRESSO ──────────────────────────────────────────────
export async function saveProgresso(clienteId: string, data: { etapa: string; item: string; percentual: number; status: string; ordem?: number }) {
  await checkAdmin();
  const admin = createAdminClient();
  await admin.from("progresso").insert({ cliente_id: clienteId, ...data });
  revalidatePath(`/admin/clientes/${clienteId}`);
}

export async function updateProgresso(id: string, data: Partial<{ item: string; percentual: number; status: string; ordem: number }>, clienteId: string) {
  await checkAdmin();
  const admin = createAdminClient();
  await admin.from("progresso").update(data).eq("id", id);
  revalidatePath(`/admin/clientes/${clienteId}`);
}

export async function deleteProgresso(id: string, clienteId: string) {
  await checkAdmin();
  const admin = createAdminClient();
  await admin.from("progresso").delete().eq("id", id);
  revalidatePath(`/admin/clientes/${clienteId}`);
}

// ── APROVAÇÕES ─────────────────────────────────────────────
export async function saveAprovacao(clienteId: string, etapa: string) {
  await checkAdmin();
  const admin = createAdminClient();
  await admin.from("aprovacoes").insert({ cliente_id: clienteId, etapa, status: "pendente" });
  revalidatePath(`/admin/clientes/${clienteId}`);
}

export async function updateAprovacao(id: string, status: string, clienteId: string) {
  await checkAdmin();
  const admin = createAdminClient();
  await admin.from("aprovacoes").update({ status, updated_at: new Date().toISOString() }).eq("id", id);
  revalidatePath(`/admin/clientes/${clienteId}`);
}

export async function deleteAprovacao(id: string, clienteId: string) {
  await checkAdmin();
  const admin = createAdminClient();
  await admin.from("aprovacoes").delete().eq("id", id);
  revalidatePath(`/admin/clientes/${clienteId}`);
}

// ── REUNIÕES AGENDADAS ─────────────────────────────────────
export async function saveReuniaoAgendada(clienteId: string, data: {
  data_reuniao: string; horario: string; modalidade: string; assunto?: string; link_reuniao?: string; local_reuniao?: string;
}) {
  await checkAdmin();
  const admin = createAdminClient();
  await admin.from("reunioes_agendadas").insert({ cliente_id: clienteId, ...data });
  revalidatePath(`/admin/clientes/${clienteId}`);
}

export async function updateReuniaoAgendada(id: string, data: Partial<{ data_reuniao: string; horario: string; modalidade: string; assunto: string; link_reuniao: string; local_reuniao: string }>, clienteId: string) {
  await checkAdmin();
  const admin = createAdminClient();
  await admin.from("reunioes_agendadas").update(data).eq("id", id);
  revalidatePath(`/admin/clientes/${clienteId}`);
}

export async function deleteReuniaoAgendada(id: string, clienteId: string) {
  await checkAdmin();
  const admin = createAdminClient();
  await admin.from("reunioes_agendadas").delete().eq("id", id);
  revalidatePath(`/admin/clientes/${clienteId}`);
}

// ── REUNIÕES ───────────────────────────────────────────────
export async function saveReuniao(clienteId: string, data: { data_reuniao: string; assunto: string; ata_texto?: string; ata_url?: string; ata_nome?: string }) {
  await checkAdmin();
  const admin = createAdminClient();
  await admin.from("reunioes").insert({ cliente_id: clienteId, ...data });
  revalidatePath(`/admin/clientes/${clienteId}`);
}

export async function updateReuniao(id: string, data: Partial<{ data_reuniao: string; assunto: string; ata_texto: string; ata_url: string; ata_nome: string }>, clienteId: string) {
  await checkAdmin();
  const admin = createAdminClient();
  await admin.from("reunioes").update(data).eq("id", id);
  revalidatePath(`/admin/clientes/${clienteId}`);
}

export async function deleteReuniao(id: string, clienteId: string) {
  await checkAdmin();
  const admin = createAdminClient();
  await admin.from("reunioes").delete().eq("id", id);
  revalidatePath(`/admin/clientes/${clienteId}`);
}

// ── CUIDADOS ───────────────────────────────────────────────
export async function saveCuidado(clienteId: string, data: { material: string; descricao: string; ordem?: number }) {
  await checkAdmin();
  const admin = createAdminClient();
  await admin.from("cuidados").insert({ cliente_id: clienteId, ...data });
  revalidatePath(`/admin/clientes/${clienteId}`);
}

export async function updateCuidado(id: string, data: Partial<{ material: string; descricao: string; ordem: number }>, clienteId: string) {
  await checkAdmin();
  const admin = createAdminClient();
  await admin.from("cuidados").update(data).eq("id", id);
  revalidatePath(`/admin/clientes/${clienteId}`);
}

export async function deleteCuidado(id: string, clienteId: string) {
  await checkAdmin();
  const admin = createAdminClient();
  await admin.from("cuidados").delete().eq("id", id);
  revalidatePath(`/admin/clientes/${clienteId}`);
}
