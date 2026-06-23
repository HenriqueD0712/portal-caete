import { Sidebar } from "@/components/sidebar";
import { createClient } from "@/src/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const { data: profile } = await supabase
    .from("profiles")
    .select("nome, nome_projeto, subcategorias_executivo")
    .eq("id", user.id)
    .single();

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
