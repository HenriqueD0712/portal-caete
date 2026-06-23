import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { createClient } from "@/src/lib/supabase/server";
import { redirect } from "next/navigation";
import { ADMIN_EMAIL } from "./config";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email !== ADMIN_EMAIL) redirect("/");

  return (
    <div className="flex min-h-screen bg-[var(--creme)]">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-[var(--border)] px-6 py-4 flex items-center justify-between lg:pl-6 pl-16">
          <div>
            <p className="text-xs text-[var(--muted-foreground)] uppercase tracking-widest">Estúdio Caeté</p>
            <h2 className="font-sans font-semibold text-[var(--verde-escuro)]">Painel Administrativo</h2>
          </div>
          <span className="text-xs bg-[var(--terracota)] text-white px-2.5 py-1 rounded-full font-medium">
            {user.email}
          </span>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
