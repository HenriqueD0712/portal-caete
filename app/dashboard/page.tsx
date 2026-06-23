import { createClient } from "@/src/lib/supabase/server";
import { siteText } from "@/src/config/site-text";
import { navigation } from "@/src/config/navigation";
import Link from "next/link";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: aprovacoes } = await supabase
    .from("aprovacoes")
    .select("etapa, status")
    .eq("cliente_id", user!.id);

  const { data: cronograma } = await supabase
    .from("cronograma")
    .select("titulo, data_prevista, concluido")
    .eq("cliente_id", user!.id)
    .eq("concluido", false)
    .order("data_prevista")
    .limit(3);

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="font-display text-3xl text-[var(--verde-escuro)]">{siteText.siteName}</h1>
        <p className="text-[var(--muted-foreground)] mt-1">Bem-vindo ao seu portal de acompanhamento.</p>
      </div>

      {/* Status de aprovações */}
      {aprovacoes && aprovacoes.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-widest text-[var(--muted-foreground)] mb-3">Status do projeto</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {aprovacoes.map((a) => (
              <div key={a.etapa} className="bg-white rounded-lg border border-[var(--border)] p-4 flex items-center justify-between">
                <span className="text-sm font-medium capitalize">{a.etapa}</span>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                  a.status === "aprovado" ? "bg-green-100 text-green-700" :
                  a.status === "revisao" ? "bg-amber-100 text-amber-700" :
                  "bg-[var(--creme-escuro)] text-[var(--muted-foreground)]"
                }`}>
                  {a.status === "aprovado" ? "Aprovado" : a.status === "revisao" ? "Em revisão" : "Pendente"}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Próximas entregas */}
      {cronograma && cronograma.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-widest text-[var(--muted-foreground)] mb-3">Próximas entregas</h2>
          <div className="bg-white rounded-lg border border-[var(--border)] divide-y divide-[var(--border)]">
            {cronograma.map((item) => (
              <div key={item.titulo} className="flex items-center justify-between px-4 py-3">
                <span className="text-sm">{item.titulo}</span>
                <span className="text-xs text-[var(--muted-foreground)]">
                  {new Date(item.data_prevista).toLocaleDateString("pt-BR")}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Atalhos */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-widest text-[var(--muted-foreground)] mb-3">Seções</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {navigation.map((item) => (
            <Link
              key={item.id}
              href={item.subItems ? item.subItems[0].href : item.href}
              className="bg-white rounded-lg border border-[var(--border)] p-4 text-sm font-medium hover:border-[var(--verde-escuro)] hover:bg-[var(--creme)] transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
