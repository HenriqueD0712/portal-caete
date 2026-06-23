"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/src/lib/supabase/client";
import { CalendarCheck, Download, Eye, X, FileText } from "lucide-react";

type Reuniao = {
  id: string;
  assunto: string;
  data_reuniao: string;
  ata_texto?: string;
  ata_url?: string;
  ata_nome?: string;
};

export default function ReunioesPage() {
  const [reunioes, setReunioes] = useState<Reuniao[]>([]);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      const { data } = await supabase
        .from("reunioes")
        .select("id, assunto, data_reuniao, ata_texto, ata_url, ata_nome")
        .eq("cliente_id", user!.id)
        .order("data_reuniao", { ascending: false });
      setReunioes(data ?? []);
    }
    load();
  }, []);

  function isPdf(url: string) {
    return url.toLowerCase().includes(".pdf");
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--verde-escuro)]">Reuniões e Atas</h1>
        <p className="text-sm text-[var(--muted-foreground)] mt-1">Histórico de reuniões realizadas.</p>
      </div>

      {reunioes.length === 0 ? (
        <div className="bg-white rounded-lg border border-[var(--border)] p-12 text-center">
          <CalendarCheck size={32} className="mx-auto text-[var(--muted-foreground)] mb-3" />
          <p className="text-sm text-[var(--muted-foreground)]">Nenhuma reunião registrada ainda.</p>
        </div>
      ) : (
        <ol className="relative border-l border-[var(--border)] ml-3 space-y-6">
          {reunioes.map((r) => (
            <li key={r.id} className="ml-6">
              <div className="absolute -left-2 mt-1.5 w-3.5 h-3.5 rounded-full border-2 border-[var(--verde-escuro)] bg-white" />
              <div className="bg-white rounded-lg border border-[var(--border)] p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-sm">{r.assunto}</p>
                    <p className="text-xs text-[var(--muted-foreground)]">
                      {new Date(r.data_reuniao + "T00:00:00").toLocaleDateString("pt-BR", {
                        weekday: "long", day: "numeric", month: "long", year: "numeric",
                      })}
                    </p>
                  </div>
                  {r.ata_url && (
                    <div className="flex items-center gap-2 shrink-0">
                      {isPdf(r.ata_url) && (
                        <button
                          onClick={() => setPdfUrl(r.ata_url!)}
                          className="flex items-center gap-1 text-xs text-[var(--verde-escuro)] font-medium hover:underline"
                        >
                          <Eye size={13} />
                          Visualizar
                        </button>
                      )}
                      <a
                        href={r.ata_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-[var(--muted-foreground)] hover:text-[var(--verde-escuro)] hover:underline"
                      >
                        <Download size={13} />
                        {r.ata_nome ?? "Baixar"}
                      </a>
                    </div>
                  )}
                </div>
                {r.ata_texto && (
                  <p className="text-sm text-[var(--foreground)] leading-relaxed whitespace-pre-line">
                    {r.ata_texto}
                  </p>
                )}
                {r.ata_url && !r.ata_texto && (
                  <div className="flex items-center gap-1.5 text-xs text-[var(--muted-foreground)]">
                    <FileText size={12} />
                    {r.ata_nome ?? "Documento anexado"}
                  </div>
                )}
              </div>
            </li>
          ))}
        </ol>
      )}

      {/* Modal PDF */}
      {pdfUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
          onClick={() => setPdfUrl(null)}
        >
          <div
            className="relative bg-white rounded-xl shadow-2xl w-full max-w-4xl h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
              <span className="text-sm font-medium text-[var(--verde-escuro)]">Visualizar Ata</span>
              <div className="flex items-center gap-2">
                <a
                  href={pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-[var(--muted-foreground)] hover:text-[var(--verde-escuro)] flex items-center gap-1"
                >
                  <Download size={13} /> Baixar
                </a>
                <button onClick={() => setPdfUrl(null)} className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] ml-1">
                  <X size={18} />
                </button>
              </div>
            </div>
            <iframe src={pdfUrl} className="flex-1 w-full rounded-b-xl border-0" title="Ata da Reunião" />
          </div>
        </div>
      )}
    </div>
  );
}
