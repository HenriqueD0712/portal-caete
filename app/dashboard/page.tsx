import { createClient } from "@/src/lib/supabase/server";
import Link from "next/link";
import {
  FileText, Calendar, Eye, Building2,
  Shield, MessageSquare, Table2, ChevronRight, Layers, Video, MapPin, ExternalLink,
} from "lucide-react";
import { AprovacoesCliente } from "@/components/aprovacoes-cliente";

const navCards = [
  { id: "apresentacao3d", label: "Apresentação 3D", href: "/dashboard/midias/visual",    icon: Layers,        desc: "Renders e visualizações" },
  { id: "panoramas",      label: "Panoramas 360°",  href: "/dashboard/midias/panoramas", icon: Eye,           desc: "Ambientes em 360°" },
  { id: "executivo",      label: "Executivo",        href: "/dashboard/executivo",        icon: Building2,     desc: "Projetos e documentos técnicos" },
  { id: "planilhas",      label: "Planilhas e Cadernos", href: "/dashboard/planilhas",    icon: Table2,        desc: "Planilhas e cadernos do projeto" },
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

  const [profileRes, aprovRes, cronogramaRes, destaqueRes, agendaRes] = await Promise.all([
    supabase.from("profiles")
      .select("nome, nome_projeto, progresso_criativo, progresso_executivo, data_entrega_criativo, data_entrega_executivo")
      .eq("id", user!.id).single(),
    supabase.from("aprovacoes").select("id, etapa, status, comentario, updated_at, bloqueado").eq("cliente_id", user!.id).order("created_at"),
    supabase.from("cronograma").select("titulo, data_prevista, concluido").eq("cliente_id", user!.id).eq("concluido", false).order("data_prevista").limit(3),
    supabase.from("arquivos").select("url, nome").eq("cliente_id", user!.id).eq("categoria", "destaque").order("created_at", { ascending: false }).limit(1),
    supabase.from("reunioes_agendadas").select("id, data_reuniao, horario, modalidade, assunto, link_reuniao, local_reuniao").eq("cliente_id", user!.id).gte("data_reuniao", new Date().toISOString().slice(0, 10)).order("data_reuniao").order("horario").limit(5),
  ]);

  const profile = profileRes.data;
  const aprovacoes = aprovRes.data ?? [];
  const cronograma = cronogramaRes.data ?? [];
  const destaque = destaqueRes.data?.[0] ?? null;
  const agenda = agendaRes.data ?? [];

  const pCriativo = profile?.progresso_criativo ?? 0;
  const pExecutivo = profile?.progresso_executivo ?? 0;
  const dataCriativo = formatDate(profile?.data_entrega_criativo);
  const dataExecutivo = formatDate(profile?.data_entrega_executivo);

  const hoje = new Date();

  return (
    <div className="space-y-6 sm:space-y-8 max-w-4xl">

      {/* ── Hero ── */}
      <div className={`relative w-full rounded-2xl overflow-hidden ${destaque ? "h-56 sm:h-80" : "h-36 sm:h-48"}`}>
        {destaque ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={destaque.url} alt={destaque.nome} className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--verde-escuro)] to-[var(--verde-medio)]" />
        )}
        <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-7">
          <p className="text-white/50 text-[10px] uppercase tracking-[0.2em] mb-1">Projeto</p>
          <h1 className="font-display text-2xl sm:text-3xl text-white leading-tight font-semibold">
            {profile?.nome_projeto ?? "Meu Projeto"}
          </h1>
          {profile?.nome && (
            <p className="text-white/60 text-sm mt-1.5">Olá, {profile.nome}</p>
          )}
        </div>
      </div>

      {/* ── Progresso ── */}
      <section>
        <h2 className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--muted-foreground)] mb-3">Progresso do Projeto</h2>
        <div className="bg-white rounded-2xl border border-[var(--border)] divide-y divide-[var(--border)]">
          {[
            { label: "Etapa Criativa", pct: pCriativo, data: dataCriativo, gradient: "linear-gradient(90deg, var(--terracota), var(--terracota-claro))" },
            { label: "Etapa Executiva", pct: pExecutivo, data: dataExecutivo, gradient: "linear-gradient(90deg, var(--verde-escuro), var(--verde-claro))" },
          ].map(({ label, pct, data, gradient }) => (
            <div key={label} className="px-5 py-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm font-semibold">{label}</p>
                  {data && (
                    <p className="text-xs text-[var(--muted-foreground)] mt-0.5 flex items-center gap-1">
                      <Calendar size={10} /> Prazo: {data}
                    </p>
                  )}
                </div>
                <span className="text-3xl font-bold text-[var(--verde-escuro)] tabular-nums">{pct}%</span>
              </div>
              <div className="w-full bg-[var(--creme-escuro)] rounded-full h-3">
                <div className="h-3 rounded-full transition-all duration-700"
                  style={{ width: `${pct}%`, background: pct === 100 ? "var(--verde-escuro)" : gradient }} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Próximas Reuniões ── */}
      {agenda.length > 0 && (
        <section>
          <h2 className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--muted-foreground)] mb-3">Próximas Reuniões</h2>
          <div className="space-y-3">
            {agenda.map((r) => {
              const data = new Date(r.data_reuniao + "T12:00:00");
              const diasRestantes = Math.ceil((data.getTime() - new Date().setHours(0,0,0,0)) / 86400000);
              const isHoje = diasRestantes === 0;
              const isAmanha = diasRestantes === 1;
              const badge = isHoje ? "Hoje" : isAmanha ? "Amanhã" : `Em ${diasRestantes} dias`;
              const badgeColor = isHoje ? "bg-[var(--terracota)] text-white" : isAmanha ? "bg-amber-100 text-amber-700" : "bg-[var(--creme-escuro)] text-[var(--muted-foreground)]";

              return (
                <div key={r.id} className="bg-white rounded-2xl border border-[var(--border)] p-4 flex gap-4 items-start">
                  {/* Data bloco */}
                  <div className={`shrink-0 w-14 h-14 rounded-xl flex flex-col items-center justify-center ${isHoje ? "bg-[var(--terracota)]" : "bg-[var(--creme-escuro)]"}`}>
                    <span className={`text-xs font-semibold uppercase ${isHoje ? "text-white/80" : "text-[var(--muted-foreground)]"}`}>
                      {data.toLocaleDateString("pt-BR", { month: "short" })}
                    </span>
                    <span className={`text-xl font-bold leading-none ${isHoje ? "text-white" : "text-[var(--verde-escuro)]"}`}>
                      {data.getDate()}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badgeColor}`}>{badge}</span>
                      <span className="text-xs text-[var(--muted-foreground)]">às {r.horario.slice(0, 5)}</span>
                    </div>
                    {r.assunto && <p className="text-sm font-semibold text-[var(--foreground)] leading-tight">{r.assunto}</p>}
                    <div className="flex items-center gap-1.5 mt-1.5">
                      {r.modalidade === "online" ? (
                        <>
                          <Video size={13} className="text-blue-500 shrink-0" />
                          <span className="text-xs text-[var(--muted-foreground)]">Online</span>
                          {r.link_reuniao && (
                            <a href={r.link_reuniao} target="_blank" rel="noopener noreferrer"
                              className="ml-1 flex items-center gap-1 text-xs font-medium text-[var(--verde-escuro)] hover:underline">
                              Entrar na reunião <ExternalLink size={11} />
                            </a>
                          )}
                        </>
                      ) : (
                        <>
                          <MapPin size={13} className="text-[var(--terracota)] shrink-0" />
                          <span className="text-xs text-[var(--muted-foreground)]">{r.local_reuniao ?? "Presencial"}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

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
        <h2 className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--muted-foreground)] mb-3">Seções do Portal</h2>

        {/* Mobile: lista vertical elegante */}
        <div className="sm:hidden bg-white rounded-2xl border border-[var(--border)] overflow-hidden divide-y divide-[var(--border)]">
          {navCards.map(({ id, label, href, icon: Icon, desc }) => (
            <Link key={id} href={href}
              className="flex items-center gap-4 px-5 py-4 active:bg-[var(--creme)] transition-colors">
              <div className="w-10 h-10 rounded-xl bg-[var(--creme-escuro)] flex items-center justify-center shrink-0">
                <Icon size={17} className="text-[var(--verde-escuro)]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold leading-tight">{label}</p>
                <p className="text-xs text-[var(--muted-foreground)] mt-0.5 truncate">{desc}</p>
              </div>
              <ChevronRight size={15} className="text-[var(--muted-foreground)] shrink-0" />
            </Link>
          ))}
        </div>

        {/* Desktop: grid */}
        <div className="hidden sm:grid grid-cols-3 gap-3">
          {navCards.map(({ id, label, href, icon: Icon, desc }) => (
            <Link key={id} href={href}
              className="group bg-white rounded-xl border border-[var(--border)] p-4 hover:border-[var(--terracota)] hover:shadow-md transition-all duration-200 flex flex-col gap-3">
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
