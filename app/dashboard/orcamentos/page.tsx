import { createClient } from "@/src/lib/supabase/server";
import { FileText, Download } from "lucide-react";

export default async function OrcamentosPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: arquivos } = await supabase
    .from("arquivos")
    .select("*")
    .eq("cliente_id", user!.id)
    .eq("categoria", "orcamento")
    .order("created_at", { ascending: false });

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--verde-escuro)]">Orçamentos</h1>
        <p className="text-sm text-[var(--muted-foreground)] mt-1">Documentos de orçamentos para download.</p>
      </div>

      {!arquivos || arquivos.length === 0 ? (
        <div className="bg-white rounded-lg border border-[var(--border)] p-12 text-center">
          <FileText size={32} className="mx-auto text-[var(--muted-foreground)] mb-3" />
          <p className="text-sm text-[var(--muted-foreground)]">Nenhum orçamento disponível ainda.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-[var(--border)] divide-y divide-[var(--border)]">
          {arquivos.map((arq) => (
            <div key={arq.id} className="flex items-center justify-between px-4 py-3 gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <FileText size={16} className="text-[var(--terracota)] shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{arq.nome}</p>
                  {arq.descricao && <p className="text-xs text-[var(--muted-foreground)] truncate">{arq.descricao}</p>}
                </div>
              </div>
              <a
                href={arq.url}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 flex items-center gap-1.5 text-xs text-[var(--verde-escuro)] font-medium hover:underline"
              >
                <Download size={14} />
                Baixar
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
