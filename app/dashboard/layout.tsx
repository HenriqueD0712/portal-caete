import { Sidebar } from "@/components/sidebar";
export const dynamic = "force-dynamic";
import { getCachedUser, getCachedAccessToken } from "@/src/lib/supabase/user";
import { getUserData } from "@/src/lib/cache";
import { redirect } from "next/navigation";

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

  return (
    <div className="flex min-h-screen bg-[var(--creme)]">
      <Sidebar
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
