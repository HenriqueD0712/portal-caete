"use client";

import { useState, useTransition } from "react";
import { Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { createNewClient } from "@/app/admin/actions";

export function NovoClienteModal() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const nome = fd.get("nome") as string;
    const nomeProjeto = fd.get("nomeProjeto") as string;
    const email = fd.get("email") as string;
    const password = fd.get("password") as string;

    startTransition(async () => {
      try {
        await createNewClient(email, password, nome, nomeProjeto);
        setOpen(false);
        setError("");
        router.refresh();
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Erro ao criar cliente");
      }
    });
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 bg-[var(--verde-escuro)] text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-[var(--verde-medio)] transition-colors"
      >
        <Plus size={15} />
        Novo cliente
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-[var(--border)]">
              <h2 className="font-semibold text-[var(--verde-escuro)]">Novo cliente</h2>
              <button onClick={() => setOpen(false)} className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wide">Nome</label>
                  <input name="nome" required placeholder="Ex: João Silva" className="input-admin" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wide">Projeto</label>
                  <input name="nomeProjeto" placeholder="Ex: Casa no Lago" className="input-admin" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wide">E-mail</label>
                <input name="email" type="email" required placeholder="cliente@email.com" className="input-admin" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wide">Senha inicial</label>
                <input name="password" type="password" required minLength={6} placeholder="Mínimo 6 caracteres" className="input-admin" />
              </div>

              {error && <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-md">{error}</p>}

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex-1 px-4 py-2 text-sm border border-[var(--border)] rounded-md hover:bg-[var(--creme-escuro)] transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 px-4 py-2 text-sm bg-[var(--verde-escuro)] text-white rounded-md hover:bg-[var(--verde-medio)] transition-colors disabled:opacity-50"
                >
                  {isPending ? "Criando..." : "Criar cliente"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`.input-admin { width: 100%; border: 1px solid var(--border); border-radius: 6px; padding: 8px 12px; font-size: 14px; outline: none; background: white; } .input-admin:focus { border-color: var(--verde-escuro); box-shadow: 0 0 0 2px color-mix(in srgb, var(--verde-escuro) 15%, transparent); }`}</style>
    </>
  );
}
