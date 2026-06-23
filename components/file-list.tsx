"use client";

import { useState } from "react";
import { FileText, Download, Eye, X } from "lucide-react";

type Arquivo = {
  id: string;
  nome: string;
  descricao?: string;
  url: string;
  tipo_arquivo?: string;
  created_at: string;
};

function isPdf(arq: Arquivo) {
  return (
    arq.tipo_arquivo === "application/pdf" ||
    arq.url.toLowerCase().includes(".pdf")
  );
}

export function FileList({
  arquivos,
  emptyLabel = "Nenhum arquivo disponível ainda.",
}: {
  arquivos: Arquivo[];
  emptyLabel?: string;
}) {
  const [preview, setPreview] = useState<{ url: string; nome: string } | null>(null);

  if (!arquivos || arquivos.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-[var(--border)] p-12 text-center">
        <FileText size={32} className="mx-auto text-[var(--muted-foreground)] mb-3" />
        <p className="text-sm text-[var(--muted-foreground)]">{emptyLabel}</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-lg border border-[var(--border)] divide-y divide-[var(--border)]">
        {arquivos.map((arq) => {
          const pdf = isPdf(arq);
          return (
            <div key={arq.id} className="flex items-center justify-between px-4 py-3 gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <FileText size={16} className="text-[var(--terracota)] shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{arq.nome}</p>
                  {arq.descricao && (
                    <p className="text-xs text-[var(--muted-foreground)] truncate">{arq.descricao}</p>
                  )}
                  <p className="text-xs text-[var(--muted-foreground)]">
                    {new Date(arq.created_at).toLocaleDateString("pt-BR")}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                {pdf && (
                  <button
                    onClick={() => setPreview({ url: arq.url, nome: arq.nome })}
                    className="flex items-center gap-1.5 text-xs text-[var(--terracota)] font-medium hover:underline"
                  >
                    <Eye size={13} /> Visualizar
                  </button>
                )}
                <a
                  href={arq.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-[var(--verde-escuro)] font-medium hover:underline"
                >
                  <Download size={14} /> Baixar
                </a>
              </div>
            </div>
          );
        })}
      </div>

      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl h-[88vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--border)] shrink-0">
              <p className="text-sm font-semibold text-[var(--verde-escuro)] truncate mr-4">
                {preview.nome}
              </p>
              <div className="flex items-center gap-3 shrink-0">
                <a
                  href={preview.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-[var(--verde-escuro)] hover:underline font-medium"
                >
                  <Download size={13} /> Baixar
                </a>
                <button
                  onClick={() => setPreview(null)}
                  className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-hidden">
              <iframe
                src={preview.url}
                className="w-full h-full border-0"
                title={preview.nome}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
