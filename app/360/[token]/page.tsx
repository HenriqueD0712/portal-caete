import type { Metadata } from "next";
import Image from "next/image";
import { createAdminClient } from "@/src/lib/supabase/server";
import { getDownloadUrl } from "@/src/lib/r2";
import { PanoramaFloorPlan } from "@/components/panorama-floor-plan";
import { siteText } from "@/src/config/site-text";

// Página pública (sem login) do 360° de um cliente, aberta pelo QR Code.
// Mostra SOMENTE os panoramas e a planta do cliente dono do código.
// Nunca é guardada em cache: ligar/desligar o link vale na hora.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Panoramas 360° | Estúdio Caeté",
  robots: { index: false, follow: false },
};

const TOKEN_FORMATO = /^[a-f0-9]{32}$/;

function keyFromUrl(storedUrl: string): string {
  try {
    return new URL(storedUrl).pathname.slice(1);
  } catch {
    return storedUrl;
  }
}

async function carregar(token: string) {
  const admin = createAdminClient();
  const { data: cfg } = await admin
    .from("portal_config")
    .select("cliente_id, link360_ativo")
    .eq("link360_token", token)
    .maybeSingle();
  if (!cfg || !cfg.link360_ativo) return null;

  const [panoramasRes, plantaRes] = await Promise.all([
    admin.from("arquivos")
      .select("id, nome, descricao, url, x_pos, y_pos")
      .eq("cliente_id", cfg.cliente_id).eq("categoria", "panorama")
      .order("ordem", { ascending: true }).order("created_at", { ascending: false }),
    admin.from("arquivos")
      .select("url")
      .eq("cliente_id", cfg.cliente_id).eq("categoria", "planta")
      .order("created_at", { ascending: false }).limit(1),
  ]);

  const rawPlanta = plantaRes.data?.[0]?.url ?? null;
  const plantaUrl = rawPlanta ? await getDownloadUrl(keyFromUrl(rawPlanta)) : null;
  const panoramas = await Promise.all(
    (panoramasRes.data ?? []).map(async (p) => ({
      ...p,
      url: await getDownloadUrl(keyFromUrl(p.url)),
      x_pos: p.x_pos ?? null,
      y_pos: p.y_pos ?? null,
    }))
  );
  return { panoramas, plantaUrl };
}

export default async function Link360Page({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const dados = TOKEN_FORMATO.test(token) ? await carregar(token) : null;

  return (
    <div className="min-h-screen bg-[var(--creme)]">
      <header className="bg-[var(--verde-escuro)] px-5 py-4">
        <Image src="/logo.png" alt={siteText.siteName} width={110} height={44} className="h-auto brightness-0 invert" priority />
      </header>
      <main className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
        {dados ? (
          <PanoramaFloorPlan panoramas={dados.panoramas} plantaUrl={dados.plantaUrl} />
        ) : (
          <div className="bg-white rounded-lg border border-[var(--border)] p-12 text-center max-w-xl mx-auto mt-8">
            <p className="text-2xl font-semibold text-[var(--verde-escuro)] mb-2">{siteText.link360.indisponivelTitulo}</p>
            <p className="text-sm text-[var(--muted-foreground)]">{siteText.link360.indisponivelDescricao}</p>
          </div>
        )}
      </main>
    </div>
  );
}
