import { unstable_cache, updateTag } from "next/cache";
import { createClient as createSupabaseJsClient, type SupabaseClient } from "@supabase/supabase-js";

// Janela de cache: 5 minutos (rede de segurança). O admin salvando limpa na hora.
export const USER_CACHE_TTL = 300;

// Uma tag por cliente cobre TODOS os dados cacheados dele.
export function userCacheTag(userId: string) {
  return `user-data:${userId}`;
}

// Limpa o cache de um cliente imediatamente (usado ao salvar no admin
// e quando o próprio cliente responde uma aprovação).
export function bustUserCache(userId: string) {
  updateTag(userCacheTag(userId));
}

// Executa `fetcher` com um client Supabase que carrega o token do usuário,
// então o RLS do banco continua valendo (um cliente nunca acessa dados de
// outro, mesmo que houvesse um erro de filtro). O resultado fica em cache por
// 5 min, separado por usuário (a chave inclui o userId) e com tag por usuário.
export function getUserData<T>(
  userId: string,
  accessToken: string,
  key: string,
  fetcher: (sb: SupabaseClient) => Promise<T>
): Promise<T> {
  return unstable_cache(
    async () => {
      const sb = createSupabaseJsClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          global: { headers: { Authorization: `Bearer ${accessToken}` } },
          auth: { persistSession: false, autoRefreshToken: false },
        }
      );
      return fetcher(sb);
    },
    ["user-data", userId, key],
    { revalidate: USER_CACHE_TTL, tags: [userCacheTag(userId)] }
  )();
}
