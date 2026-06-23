import { createClient } from "@/src/lib/supabase/server";
import { FileList } from "@/components/file-list";

export default async function ContratoPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: arquivos } = await supabase
    .from("arquivos")
    .select("*")
    .eq("cliente_id", user!.id)
    .eq("categoria", "contrato")
    .order("created_at", { ascending: false });

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--verde-escuro)]">Contrato</h1>
        <p className="text-sm text-[var(--muted-foreground)] mt-1">Contrato de prestação de serviços assinado.</p>
      </div>
      <FileList
        arquivos={arquivos ?? []}
        emptyLabel="Nenhum contrato disponível ainda."
      />
    </div>
  );
}
