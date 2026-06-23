import { getClientData } from "@/app/admin/actions";
import { TabsCliente } from "@/components/admin/tabs-cliente";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default async function ClientePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getClientData(id);
  if (!data.profile) notFound();

  return (
    <div className="space-y-5 max-w-5xl">
      <div className="flex items-center gap-3">
        <Link href="/admin" className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] flex items-center gap-1 text-sm">
          <ChevronLeft size={14} />
          Clientes
        </Link>
        <span className="text-[var(--border)]">/</span>
        <span className="text-sm font-medium">{data.profile.nome}</span>
      </div>
      <TabsCliente clienteId={id} initialData={data} />
    </div>
  );
}
