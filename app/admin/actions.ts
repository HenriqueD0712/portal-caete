"use server";

import { createAdminClient } from "@/src/lib/supabase/server";
import { createClient } from "@/src/lib/supabase/server";
import { deleteFile } from "@/src/lib/r2";
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

export async function deleteClient(id: string) {
  await checkAdmin();
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
  await admin.from("arquivos").insert({ cliente_id: clienteId, ...data });
  revalidatePath(`/admin/clientes/${clienteId}`);
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

// ── REUNIÕES ───────────────────────────────────────────────
export async function saveReuniao(clienteId: string, data: { data_reuniao: string; assunto: string; ata_texto?: string }) {
  await checkAdmin();
  const admin = createAdminClient();
  await admin.from("reunioes").insert({ cliente_id: clienteId, ...data });
  revalidatePath(`/admin/clientes/${clienteId}`);
}

export async function updateReuniao(id: string, data: Partial<{ data_reuniao: string; assunto: string; ata_texto: string }>, clienteId: string) {
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
