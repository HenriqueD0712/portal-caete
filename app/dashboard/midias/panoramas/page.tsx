import { createClient } from "@/src/lib/supabase/server";
import { PanoramaViewer } from "@/components/panorama-viewer";

export default async function PanoramasPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: arquivos } = await supabase
    .from("arquivos")
    .select("id, nome, descricao, url")
    .eq("cliente_id", user!.id)
    .eq("categoria", "panorama")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--verde-escuro)]">Panoramas 360°</h1>
        <p className="text-sm text-[var(--muted-foreground)] mt-1">
          Explore os ambientes em 360°. No celular, ative o Modo VR para usar com óculos Google Cardboard.
        </p>
      </div>

      {!arquivos || arquivos.length === 0 ? (
        <div className="bg-white rounded-lg border border-[var(--border)] p-12 text-center">
          <p className="text-3xl mb-3">360°</p>
          <p className="text-sm text-[var(--muted-foreground)]">Nenhum panorama disponível ainda.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {arquivos.map((arq) => (
            <div key={arq.id} className="space-y-2">
              <div>
                <p className="font-medium text-sm">{arq.nome}</p>
                {arq.descricao && <p className="text-xs text-[var(--muted-foreground)]">{arq.descricao}</p>}
              </div>
              <PanoramaViewer src={arq.url} title={arq.nome} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
