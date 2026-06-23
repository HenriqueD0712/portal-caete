import { createClient } from "@/src/lib/supabase/server";
import { notFound } from "next/navigation";
import { FileList } from "@/components/file-list";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ submenu: string }>;
}

export default async function ExecutivoSubmenuPage({ params }: Props) {
  const { submenu } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profileData } = await supabase
    .from("profiles")
    .select("subcategorias_executivo")
    .eq("id", user!.id)
    .single();

  const subcategorias: string[] =
    (profileData as { subcategorias_executivo?: string[] } | null)?.subcategorias_executivo ?? [];

  if (!subcategorias.includes(submenu)) notFound();

  const label = submenu.charAt(0).toUpperCase() + submenu.slice(1);

  const { data: arquivos } = await supabase
    .from("arquivos")
    .select("*")
    .eq("cliente_id", user!.id)
    .eq("categoria", submenu)
    .order("created_at", { ascending: false });

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <p className="text-xs text-[var(--muted-foreground)] uppercase tracking-widest mb-1">Executivo</p>
        <h1 className="text-2xl font-semibold text-[var(--verde-escuro)]">{label}</h1>
      </div>
      <FileList
        arquivos={arquivos ?? []}
        emptyLabel={`Nenhum arquivo de ${label.toLowerCase()} disponível ainda.`}
      />
    </div>
  );
}
