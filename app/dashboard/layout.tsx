import { Sidebar } from "@/components/sidebar";
export const dynamic = "force-dynamic";
import { getCachedUser, getCachedAccessToken } from "@/src/lib/supabase/user";
import { getUserData } from "@/src/lib/cache";
import { redirect } from "next/navigation";
import { abaLabel, abaSlug, isAba } from "@/src/config/abas";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCachedUser();
  if (!user) redirect("/");

  const token = await getCachedAccessToken();
  const profile = await getUserData(user.id, token, "layout-profile", async (sb) =>
    (await sb
      .from("profiles")
      .select("nome, nome_projeto, subcategorias_executivo")
      .eq("id", user.id)
      .single()).data
  );

  // Abas de documentos criadas pelo admin (ex: "Briefing") → itens do menu.
  const categorias = await getUserData(user.id, token, "layout-abas", async (sb) =>
    ((await sb.from("arquivos").select("categoria").eq("cliente_id", user.id)).data ?? []) as { categoria: string }[]
  );
  const abas = Array.from(new Set(categorias.map((c) => c.categoria).filter(isAba)))
    .map((c) => ({ label: abaLabel(c), href: `/dashboard/documentos/${abaSlug(abaLabel(c))}` }));

  return (
    <div className="flex min-h-screen bg-[var(--creme)]">
      <Sidebar
        abas={abas}
        nomeProjeto={profile?.nome_projeto ?? undefined}
        nome={profile?.nome ?? undefined}
        subcategoriasExecutivo={(profile as { subcategorias_executivo?: string[] } | null)?.subcategorias_executivo ?? []}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <div className="h-14 lg:hidden shrink-0" />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
