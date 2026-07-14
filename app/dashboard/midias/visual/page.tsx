import { getCachedUser, getCachedAccessToken } from "@/src/lib/supabase/user";
import { getUserData } from "@/src/lib/cache";
import { CanvaEmbed } from "@/components/canva-embed";

export default async function MidiasVisualPage() {
  const user = await getCachedUser();
  const token = await getCachedAccessToken();

  const arquivos = await getUserData(user!.id, token, "arquivos-visual_3d", async (sb) =>
    (await sb
      .from("arquivos")
      .select("id, nome, descricao, url")
      .eq("cliente_id", user!.id)
      .eq("categoria", "visual_3d")
      .order("created_at", { ascending: false })).data ?? []
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--verde-escuro)]">Visual 3D</h1>
        <p className="text-sm text-[var(--muted-foreground)] mt-1">Renders e apresentações do seu projeto.</p>
      </div>

      {!arquivos || arquivos.length === 0 ? (
        <div className="bg-white rounded-lg border border-[var(--border)] p-12 text-center">
          <p className="text-sm text-[var(--muted-foreground)]">Nenhuma apresentação disponível ainda.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {arquivos.map((arq) => (
            <div key={arq.id} className="bg-white rounded-lg border border-[var(--border)] overflow-hidden">
              <div className="px-4 py-3 border-b border-[var(--border)]">
                <p className="font-medium text-sm">{arq.nome}</p>
                {arq.descricao && <p className="text-xs text-[var(--muted-foreground)]">{arq.descricao}</p>}
              </div>
              <CanvaEmbed src={arq.url} title={arq.nome} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
