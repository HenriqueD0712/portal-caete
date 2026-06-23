"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/src/lib/supabase/client";
import { ShieldCheck, Eye, Download, X, FileText } from "lucide-react";

type Arquivo = { id: string; nome: string; url: string; tipo_arquivo?: string };

export default function CuidadosPage() {
  const [doc, setDoc] = useState<Arquivo | null>(null);
  const [loading, setLoading] = useState(true);
  const [pdfOpen, setPdfOpen] = useState(false);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      const { data } = await supabase
        .from("arquivos")
        .select("id, nome, url, tipo_arquivo")
        .eq("cliente_id", user!.id)
        .eq("categoria", "cuidados")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      setDoc(data);
      setLoading(false);
    }
    load();
  }, []);

  const isPdf = doc?.tipo_arquivo === "application/pdf" || doc?.url?.toLowerCase().includes(".pdf");

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--verde-escuro)]">Cuidados com o Projeto</h1>
        <p className="text-sm text-[var(--muted-foreground)] mt-1">
          Orientações sobre manutenção e conservação dos materiais do seu projeto.
        </p>
      </div>

      {loading ? (
        <div className="bg-white rounded-lg border border-[var(--border)] p-12 text-center">
          <p className="text-sm text-[var(--muted-foreground)]">Carregando...</p>
        </div>
      ) : !doc ? (
        <div className="bg-white rounded-lg border border-[var(--border)] p-12 text-center">
          <ShieldCheck size={32} className="mx-auto text-[var(--muted-foreground)] mb-3" />
          <p className="text-sm text-[var(--muted-foreground)]">Nenhuma orientação disponível ainda.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-[var(--border)] p-6 space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-[var(--creme)] flex items-center justify-center shrink-0">
              <FileText size={20} className="text-[var(--verde-escuro)]" />
            </div>
            <div className="min-w-0">
              <p className="font-medium text-sm text-[var(--foreground)] truncate">{doc.nome}</p>
              <p className="text-xs text-[var(--muted-foreground)] mt-0.5">Documento de cuidados do projeto</p>
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            {isPdf && (
              <button
                onClick={() => setPdfOpen(true)}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-[var(--verde-escuro)] text-white text-sm font-medium hover:opacity-90 transition-opacity"
              >
                <Eye size={15} /> Visualizar documento
              </button>
            )}
            <a
              href={doc.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border border-[var(--border)] text-sm font-medium text-[var(--foreground)] hover:bg-[var(--creme)] transition-colors"
            >
              <Download size={15} /> Baixar
            </a>
          </div>
        </div>
      )}

      {/* Modal PDF */}
      {pdfOpen && doc && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
          onClick={() => setPdfOpen(false)}
        >
          <div
            className="relative bg-white rounded-xl shadow-2xl w-full max-w-4xl h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
              <span className="text-sm font-medium text-[var(--verde-escuro)]">{doc.nome}</span>
              <div className="flex items-center gap-2">
                <a href={doc.url} target="_blank" rel="noreferrer"
                  className="text-xs text-[var(--muted-foreground)] hover:text-[var(--verde-escuro)] flex items-center gap-1">
                  <Download size={13} /> Baixar
                </a>
                <button onClick={() => setPdfOpen(false)} className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] ml-1">
                  <X size={18} />
                </button>
              </div>
            </div>
            <iframe src={doc.url} className="flex-1 w-full rounded-b-xl border-0" title={doc.nome} />
          </div>
        </div>
      )}
    </div>
  );
}
