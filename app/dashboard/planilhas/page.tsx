import { createClient } from "@/src/lib/supabase/server";
import { SheetsEmbed } from "@/components/sheets-embed";
import { CanvaEmbed } from "@/components/canva-embed";
import { OrcamentoSection } from "@/components/orcamento-section";
import { fetchOrcamento } from "@/src/lib/orcamento";
import { TableProperties, BookOpen } from "lucide-react";

export const dynamic = "force-dynamic";

function toSheetsEmbed(url: string): string {
  if (!url.includes("docs.google.com/spreadsheets")) return url;
  const base = url.split("?")[0].replace(/\/(edit|preview|htmlview|pubhtml).*$/, "");
  return base + "/pubhtml";
}

export default async function PlanilhasPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: arquivos } = await supabase.from("arquivos")
    .select("id, nome, url, categoria")
    .eq("cliente_id", user!.id)
    .in("categoria", ["planilha", "caderno"])
    .order("created_at", { ascending: true });

  const planilhas = arquivos?.filter(a => a.categoria === "planilha") ?? [];
  const cadernos  = arquivos?.filter(a => a.categoria === "caderno")  ?? [];

  const isSheet = (u: string) => u.includes("docs.google.com/spreadsheets");
  const docId = (u: string) => u.match(/\/spreadsheets\/d\/(?:e\/)?([^/]+)/)?.[1] ?? u;

  // Fonte única da planilha financeira: os arquivos cadastrados como "planilha"
  const vistos = new Set<string>();
  const fontesUnicas = planilhas
    .filter(p => isSheet(p.url))
    .filter(f => (vistos.has(docId(f.url)) ? false : (vistos.add(docId(f.url)), true)));

  // Lê cada planilha; mantém só as que têm itens no formato de orçamento
  const orcamentos = (
    await Promise.all(fontesUnicas.map(async f => ({ ...f, itens: await fetchOrcamento(f.url) })))
  ).filter(o => o.itens.length > 0);

  // Planilhas que não viraram cards (outro formato) continuam como iframe.
  // Remove pelo documento: se o mesmo link já vira cards, não repete o "clique para abrir".
  const docsCards = new Set(orcamentos.map(o => docId(o.url)));
  const planilhasIframe = planilhas.filter(p => !docsCards.has(docId(p.url)));

  const semConteudo = orcamentos.length === 0 && planilhasIframe.length === 0 && cadernos.length === 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--verde-escuro)]">Planilhas e Cadernos</h1>
        <p className="text-sm text-[var(--muted-foreground)] mt-1">
          Especificações, mobiliários e compras do projeto.
        </p>
      </div>

      {semConteudo ? (
        <div className="bg-white rounded-lg border border-[var(--border)] p-12 text-center">
          <TableProperties size={32} className="mx-auto text-[var(--muted-foreground)] mb-3" />
          <p className="text-sm text-[var(--muted-foreground)]">Nenhuma planilha ou caderno disponível ainda.</p>
        </div>
      ) : (
        <>
          {/* Itens orçados (planilha financeira em cards, recolhível) */}
          {orcamentos.map((o) => (
            <OrcamentoSection key={o.id} items={o.itens} />
          ))}

          {/* Planilhas (outros formatos) */}
          {planilhasIframe.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <TableProperties size={16} className="text-[var(--verde-escuro)]" />
                <h2 className="text-sm font-semibold text-[var(--verde-escuro)] uppercase tracking-wide">Planilhas</h2>
              </div>
              {planilhasIframe.map((p) => (
                <div key={p.id} className="space-y-2">
                  <p className="text-sm font-medium text-[var(--foreground)]">{p.nome}</p>
                  <SheetsEmbed src={toSheetsEmbed(p.url)} title={p.nome} />
                </div>
              ))}
            </section>
          )}

          {/* Cadernos */}
          {cadernos.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <BookOpen size={16} className="text-[var(--verde-escuro)]" />
                <h2 className="text-sm font-semibold text-[var(--verde-escuro)] uppercase tracking-wide">Cadernos</h2>
              </div>
              {cadernos.map((c) => (
                <div key={c.id} className="bg-white rounded-xl border border-[var(--border)] overflow-hidden">
                  <div className="px-4 py-3 border-b border-[var(--border)]">
                    <p className="font-medium text-sm">{c.nome}</p>
                  </div>
                  <CanvaEmbed src={c.url} title={c.nome} />
                </div>
              ))}
            </section>
          )}
        </>
      )}
    </div>
  );
}
