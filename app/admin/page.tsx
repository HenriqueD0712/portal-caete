import Link from "next/link";
import { getAllClients } from "./actions";
import { NovoClienteModal } from "@/components/admin/novo-cliente-modal";
import { Users, FolderOpen, Calendar } from "lucide-react";

export default async function AdminPage() {
  const clientes = await getAllClients();

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--verde-escuro)]">Clientes</h1>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">{clientes.length} cliente(s) cadastrado(s)</p>
        </div>
        <NovoClienteModal />
      </div>

      {clientes.length === 0 ? (
        <div className="bg-white rounded-lg border border-[var(--border)] p-16 text-center">
          <Users size={32} className="mx-auto text-[var(--muted-foreground)] mb-3" />
          <p className="text-sm text-[var(--muted-foreground)]">Nenhum cliente ainda. Clique em "Novo cliente" para começar.</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {clientes.map((c) => (
            <Link
              key={c.id}
              href={`/admin/clientes/${c.id}`}
              className="bg-white border border-[var(--border)] rounded-lg p-5 hover:border-[var(--verde-escuro)] hover:shadow-sm transition-all group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-9 h-9 rounded-full bg-[var(--creme-escuro)] flex items-center justify-center text-[var(--verde-escuro)] font-semibold text-sm group-hover:bg-[var(--verde-escuro)] group-hover:text-white transition-colors">
                  {c.nome?.charAt(0)?.toUpperCase() ?? "?"}
                </div>
                <span className="text-xs text-[var(--muted-foreground)] flex items-center gap-1">
                  <Calendar size={11} />
                  {new Date(c.created_at).toLocaleDateString("pt-BR")}
                </span>
              </div>
              <p className="font-medium text-[var(--foreground)] text-sm">{c.nome}</p>
              {c.nome_projeto && (
                <p className="text-xs text-[var(--muted-foreground)] mt-0.5 flex items-center gap-1">
                  <FolderOpen size={11} />
                  {c.nome_projeto}
                </p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
