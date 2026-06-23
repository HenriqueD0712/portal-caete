"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Clock, AlertCircle, Check, MessageSquare, Send, RotateCcw } from "lucide-react";
import { clienteResponderAprovacao } from "@/app/actions/aprovacoes";
import { cn } from "@/src/lib/utils";

type Aprovacao = {
  id: string;
  etapa: string;
  status: string;
  comentario?: string | null;
  updated_at: string;
};

function AprovacaoItem({ a }: { a: Aprovacao }) {
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState(a.status);
  const [comentarioLocal, setComentarioLocal] = useState(a.comentario ?? "");
  const [textoRevisao, setTextoRevisao] = useState(a.comentario ?? "");
  const [showForm, setShowForm] = useState(false);

  function aprovar() {
    startTransition(async () => {
      await clienteResponderAprovacao(a.id, "aprovado");
      setStatus("aprovado");
      setShowForm(false);
    });
  }

  function confirmarRevisao() {
    if (!textoRevisao.trim()) return;
    startTransition(async () => {
      await clienteResponderAprovacao(a.id, "revisao", textoRevisao);
      setComentarioLocal(textoRevisao);
      setStatus("revisao");
      setShowForm(false);
    });
  }

  const isPendente = status === "pendente";
  const isAprovado = status === "aprovado";
  const isRevisao = status === "revisao";

  return (
    <div
      className={cn(
        "rounded-xl border p-4 space-y-3 transition-all",
        isPendente && "bg-amber-50 border-amber-200",
        isAprovado && "bg-emerald-50 border-emerald-200",
        isRevisao && "bg-orange-50 border-orange-200"
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          {isPendente && <Clock size={16} className="text-amber-500 shrink-0 mt-0.5" />}
          {isAprovado && <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />}
          {isRevisao && <AlertCircle size={16} className="text-[var(--terracota)] shrink-0 mt-0.5" />}
          <div>
            <p className="text-xs text-[var(--muted-foreground)] capitalize">{a.etapa}</p>
            <p
              className={cn(
                "text-sm font-semibold",
                isPendente && "text-amber-700",
                isAprovado && "text-emerald-700",
                isRevisao && "text-[var(--terracota)]"
              )}
            >
              {isPendente && "Aguardando sua resposta"}
              {isAprovado && "Aprovado por você ✓"}
              {isRevisao && "Revisão solicitada"}
            </p>
          </div>
        </div>

        {!isPendente && (
          <button
            onClick={() => { setStatus("pendente"); setShowForm(false); }}
            disabled={isPending}
            className="flex items-center gap-1 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors shrink-0 disabled:opacity-50"
          >
            <RotateCcw size={11} /> Alterar
          </button>
        )}
      </div>

      {/* Comentário de revisão */}
      {isRevisao && comentarioLocal && !showForm && (
        <p className="text-xs text-[var(--muted-foreground)] italic border-l-2 border-[var(--terracota)]/40 pl-3">
          "{comentarioLocal}"
        </p>
      )}

      {/* Botões de ação (pendente) */}
      {isPendente && !showForm && (
        <div className="flex gap-2 pt-1">
          <button
            onClick={aprovar}
            disabled={isPending}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50"
          >
            <Check size={14} />
            {isPending ? "Enviando..." : "Aprovar"}
          </button>
          <button
            onClick={() => setShowForm(true)}
            disabled={isPending}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-[var(--terracota)] text-[var(--terracota)] text-sm font-medium hover:bg-[var(--terracota)] hover:text-white transition-colors disabled:opacity-50"
          >
            <MessageSquare size={14} /> Solicitar revisão
          </button>
        </div>
      )}

      {/* Formulário de revisão */}
      {showForm && (
        <div className="space-y-2 pt-1">
          <textarea
            value={textoRevisao}
            onChange={(e) => setTextoRevisao(e.target.value)}
            placeholder="Descreva o que precisa ser ajustado..."
            rows={3}
            autoFocus
            className="w-full border border-[var(--border)] rounded-lg px-3 py-2 text-sm outline-none focus:border-[var(--terracota)] bg-white resize-none"
          />
          <div className="flex gap-2">
            <button
              onClick={() => setShowForm(false)}
              disabled={isPending}
              className="px-3 py-1.5 text-sm border border-[var(--border)] rounded-lg bg-white hover:bg-[var(--creme-escuro)] transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={confirmarRevisao}
              disabled={isPending || !textoRevisao.trim()}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[var(--terracota)] text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              <Send size={13} />
              {isPending ? "Enviando..." : "Enviar revisão"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function AprovacoesCliente({ aprovacoes }: { aprovacoes: Aprovacao[] }) {
  if (!aprovacoes || aprovacoes.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-[var(--border)] px-5 py-6 text-center">
        <p className="text-sm text-[var(--muted-foreground)]">Nenhuma aprovação pendente no momento.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {aprovacoes.map((a) => (
        <AprovacaoItem key={a.id} a={a} />
      ))}
    </div>
  );
}
