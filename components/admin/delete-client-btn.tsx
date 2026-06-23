"use client";

import { useState, useTransition } from "react";
import { Trash2, AlertTriangle, X } from "lucide-react";
import { deleteClient } from "@/app/admin/actions";

export function DeleteClientBtn({ clienteId, nomeCliente }: { clienteId: string; nomeCliente: string }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function confirmar() {
    startTransition(async () => {
      await deleteClient(clienteId);
      setOpen(false);
    });
  }

  return (
    <>
      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(true); }}
        className="p-1.5 rounded-md text-[var(--muted-foreground)] hover:bg-red-50 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100"
        title="Deletar cliente"
      >
        <Trash2 size={14} />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setOpen(false)} className="absolute top-4 right-4 text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
              <X size={16} />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <AlertTriangle size={18} className="text-red-600" />
              </div>
              <div>
                <p className="font-semibold text-[var(--foreground)]">Deletar cliente</p>
                <p className="text-xs text-[var(--muted-foreground)]">Essa ação não pode ser desfeita</p>
              </div>
            </div>

            <p className="text-sm text-[var(--foreground)] mb-1">
              Tem certeza que deseja deletar <strong>{nomeCliente}</strong>?
            </p>
            <p className="text-xs text-[var(--muted-foreground)] mb-6">
              Todos os dados, arquivos e histórico deste cliente serão removidos permanentemente.
            </p>

            <div className="flex gap-2">
              <button onClick={() => setOpen(false)} disabled={isPending}
                className="flex-1 py-2 rounded-lg border border-[var(--border)] text-sm font-medium hover:bg-[var(--creme-escuro)] transition-colors disabled:opacity-50">
                Cancelar
              </button>
              <button onClick={confirmar} disabled={isPending}
                className="flex-1 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50">
                {isPending ? "Deletando..." : "Sim, deletar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
