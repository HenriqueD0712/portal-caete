import { createClient } from "@/src/lib/supabase/server";
import { PanoramaFloorPlan } from "@/components/panorama-floor-plan";

export default async function PanoramasPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

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

  const rawPlantaUrl = plantasResult.data?.[0]?.url ?? null;
  const plantaUrl = rawPlantaUrl
    ? `/api/r2-proxy?url=${encodeURIComponent(rawPlantaUrl)}`
    : null;

  const panoramas = (panoramasResult.data ?? []).map(p => ({
    ...p,
    url: `/api/r2-proxy?url=${encodeURIComponent(p.url)}`,
    x_pos: p.x_pos ?? null,
    y_pos: p.y_pos ?? null,
  }));

  return <PanoramaFloorPlan panoramas={panoramas} plantaUrl={plantaUrl} />;
}
