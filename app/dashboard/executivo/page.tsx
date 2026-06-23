import { createClient } from "@/src/lib/supabase/server";
import Link from "next/link";
import { Building2, FileText } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ExecutivoPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profileData } = await supabase
    .from("profiles")
    .select("subcategorias_executivo")
    .eq("id", user!.id)
    .single();

  const subcategorias: string[] =
    (profileData as { subcategorias_executivo?: string[] } | null)?.subcategorias_executivo ?? [];

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--verde-escuro)]">Executivo</h1>
        <p className="text-sm text-[var(--muted-foreground)] mt-1">Documentação técnica do projeto</p>
      </div>

      {subcategorias.length === 0 ? (
        <div className="bg-white rounded-lg border border-[var(--border)] p-12 text-center">
          <Building2 size={32} className="mx-auto text-[var(--muted-foreground)] mb-3" />
          <p className="text-sm text-[var(--muted-foreground)]">Nenhuma categoria disponível ainda.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {subcategorias.map((sub) => (
            <Link
              key={sub}
              href={`/dashboard/executivo/${sub}`}
              className="group bg-white rounded-xl border border-[var(--border)] p-5 hover:border-[var(--terracota)] hover:shadow-md transition-all duration-200 flex flex-col gap-3"
            >
              <div className="w-9 h-9 rounded-lg bg-[var(--creme-escuro)] flex items-center justify-center group-hover:bg-[var(--terracota)] transition-colors duration-200">
                <FileText size={16} className="text-[var(--verde-escuro)] group-hover:text-white transition-colors duration-200" />
              </div>
              <p className="text-sm font-semibold">
                {sub.charAt(0).toUpperCase() + sub.slice(1).replace(/_/g, " ")}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
