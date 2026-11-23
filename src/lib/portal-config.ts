import { unstable_cache } from "next/cache";
import { createAdminClient } from "@/src/lib/supabase/server";
import { USER_CACHE_TTL, userCacheTag } from "@/src/lib/cache";

// Lê quais menus estão escondidos para um cliente.
// Usa o acesso do servidor (a tabela é fechada para o navegador do cliente).
// O userId vem sempre da sessão de login, nunca de um parâmetro da URL.
// Entra no mesmo cache por cliente, então salvar no admin limpa na hora.
// Se a tabela ainda não existir (SQL não rodado), nada fica escondido.
export function getSecoesOcultas(userId: string): Promise<string[]> {
  return unstable_cache(
    async () => {
      const { data } = await createAdminClient()
        .from("portal_config")
        .select("secoes_ocultas")
        .eq("cliente_id", userId)
        .maybeSingle();
      return (data?.secoes_ocultas as string[] | undefined) ?? [];
    },
    ["portal-config", userId],
    { revalidate: USER_CACHE_TTL, tags: [userCacheTag(userId)] }
  )();
}
