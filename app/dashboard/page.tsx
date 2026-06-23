import { createClient } from "@/src/lib/supabase/server";
import Link from "next/link";
import {
  FileText, Calendar, Eye, Building2,
  Shield, MessageSquare, Table2, ChevronRight, Layers,
} from "lucide-react";
import { AprovacoesCliente } from "@/components/aprovacoes-cliente";

const navCards = [
  { id: "apresentacao3d", label: "Apresentação 3D", href: "/dashboard/midias/visual",    icon: Layers,        desc: "Renders e visualizações" },
  { id: "panoramas",      label: "Panoramas 360°",  href: "/dashboard/midias/panoramas", icon: Eye,           desc: "Ambientes em 360°" },
  { id: "executivo",      label: "Executivo",        href: "/dashboard/executivo",        icon: Building2,     desc: "Projetos e documentos técnicos" },
  { id: "planilhas",      label: "Planilhas",        href: "/dashboard/planilhas",        icon: Table2,        desc: "Orçamentos detalhados" },
  { id: "orcamentos",     label: "Orçamentos",       href: "/dashboard/orcamentos",       icon: FileText,      desc: "Documentos e propostas" },
  { id: "reunioes",       label: "Reuniões",         href: "/dashboard/reunioes",         icon: MessageSquare, desc: "Atas e anotações" },
  { id: "cuidados",       label: "Cuidados",         href: "/dashboard/cuidados",         icon: Shield,        desc: "Guia de materiais" },
];


function formatDate(d: string | null | undefined) {
  if (!d) return null;
  return new Date(d + "T12:00:00").toLocaleDateString("pt-BR");
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [profileRes, aprovRes, cronogramaRes, destaqueRes] = await Promise.all([
    supabase.from("profiles")
      .select("nome, nome_projeto, progresso_criativo, progresso_executivo, data_entrega_criativo, data_entrega_executivo")
      .eq("id", user!.id).single(),
    supabase.from("aprovacoes").select("id, etapa, status, comentario, updated_at").eq("cliente_id", user!.id).order("created_at"),
    supabase.from("cronograma").select("titulo, data_prevista, concluido").eq("cliente_id", user!.id).eq("concluido", false).order("data_prevista").limit(3),
    supabase.from("arquivos").select("url, nome").eq("cliente_id", user!.id).eq("categoria", "destaque").order("created_at", { ascending: false }).limit(1),
  ]);

  const profile = profileRes.data;
  const aprovacoes = aprovRes.data ?? [];
  const cronograma = cronogramaRes.data ?? [];
  const destaque = destaqueRes.data?.[0] ?? null;

  const pCriativo = profile?.progresso_criativo ?? 0;
  const pExecutivo = profile?.progresso_executivo ?? 0;
  const dataCriativo = formatDate(profile?.data_entrega_criativo);
  const dataExecutivo = formatDate(profile?.data_entrega_executivo);

  const hoje = new Date();

  return (
    <div className="space-y-8 max-w-4xl">

      {/* ── Hero ── */}
      <div className={`relative w-full rounded-2xl overflow-hidden ${destaque ? "h-64 sm:h-80" : "h-40"}`}>
        {destaque ? (
          <>
            <img src={destaque.url} alt={destaque.nome} className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--verde-escuro)]/80 via-[var(--verde-escuro)]/20 to-transparent" />
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--verde-escuro)] to-[var(--verde-medio)]" />
        )}
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <p className="text-white/60 text-xs uppercase tracking-widest mb-1">Projeto</p>
          <h1 className="font-display text-2xl sm:text-3xl text-white leading-tight">
            {profile?.nome_projeto ?? "Meu Projeto"}
          </h1>
          {profile?.nome && <p className="text-white/70 text-sm mt-1">Olá, {profile.nome}</p>}
        </div>
      </div>

      {/* ── Progresso ── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-[var(--muted-foreground)]">Progresso do Projeto</h2>
          <span />
        </div>
        <div className="bg-white rounded-xl border border-[var(--border)] divide-y divide-[var(--border)]">
          {/* Criativo */}
          <div className="px-5 py-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-semibold">Etapa Criativa</p>
                {dataCriativo && (
                  <p className="text-xs text-[var(--muted-foreground)] mt-0.5 flex items-center gap-1">
                    <Calendar size={10} /> Prazo: {dataCriativo}
                  </p>
                )}
              </div>
              <span className="text-2xl font-bold text-[var(--verde-escuro)]">{pCriativo}%</span>
            </div>
            <div className="w-full bg-[var(--creme-escuro)] rounded-full h-2.5">
              <div
                className="h-2.5 rounded-full transition-all duration-700"
                style={{
                  width: `${pCriativo}%`,
                  background: pCriativo === 100
                    ? "var(--verde-escuro)"
                    : "linear-gradient(90deg, var(--terracota), var(--terracota-claro))",
                }}
              />
            </div>
          </div>
          {/* Executivo */}
          <div className="px-5 py-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-semibold">Etapa Executiva</p>
                {dataExecutivo && (
                  <p className="text-xs text-[var(--muted-foreground)] mt-0.5 flex items-center gap-1">
                    <Calendar size={10} /> Prazo: {dataExecutivo}
                  </p>
                )}
              </div>
              <span className="text-2xl font-bold text-[var(--verde-escuro)]">{pExecutivo}%</span>
            </div>
            <div className="w-full bg-[var(--creme-escuro)] rounded-full h-2.5">
              <div
                className="h-2.5 rounded-full transition-all duration-700"
                style={{
                  width: `${pExecutivo}%`,
                  background: pExecutivo === 100
                    ? "var(--verde-escuro)"
                    : "linear-gradient(90deg, var(--verde-escuro), var(--verde-claro))",
                }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── Aprovações ── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-[var(--muted-foreground)]">Aprovações</h2>
        </div>
        <AprovacoesCliente aprovacoes={aprovacoes} />
      </section>

      {/* ── Próximas Entregas ── */}
      {cronograma.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-[var(--muted-foreground)]">Próximas Entregas</h2>
            <Link href="/dashboard/cronograma" className="text-xs text-[var(--terracota)] hover:underline flex items-center gap-1 font-medium">
              Ver todas <ChevronRight size={12} />
            </Link>
          </div>
          <div className="bg-white rounded-xl border border-[var(--border)] divide-y divide-[var(--border)]">
            {cronograma.map((item) => {
              const data = new Date(item.data_prevista + "T12:00:00");
              const atrasado = data < hoje;
              return (
                <div key={item.titulo} className="flex items-center justify-between px-5 py-3.5 gap-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${atrasado ? "bg-[var(--terracota)]" : "bg-[var(--verde-claro)]"}`} />
                    <span className="text-sm">{item.titulo}</span>
                  </div>
                  <span className={`text-xs shrink-0 font-medium ${atrasado ? "text-[var(--terracota)]" : "text-[var(--muted-foreground)]"}`}>
                    {data.toLocaleDateString("pt-BR")}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ── Navegação Rápida ── */}
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-widest text-[var(--muted-foreground)] mb-4">Seções do Portal</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {navCards.map(({ id, label, href, icon: Icon, desc }) => (
            <Link
              key={id}
              href={href}
              className="group bg-white rounded-xl border border-[var(--border)] p-4 hover:border-[var(--terracota)] hover:shadow-md transition-all duration-200 flex flex-col gap-3"
            >
              <div className="w-9 h-9 rounded-lg bg-[var(--creme-escuro)] flex items-center justify-center group-hover:bg-[var(--terracota)] transition-colors duration-200">
                <Icon size={16} className="text-[var(--verde-escuro)] group-hover:text-white transition-colors duration-200" />
              </div>
              <div>
                <p className="text-sm font-semibold">{label}</p>
                <p className="text-xs text-[var(--muted-foreground)] mt-0.5 leading-relaxed">{desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

    </div>
  );
}
