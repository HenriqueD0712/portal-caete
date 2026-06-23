"use client";

import { useState } from "react";
import { createClient } from "@/src/lib/supabase/client";
import { CheckCircle2, RotateCcw } from "lucide-react";

interface Aprovacao {
  id: string;
  etapa: string;
  status: string;
  comentario: string | null;
}

interface Props {
  aprovacao: Aprovacao | null;
  etapa: string;
  clienteId: string;
}

export function AprovacaoCard({ aprovacao, etapa, clienteId }: Props) {
  const [status, setStatus] = useState(aprovacao?.status ?? "pendente");
  const [comentario, setComentario] = useState(aprovacao?.comentario ?? "");
  const [showComment, setShowComment] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const supabase = createClient();

  async function salvar(novoStatus: string, texto?: string) {
    setLoading(true);
    const payload = {
      cliente_id: clienteId,
      etapa,
      status: novoStatus,
      comentario: texto ?? null,
      updated_at: new Date().toISOString(),
    };

    if (aprovacao?.id) {
      await supabase.from("aprovacoes").update(payload).eq("id", aprovacao.id);
    } else {
      await supabase.from("aprovacoes").insert(payload);
    }

    setStatus(novoStatus);
    setSaved(true);
    setLoading(false);
    setTimeout(() => setSaved(false), 3000);
  }

  if (status === "aprovado") {
    return (
      <div className="flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm">
        <CheckCircle2 size={16} />
        <span className="font-medium">Etapa aprovada.</span>
        <button onClick={() => salvar("pendente")} className="ml-auto text-xs text-[var(--muted-foreground)] hover:underline">
          Desfazer
        </button>
      </div>
    );
  }

  if (status === "revisao" && !showComment) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm space-y-2">
        <div className="flex items-center gap-2 text-amber-700">
          <RotateCcw size={16} />
          <span className="font-medium">Revisão solicitada.</span>
          <button onClick={() => salvar("pendente")} className="ml-auto text-xs text-[var(--muted-foreground)] hover:underline">
            Desfazer
          </button>
        </div>
        {comentario && <p className="text-xs text-[var(--foreground)] whitespace-pre-line">{comentario}</p>}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-[var(--border)] p-4 space-y-3">
      <p className="text-sm font-medium text-[var(--verde-escuro)]">Sua avaliação desta etapa:</p>

      {showComment && etapa === "criativo" ? (
        <div className="space-y-3">
          <textarea
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
            placeholder="Descreva suas observações e alterações solicitadas..."
            rows={4}
            className="w-full text-sm border border-[var(--input)] rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-[var(--verde-escuro)] resize-none"
          />
          <div className="flex gap-2">
            <button
              onClick={() => { salvar("revisao", comentario); setShowComment(false); }}
              disabled={loading || !comentario.trim()}
              className="flex-1 h-9 rounded-md bg-amber-500 text-white text-sm font-medium hover:bg-amber-600 disabled:opacity-50 transition-colors"
            >
              {loading ? "Salvando..." : "Enviar revisão"}
            </button>
            <button
              onClick={() => setShowComment(false)}
              className="h-9 px-4 rounded-md border border-[var(--border)] text-sm hover:bg-[var(--creme)] transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <div className="flex gap-2">
          <button
            onClick={() => salvar("aprovado")}
            disabled={loading}
            className="flex-1 h-9 rounded-md bg-[var(--verde-escuro)] text-white text-sm font-medium hover:bg-[var(--verde-medio)] disabled:opacity-50 transition-colors flex items-center justify-center gap-1.5"
          >
            <CheckCircle2 size={14} />
            Aprovar
          </button>
          <button
            onClick={() => etapa === "criativo" ? setShowComment(true) : salvar("revisao")}
            disabled={loading}
            className="flex-1 h-9 rounded-md border border-amber-400 text-amber-600 text-sm font-medium hover:bg-amber-50 disabled:opacity-50 transition-colors flex items-center justify-center gap-1.5"
          >
            <RotateCcw size={14} />
            Revisão
          </button>
        </div>
      )}

      {saved && <p className="text-xs text-green-600">Salvo com sucesso!</p>}
    </div>
  );
}
