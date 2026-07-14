import { createClient } from "@/src/lib/supabase/server";
import { getCachedUser } from "@/src/lib/supabase/user";
import { getDownloadUrl } from "@/src/lib/r2";
import { PanoramaFloorPlan } from "@/components/panorama-floor-plan";

// Extrai a chave R2 a partir da URL pública guardada no banco.
function keyFromUrl(storedUrl: string): string {
  try {
    return new URL(storedUrl).pathname.slice(1);
  } catch {
    return storedUrl;
  }
}

export default async function PanoramasPage() {
  const supabase = await createClient();
  const user = await getCachedUser();

  const [panoramasResult, plantasResult] = await Promise.all([
    supabase
      .from("arquivos")
      .select("id, nome, descricao, url, x_pos, y_pos")
      .eq("cliente_id", user!.id)
      .eq("categoria", "panorama")
      .order("ordem", { ascending: true })
      .order("created_at", { ascending: false }),

    supabase
      .from("arquivos")
      .select("id, url")
      .eq("cliente_id", user!.id)
      .eq("categoria", "planta")
      .order("created_at", { ascending: false })
      .limit(1),
  ]);

  // Assina as URLs uma única vez aqui no servidor (operação local, sem rede).
  // Antes cada imagem passava por /api/r2-proxy, que fazia getUser + assinatura
  // por imagem. Agora o browser baixa direto do R2.
  const rawPlantaUrl = plantasResult.data?.[0]?.url ?? null;
  const plantaUrl = rawPlantaUrl ? await getDownloadUrl(keyFromUrl(rawPlantaUrl)) : null;

  const panoramas = await Promise.all(
    (panoramasResult.data ?? []).map(async (p) => ({
      ...p,
      url: await getDownloadUrl(keyFromUrl(p.url)),
      x_pos: p.x_pos ?? null,
      y_pos: p.y_pos ?? null,
    }))
  );

  return <PanoramaFloorPlan panoramas={panoramas} plantaUrl={plantaUrl} />;
}
