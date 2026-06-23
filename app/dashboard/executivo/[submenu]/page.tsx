import { createClient } from "@/src/lib/supabase/server";
import { navigation } from "@/src/config/navigation";
import { notFound } from "next/navigation";
import { FileText, Download } from "lucide-react";

interface Props {
  params: Promise<{ submenu: string }>;
}

export async function generateStaticParams() {
  const executivo = navigation.find((n) => n.id === "executivo");
  return executivo?.subItems?.map((s) => ({ submenu: s.id })) ?? [];
}

export default async function ExecutivoSubmenuPage({ params }: Props) {
  const { submenu } = await params;
  const executivo = navigation.find((n) => n.id === "executivo");
  const item = executivo?.subItems?.find((s) => s.id === submenu);
  if (!item) notFound();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: arquivos } = await supabase
    .from("arquivos")
    .select("*")
    .eq("cliente_id", user!.id)
    .eq("categoria", submenu)
    .order("created_at", { ascending: false });

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <p className="text-xs text-[var(--muted-foreground)] uppercase tracking-widest mb-1">Executivo</p>
        <h1 className="text-2xl font-semibold text-[var(--verde-escuro)]">{item.label}</h1>
      </div>

      {!arquivos || arquivos.length === 0 ? (
        <div className="bg-white rounded-lg border border-[var(--border)] p-12 text-center">
          <FileText size={32} className="mx-auto text-[var(--muted-foreground)] mb-3" />
          <p className="text-sm text-[var(--muted-foreground)]">Nenhum arquivo de {item.label.toLowerCase()} disponível ainda.</p>
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
                  <p className="text-xs text-[var(--muted-foreground)]">
                    {new Date(arq.created_at).toLocaleDateString("pt-BR")}
                  </p>
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
