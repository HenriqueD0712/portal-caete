import { createClient } from "@/src/lib/supabase/server";
import Link from "next/link";
import {
  FileText, Calendar, BarChart2, Image as ImageIcon,
  Eye, Building2, Shield, MessageSquare, Table2,
  ChevronRight, CheckCircle2, Clock, AlertCircle, Layers, Hammer, Mountain,
} from "lucide-react";

const navCards = [
  { id: "orcamentos",   label: "Orçamentos",    href: "/dashboard/orcamentos",              icon: FileText,     desc: "Documentos e propostas" },
  { id: "cronograma",   label: "Cronograma",     href: "/dashboard/cronograma",              icon: Calendar,     desc: "Datas de entrega" },
  { id: "progresso",    label: "Progresso",      href: "/dashboard/progresso",               icon: BarChart2,    desc: "Etapas do projeto" },
  { id: "visual",       label: "Visual 3D",      href: "/dashboard/midias/visual",           icon: Layers,       desc: "Renders e visualizações" },
  { id: "panoramas",    label: "Panoramas 360°", href: "/dashboard/midias/panoramas",        icon: Eye,          desc: "Ambientes em 360°" },
  { id: "obra",         label: "Executivo",      href: "/dashboard/executivo/obra",          icon: Building2,    desc: "Obra, Marcenaria e Marmoraria" },
  { id: "cuidados",     label: "Cuidados",       href: "/dashboard/cuidados",                icon: Shield,       desc: "Guia de materiais" },
  { id: "reunioes",     label: "Reuniões",       href: "/dashboard/reunioes",                icon: MessageSquare,desc: "Atas e anotações" },
  { id: "planilhas",    label: "Planilhas",      href: "/dashboard/planilhas",               icon: Table2,       desc: "Orçamentos detalhados" },
];

const statusConfig = {
  aprovado: { label: "Aprovado",        icon: CheckCircle2,  color: "text-emerald-600", bg: "bg-emerald-50",  border: "border-emerald-200" },
  pendente: { label: "Aguardando",      icon: Clock,         color: "text-amber-600",   bg: "bg-amber-50",    border: "border-amber-200"   },
  revisao:  { label: "Em revisão",      icon: AlertCircle,   color: "text-[var(--terracota)]", bg: "bg-orange-50", border: "border-orange-200" },
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [profileRes, aprovRes, progressoRes, cronogramaRes, destaqueRes] = await Promise.all([
    supabase.from("profiles").select("nome, nome_projeto").eq("id", user!.id).single(),
    supabase.from("aprovacoes").select("etapa, status").eq("cliente_id", user!.id),
    supabase.from("progresso").select("etapa, percentual").eq("cliente_id", user!.id),
    supabase.from("cronograma").select("titulo, data_prevista, concluido").eq("cliente_id", user!.id).eq("concluido", false).order("data_prevista").limit(3),
    supabase.from("arquivos").select("url, nome").eq("cliente_id", user!.id).eq("categoria", "destaque").order("created_at", { ascending: false }).limit(1),
  ]);

  const profile = profileRes.data;
  const aprovacoes = aprovRes.data ?? [];
  const progresso = progressoRes.data ?? [];
  const cronograma = cronogramaRes.data ?? [];
  const destaque = destaqueRes.data?.[0] ?? null;

  const mediaEtapa = (etapa: string) => {
    const itens = progresso.filter(p => p.etapa === etapa);
    if (!itens.length) return null;
    return Math.round(itens.reduce((acc, i) => acc + i.percentual, 0) / itens.length);
  };

  const mediaCriativo = mediaEtapa("criativo");
  const mediaExecutivo = mediaEtapa("executivo");
  const temProgresso = mediaCriativo !== null || mediaExecutivo !== null;

  const hoje = new Date();

  return (
    <div className="space-y-8 max-w-4xl">

      {/* ── Hero: Imagem em Destaque ── */}
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
          {profile?.nome && (
            <p className="text-white/70 text-sm mt-1">Olá, {profile.nome}</p>
          )}
        </div>
      </div>

      {/* ── Progresso Geral ── */}
      {temProgresso && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-[var(--muted-foreground)]">Progresso do Projeto</h2>
            <Link href="/dashboard/progresso" className="text-xs text-[var(--terracota)] hover:underline flex items-center gap-1">
              Ver detalhes <ChevronRight size={12} />
            </Link>
          </div>
          <div className="bg-white rounded-xl border border-[var(--border)] divide-y divide-[var(--border)]">
            {mediaCriativo !== null && (
              <div className="px-5 py-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Etapa Criativa</span>
                  <span className="text-sm font-bold text-[var(--verde-escuro)]">{mediaCriativo}%</span>
                </div>
                <div className="w-full bg-[var(--creme-escuro)] rounded-full h-2">
                  <div
                    className="h-2 rounded-full transition-all duration-700"
                    style={{
                      width: `${mediaCriativo}%`,
                      background: mediaCriativo === 100
                        ? "var(--verde-escuro)"
                        : "linear-gradient(90deg, var(--terracota), var(--terracota-claro))",
                    }}
                  />
                </div>
              </div>
            )}
            {mediaExecutivo !== null && (
              <div className="px-5 py-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Etapa Executiva</span>
                  <span className="text-sm font-bold text-[var(--verde-escuro)]">{mediaExecutivo}%</span>
                </div>
                <div className="w-full bg-[var(--creme-escuro)] rounded-full h-2">
                  <div
                    className="h-2 rounded-full transition-all duration-700"
                    style={{
                      width: `${mediaExecutivo}%`,
                      background: mediaExecutivo === 100
                        ? "var(--verde-escuro)"
                        : "linear-gradient(90deg, var(--verde-escuro), var(--verde-claro))",
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── Status de Aprovações ── */}
      {aprovacoes.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-[var(--muted-foreground)] mb-4">Status de Aprovação</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {aprovacoes.map((a) => {
              const cfg = statusConfig[a.status as keyof typeof statusConfig] ?? statusConfig.pendente;
              const Icon = cfg.icon;
              return (
                <div key={a.etapa} className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${cfg.bg} ${cfg.border}`}>
                  <Icon size={18} className={cfg.color} />
                  <div>
                    <p className="text-xs text-[var(--muted-foreground)] capitalize">{a.etapa}</p>
                    <p className={`text-sm font-semibold ${cfg.color}`}>{cfg.label}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ── Próximas Entregas ── */}
      {cronograma.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-[var(--muted-foreground)]">Próximas Entregas</h2>
            <Link href="/dashboard/cronograma" className="text-xs text-[var(--terracota)] hover:underline flex items-center gap-1">
              Ver todas <ChevronRight size={12} />
            </Link>
          </div>
          <div className="bg-white rounded-xl border border-[var(--border)] divide-y divide-[var(--border)]">
            {cronograma.map((item) => {
              const data = new Date(item.data_prevista + "T12:00:00");
              const atrasado = data < hoje && !item.concluido;
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
                <p className="text-sm font-semibold text-[var(--foreground)]">{label}</p>
                <p className="text-xs text-[var(--muted-foreground)] mt-0.5 leading-relaxed">{desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

    </div>
  );
}
