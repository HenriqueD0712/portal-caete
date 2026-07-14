import { getCachedUser, getCachedAccessToken } from "@/src/lib/supabase/user";
import { getUserData } from "@/src/lib/cache";
import { AprovacaoCard } from "@/components/aprovacao-card";

export default async function ProgressoPage() {
  const user = await getCachedUser();
  const token = await getCachedAccessToken();

  const { progresso, aprovacoes } = await getUserData(user!.id, token, "progresso", async (sb) => {
    const [progressoRes, aprovacoesRes] = await Promise.all([
      sb.from("progresso").select("*").eq("cliente_id", user!.id).order("ordem"),
      sb.from("aprovacoes").select("*").eq("cliente_id", user!.id),
    ]);
    return { progresso: progressoRes.data ?? [], aprovacoes: aprovacoesRes.data ?? [] };
  });

  const criativo = progresso?.filter((p) => p.etapa === "criativo") ?? [];
  const executivo = progresso?.filter((p) => p.etapa === "executivo") ?? [];

  const aprov = (etapa: string) => aprovacoes?.find((a) => a.etapa === etapa) ?? null;

  function MediaProgresso({ itens }: { itens: typeof criativo }) {
    if (!itens.length) return null;
    const media = Math.round(itens.reduce((acc, i) => acc + i.percentual, 0) / itens.length);
    return (
      <div className="mb-4">
        <div className="flex justify-between text-xs text-[var(--muted-foreground)] mb-1">
          <span>Progresso geral</span>
          <span>{media}%</span>
        </div>
        <div className="h-2 bg-[var(--creme-escuro)] rounded-full overflow-hidden">
          <div
            className="h-full bg-[var(--verde-escuro)] rounded-full transition-all"
            style={{ width: `${media}%` }}
          />
        </div>
      </div>
    );
  }

  function Etapa({ titulo, itens, etapa }: { titulo: string; itens: typeof criativo; etapa: string }) {
    return (
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-[var(--verde-escuro)]">{titulo}</h2>
        <div className="bg-white rounded-lg border border-[var(--border)] p-5 space-y-4">
          <MediaProgresso itens={itens} />
          {itens.length === 0 ? (
            <p className="text-sm text-[var(--muted-foreground)]">Nenhum item cadastrado.</p>
          ) : (
            <ul className="space-y-3">
              {itens.map((item) => (
                <li key={item.id}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{item.item}</span>
                    <span className="text-[var(--muted-foreground)]">{item.percentual}%</span>
                  </div>
                  <div className="h-1.5 bg-[var(--creme-escuro)] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        item.percentual === 100 ? "bg-[var(--verde-escuro)]" :
                        item.percentual > 0 ? "bg-[var(--terracota)]" :
                        "bg-[var(--creme-escuro)]"
                      }`}
                      style={{ width: `${item.percentual}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        <AprovacaoCard aprovacao={aprov(etapa)} etapa={etapa} clienteId={user!.id} />
      </section>
    );
  }

  return (
    <div className="max-w-2xl space-y-10">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--verde-escuro)]">Progresso do Projeto</h1>
        <p className="text-sm text-[var(--muted-foreground)] mt-1">Acompanhe o andamento de cada etapa.</p>
      </div>
      <Etapa titulo="Etapa Criativa" itens={criativo} etapa="criativo" />
      <Etapa titulo="Etapa Executiva" itens={executivo} etapa="executivo" />
    </div>
  );
}
