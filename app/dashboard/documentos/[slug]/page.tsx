import { getCachedUser, getCachedAccessToken } from "@/src/lib/supabase/user";
import { getUserData } from "@/src/lib/cache";
import { notFound } from "next/navigation";
import { FileList } from "@/components/file-list";
import { abaLabel, abaSlug, isAba } from "@/src/config/abas";
import { siteText } from "@/src/config/site-text";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function DocumentosAbaPage({ params }: Props) {
  const { slug } = await params;

  const user = await getCachedUser();
  const token = await getCachedAccessToken();

  const todos = await getUserData(user!.id, token, "abas-docs", async (sb) =>
    (await sb
      .from("arquivos")
      .select("*")
      .eq("cliente_id", user!.id)
      .order("created_at", { ascending: false })).data ?? []
  );

  const arquivos = (todos as { id: string; nome: string; categoria: string; url: string; created_at: string }[])
    .filter((a) => isAba(a.categoria) && abaSlug(abaLabel(a.categoria)) === slug);

  if (arquivos.length === 0) notFound();

  const label = abaLabel(arquivos[0].categoria);

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <p className="text-xs text-[var(--muted-foreground)] uppercase tracking-widest mb-1">{siteText.nav.documentos}</p>
        <h1 className="text-2xl font-semibold text-[var(--verde-escuro)]">{label}</h1>
      </div>
      <FileList arquivos={arquivos} emptyLabel="Nenhum documento disponível ainda." />
    </div>
  );
}
