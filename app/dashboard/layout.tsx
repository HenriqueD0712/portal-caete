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
    .select("nome, nome_projeto")
    .eq("id", user.id)
    .single();

  return (
    <div className="flex min-h-screen bg-[var(--creme)]">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="bg-white border-b border-[var(--border)] px-6 py-4 flex items-center justify-between lg:pl-6 pl-16">
          <div>
            <p className="text-xs text-[var(--muted-foreground)] uppercase tracking-widest">Projeto</p>
            <h2 className="font-sans font-semibold text-[var(--verde-escuro)]">
              {profile?.nome_projeto ?? "Sem título"}
            </h2>
          </div>
          <p className="text-sm text-[var(--muted-foreground)] hidden sm:block">
            Olá, {profile?.nome ?? user.email}
          </p>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
