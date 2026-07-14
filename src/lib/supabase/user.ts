import { cache } from "react";
import { createClient } from "./server";

// Valida o usuário logado UMA vez por renderização.
// O cache() do React desduplica as chamadas: layout + página compartilham
// a mesma verificação, em vez de fazer uma ida à rede cada.
// Não guarda nada entre requisições — cada visita valida de novo (sem dados "velhos").
export const getCachedUser = cache(async () => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
});

// Token de acesso do usuário (lido do cookie, sem ida à rede).
// Usado para repassar ao cache mantendo o RLS do banco ativo.
export const getCachedAccessToken = cache(async () => {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ?? "";
});
