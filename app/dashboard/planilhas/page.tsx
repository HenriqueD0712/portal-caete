import { createClient } from "@/src/lib/supabase/server";
import { SheetsEmbed } from "@/components/sheets-embed";
import { CanvaEmbed } from "@/components/canva-embed";
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

  const [arquivosRes, profileRes] = await Promise.all([
    supabase.from("arquivos")
      .select("id, nome, url, categoria")
      .eq("cliente_id", user!.id)
      .in("categoria", ["planilha", "caderno"])
      .order("created_at", { ascending: true }),
    supabase.from("profiles")
      .select("google_sheets_url, nome_projeto")
      .eq("id", user!.id)
      .single(),
  ]);

  const planilhas = arquivosRes.data?.filter(a => a.categoria === "planilha") ?? [];
  const cadernos  = arquivosRes.data?.filter(a => a.categoria === "caderno")  ?? [];

  // Compatibilidade retroativa: inclui a planilha antiga do profile se não há novas
  const legacyUrl = profileRes.data?.google_sheets_url;
  if (planilhas.length === 0 && legacyUrl) {
    planilhas.push({ id: "legacy", nome: profileRes.data?.nome_projeto ?? "Planilha do projeto", url: legacyUrl, categoria: "planilha" });
  }

  const semConteudo = planilhas.length === 0 && cadernos.length === 0;

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
          {/* Planilhas */}
          {planilhas.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <TableProperties size={16} className="text-[var(--verde-escuro)]" />
                <h2 className="text-sm font-semibold text-[var(--verde-escuro)] uppercase tracking-wide">Planilhas</h2>
              </div>
              {planilhas.map((p) => (
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
