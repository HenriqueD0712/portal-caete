import { getCachedUser, getCachedAccessToken } from "@/src/lib/supabase/user";
import { getUserData } from "@/src/lib/cache";
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
  const user = await getCachedUser();
  const token = await getCachedAccessToken();

  // Consultas ao banco em cache (5 min). A assinatura das imagens fica FORA
  // do cache (é local e barata) para os links nunca vencerem no meio.
  const { rawPanoramas, rawPlantaUrl } = await getUserData(
    user!.id, token, "panoramas", async (sb) => {
      const [panoramasResult, plantasResult] = await Promise.all([
        sb
          .from("arquivos")
          .select("id, nome, descricao, url, x_pos, y_pos")
          .eq("cliente_id", user!.id)
          .eq("categoria", "panorama")
          .order("ordem", { ascending: true })
          .order("created_at", { ascending: false }),
        sb
          .from("arquivos")
          .select("id, url")
          .eq("cliente_id", user!.id)
          .eq("categoria", "planta")
          .order("created_at", { ascending: false })
          .limit(1),
      ]);
      return {
        rawPanoramas: panoramasResult.data ?? [],
        rawPlantaUrl: plantasResult.data?.[0]?.url ?? null,
      };
    }
  );

  const plantaUrl = rawPlantaUrl ? await getDownloadUrl(keyFromUrl(rawPlantaUrl)) : null;

  const panoramas = await Promise.all(
    rawPanoramas.map(async (p) => ({
      ...p,
      url: await getDownloadUrl(keyFromUrl(p.url)),
      x_pos: p.x_pos ?? null,
      y_pos: p.y_pos ?? null,
    }))
  );

  return <PanoramaFloorPlan panoramas={panoramas} plantaUrl={plantaUrl} />;
}
