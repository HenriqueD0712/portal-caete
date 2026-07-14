import { getCachedUser, getCachedAccessToken } from "@/src/lib/supabase/user";
import { getUserData } from "@/src/lib/cache";
import { FileList } from "@/components/file-list";

export default async function OrcamentosPage() {
  const user = await getCachedUser();
  const token = await getCachedAccessToken();

  const arquivos = await getUserData(user!.id, token, "arquivos-orcamento", async (sb) =>
    (await sb
      .from("arquivos")
      .select("*")
      .eq("cliente_id", user!.id)
      .eq("categoria", "orcamento")
      .order("created_at", { ascending: false })).data ?? []
  );

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--verde-escuro)]">Orçamentos</h1>
        <p className="text-sm text-[var(--muted-foreground)] mt-1">Documentos de orçamentos do projeto.</p>
      </div>
      <FileList
        arquivos={arquivos ?? []}
        emptyLabel="Nenhum orçamento disponível ainda."
      />
    </div>
  );
}
