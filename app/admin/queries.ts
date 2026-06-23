import { createAdminClient, createClient } from "@/src/lib/supabase/server";
import { ADMIN_EMAIL } from "./config";

async function checkAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email !== ADMIN_EMAIL) throw new Error("Não autorizado");
}

export async function getAllClients() {
  await checkAdmin();
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("profiles")
    .select("id, nome, nome_projeto, google_sheets_url, created_at")
    .order("created_at", { ascending: false });
  if (error) throw new Error(`Erro ao buscar clientes: ${error.message}`);
  return data ?? [];
}

export async function getClientData(id: string) {
  await checkAdmin();
  const admin = createAdminClient();
  const [profile, arquivos, panoramas, cronograma, progresso, aprovacoes, reunioes, cuidados] = await Promise.all([
    admin.from("profiles").select("*").eq("id", id).single(),
    admin.from("arquivos").select("*").eq("cliente_id", id).neq("categoria", "panorama").order("created_at", { ascending: false }),
    admin.from("arquivos").select("*").eq("cliente_id", id).eq("categoria", "panorama").order("created_at", { ascending: false }),
    admin.from("cronograma").select("*").eq("cliente_id", id).order("data_prevista"),
    admin.from("progresso").select("*").eq("cliente_id", id).order("ordem"),
    admin.from("aprovacoes").select("*").eq("cliente_id", id).order("created_at"),
    admin.from("reunioes").select("*").eq("cliente_id", id).order("data_reuniao", { ascending: false }),
    admin.from("cuidados").select("*").eq("cliente_id", id).order("ordem"),
  ]);
  return {
    profile: profile.data,
    arquivos: arquivos.data ?? [],
    panoramas: panoramas.data ?? [],
    cronograma: cronograma.data ?? [],
    progresso: progresso.data ?? [],
    aprovacoes: aprovacoes.data ?? [],
    reunioes: reunioes.data ?? [],
    cuidados: cuidados.data ?? [],
  };
}
