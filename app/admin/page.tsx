import Link from "next/link";
import { getAllClients, getTotalStorage } from "./queries";
import { NovoClienteModal } from "@/components/admin/novo-cliente-modal";
import { DeleteClientBtn } from "@/components/admin/delete-client-btn";
import { Users, FolderOpen, Calendar, HardDrive } from "lucide-react";

export const dynamic = "force-dynamic";

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 MB";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

export default async function AdminPage() {
  const [clientes, totalBytes] = await Promise.all([
    getAllClients(),
    getTotalStorage(),
  ]);

  return (
    <div className="space-y-6 max-w-5xl">

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white border border-[var(--border)] rounded-lg p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-[var(--creme-escuro)] flex items-center justify-center shrink-0">
            <Users size={18} className="text-[var(--verde-escuro)]" />
          </div>
          <div>
            <p className="text-2xl font-bold text-[var(--verde-escuro)]">{clientes.length}</p>
            <p className="text-xs text-[var(--muted-foreground)] mt-0.5">Clientes cadastrados</p>
          </div>
        </div>

        <div className="bg-white border border-[var(--border)] rounded-lg p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-[var(--creme-escuro)] flex items-center justify-center shrink-0">
            <HardDrive size={18} className="text-[var(--verde-escuro)]" />
          </div>
          <div>
            <p className="text-2xl font-bold text-[var(--verde-escuro)]">{formatBytes(totalBytes)}</p>
            <p className="text-xs text-[var(--muted-foreground)] mt-0.5">Armazenamento usado no R2</p>
          </div>
        </div>
      </div>

      {/* Client list */}
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-[var(--verde-escuro)]">Clientes</h1>
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
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[var(--muted-foreground)] flex items-center gap-1">
                    <Calendar size={11} />
                    {new Date(c.created_at).toLocaleDateString("pt-BR")}
                  </span>
                  <DeleteClientBtn clienteId={c.id} nomeCliente={c.nome ?? "cliente"} />
                </div>
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
