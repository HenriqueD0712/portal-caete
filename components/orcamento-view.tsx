"use client";

import { useMemo, useState } from "react";
import { ExternalLink, Package, Armchair, MapPin, ShoppingBag, LayoutGrid, List, ChevronDown } from "lucide-react";
import type { OrcamentoItem } from "@/src/lib/orcamento";

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

function Foto({ src, alt }: { src: string; alt: string }) {
  const [erro, setErro] = useState(false);
  if (!src || erro) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-[var(--creme-escuro)] text-[var(--verde-claro)]">
        <Armchair size={44} strokeWidth={1.25} />
        <span className="text-[11px] uppercase tracking-widest">Sem imagem</span>
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setErro(true)}
      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
    />
  );
}

function Card({ i }: { i: OrcamentoItem }) {
  const escolher = i.qtd <= 0;
  return (
    <article className="group flex flex-col bg-white rounded-2xl border border-[var(--border)] overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
      {/* Foto grande do móvel */}
      <div className="relative aspect-[4/3] overflow-hidden bg-[var(--creme-escuro)]">
        <Foto src={i.imageUrl} alt={i.item} />
        {i.ambienteRaw && (
          <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/95 backdrop-blur px-2.5 py-1 text-xs font-medium text-[var(--verde-escuro)] shadow">
            <MapPin size={12} className="text-[var(--terracota)]" />
            {i.ambienteRaw}
          </span>
        )}
      </div>

      <div className="flex flex-col flex-1 p-4 gap-4">
        <h4 className="text-base font-semibold leading-snug text-[var(--foreground)] min-h-[2.75rem]">
          {i.item}
        </h4>

        {/* Unidades + valor unitário */}
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl bg-[var(--creme)] border border-[var(--border)] px-3 py-2.5">
            <p className="text-[11px] uppercase tracking-wide text-[var(--muted-foreground)]">Unidades</p>
            <p className="mt-0.5 text-lg font-semibold leading-none text-[var(--verde-escuro)]">
              {escolher ? "A escolher" : <>{i.qtd} <span className="text-sm font-medium">un</span></>}
            </p>
          </div>
          <div className="rounded-xl bg-[var(--creme)] border border-[var(--border)] px-3 py-2.5">
            <p className="text-[11px] uppercase tracking-wide text-[var(--muted-foreground)]">Valor unitário</p>
            <p className="mt-0.5 text-lg font-semibold leading-none text-[var(--verde-escuro)]">
              {i.precoUnit > 0 ? brl.format(i.precoUnit) : "—"}
            </p>
          </div>
        </div>

        {/* Total do item */}
        <div className="flex items-baseline justify-between border-t border-dashed border-[var(--border)] pt-3">
          <span className="text-xs uppercase tracking-wide text-[var(--muted-foreground)]">Total do item</span>
          <span className="font-sans text-2xl font-semibold text-[var(--verde-escuro)] whitespace-nowrap">
            {i.valorTotal > 0 ? brl.format(i.valorTotal) : "—"}
          </span>
        </div>

        {/* Botão de compra */}
        {i.link && (
          <a
            href={i.link}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-auto inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--terracota)] hover:bg-[var(--terracota-claro)] text-white text-sm font-semibold px-4 py-3 transition-colors"
          >
            <ShoppingBag size={16} />
            Ver na loja
            <ExternalLink size={14} className="opacity-80" />
          </a>
        )}
      </div>
    </article>
  );
}

function CardLista({ i }: { i: OrcamentoItem }) {
  const escolher = i.qtd <= 0;
  return (
    <article className="group flex flex-col sm:flex-row bg-white rounded-2xl border border-[var(--border)] overflow-hidden shadow-sm hover:shadow-lg transition-shadow duration-300">
      {/* Foto grande do móvel */}
      <div className="relative w-full aspect-[16/10] sm:aspect-auto sm:w-56 sm:min-h-[10rem] shrink-0 overflow-hidden bg-[var(--creme-escuro)]">
        <Foto src={i.imageUrl} alt={i.item} />
      </div>

      <div className="flex flex-1 flex-col lg:flex-row lg:items-center gap-4 p-4 min-w-0">
        <div className="flex-1 min-w-0 space-y-2">
          {i.ambienteRaw && (
            <span className="inline-flex items-center gap-1 rounded-full bg-[var(--creme-escuro)] px-2.5 py-1 text-xs font-medium text-[var(--verde-escuro)]">
              <MapPin size={12} className="text-[var(--terracota)]" />
              {i.ambienteRaw}
            </span>
          )}
          <h4 className="text-base font-semibold leading-snug text-[var(--foreground)]">{i.item}</h4>
          <div className="flex flex-wrap gap-2">
            <div className="rounded-xl bg-[var(--creme)] border border-[var(--border)] px-3 py-2">
              <p className="text-[11px] uppercase tracking-wide text-[var(--muted-foreground)]">Unidades</p>
              <p className="mt-0.5 text-base font-semibold leading-none text-[var(--verde-escuro)]">
                {escolher ? "A escolher" : <>{i.qtd} <span className="text-sm font-medium">un</span></>}
              </p>
            </div>
            <div className="rounded-xl bg-[var(--creme)] border border-[var(--border)] px-3 py-2">
              <p className="text-[11px] uppercase tracking-wide text-[var(--muted-foreground)]">Valor unitário</p>
              <p className="mt-0.5 text-base font-semibold leading-none text-[var(--verde-escuro)]">
                {i.precoUnit > 0 ? brl.format(i.precoUnit) : "—"}
              </p>
            </div>
          </div>
        </div>

        <div className="flex lg:flex-col items-center lg:items-end justify-between lg:justify-center gap-3 lg:w-52 shrink-0 border-t lg:border-t-0 lg:border-l border-dashed border-[var(--border)] pt-3 lg:pt-0 lg:pl-4">
          <div className="lg:text-right">
            <p className="text-[11px] uppercase tracking-wide text-[var(--muted-foreground)]">Total do item</p>
            <p className="font-sans text-2xl font-semibold text-[var(--verde-escuro)] whitespace-nowrap">
              {i.valorTotal > 0 ? brl.format(i.valorTotal) : "—"}
            </p>
          </div>
          {i.link && (
            <a
              href={i.link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--terracota)] hover:bg-[var(--terracota-claro)] text-white text-sm font-semibold px-4 py-2.5 transition-colors whitespace-nowrap"
            >
              <ShoppingBag size={16} />
              Ver na loja
              <ExternalLink size={14} className="opacity-80" />
            </a>
          )}
        </div>
      </div>
    </article>
  );
}

export function OrcamentoView({ items }: { items: OrcamentoItem[] }) {
  const [amb, setAmb] = useState("Todos");
  const [modo, setModo] = useState<"grade" | "lista">("grade");
  const [recolhidas, setRecolhidas] = useState<Set<string>>(new Set());
  const alternarCategoria = (cat: string) =>
    setRecolhidas((prev) => {
      const n = new Set(prev);
      if (n.has(cat)) n.delete(cat);
      else n.add(cat);
      return n;
    });

  const ambientes = useMemo(() => {
    const s = new Set<string>();
    items.forEach((i) => i.ambientes.forEach((a) => a !== "Todos" && s.add(a)));
    return ["Todos", ...Array.from(s).sort((a, b) => a.localeCompare(b, "pt-BR"))];
  }, [items]);

  const contagem = (a: string) => (a === "Todos" ? items.length : items.filter((i) => i.ambientes.includes(a)).length);

  const filtrados = amb === "Todos" ? items : items.filter((i) => i.ambientes.includes(amb));

  const grupos = useMemo(() => {
    const map = new Map<string, OrcamentoItem[]>();
    filtrados.forEach((i) => {
      const k = i.categoria || "Outros";
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(i);
    });
    return Array.from(map.entries());
  }, [filtrados]);

  const total = filtrados.reduce((s, i) => s + i.valorTotal, 0);

  if (items.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-[var(--border)] p-12 text-center">
        <Package size={36} className="mx-auto text-[var(--muted-foreground)] mb-3" />
        <p className="text-sm text-[var(--muted-foreground)]">Nenhum item orçado disponível ainda.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Alternar visualização: grade ou lista */}
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs uppercase tracking-wide text-[var(--muted-foreground)]">Visualização</span>
        <div className="inline-flex rounded-full border border-[var(--border)] bg-white p-1" role="group" aria-label="Modo de visualização">
          {([
            ["grade", "Grade", LayoutGrid],
            ["lista", "Lista", List],
          ] as const).map(([k, label, Icon]) => (
            <button
              key={k}
              onClick={() => setModo(k)}
              aria-pressed={modo === k}
              className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                modo === k ? "bg-[var(--verde-escuro)] text-white" : "text-[var(--verde-escuro)] hover:bg-[var(--creme-escuro)]"
              }`}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Filtro por ambiente */}
      <div className="-mx-1 overflow-x-auto">
        <div className="flex gap-2 px-1 pb-2 w-max">
          {ambientes.map((a) => (
            <button
              key={a}
              onClick={() => setAmb(a)}
              className={`inline-flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-full border whitespace-nowrap transition-colors ${
                amb === a
                  ? "bg-[var(--verde-escuro)] text-white border-[var(--verde-escuro)] shadow"
                  : "bg-white text-[var(--verde-escuro)] border-[var(--border)] hover:border-[var(--verde-escuro)]"
              }`}
            >
              {a}
              <span
                className={`text-xs rounded-full px-1.5 py-0.5 ${
                  amb === a ? "bg-white/20 text-white" : "bg-[var(--creme-escuro)] text-[var(--verde-medio)]"
                }`}
              >
                {contagem(a)}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Grupos por categoria (subtotal no cabeçalho de cada uma) */}
      {grupos.map(([cat, itens]) => {
        const subtotal = itens.reduce((s, i) => s + i.valorTotal, 0);
        const aberta = !recolhidas.has(cat);
        return (
          <section key={cat} className="space-y-4">
            <button
              onClick={() => alternarCategoria(cat)}
              aria-expanded={aberta}
              className="flex w-full items-end justify-between gap-x-4 gap-y-1 border-b-2 border-[var(--verde-escuro)] pb-2 text-left"
            >
              <span className="flex items-center gap-3 min-w-0">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--creme-escuro)]">
                  <ChevronDown
                    size={18}
                    className={`text-[var(--verde-escuro)] transition-transform ${aberta ? "" : "-rotate-90"}`}
                  />
                </span>
                <span className="min-w-0">
                  <h3 className="font-display text-xl font-semibold text-[var(--verde-escuro)] leading-tight">{cat}</h3>
                  <span className="block text-xs text-[var(--muted-foreground)]">
                    {itens.length} {itens.length === 1 ? "item" : "itens"} · {aberta ? "Recolher" : "Expandir"}
                  </span>
                </span>
              </span>
              <span className="text-right shrink-0">
                <span className="block text-[11px] uppercase tracking-wide text-[var(--muted-foreground)]">Subtotal</span>
                <span className="block text-lg font-semibold text-[var(--terracota)] leading-tight">{brl.format(subtotal)}</span>
              </span>
            </button>
            {aberta && (
              <div className={modo === "grade" ? "grid gap-4 sm:grid-cols-2 xl:grid-cols-3" : "flex flex-col gap-3"}>
                {itens.map((i, idx) =>
                  modo === "grade" ? <Card key={`${cat}-${idx}`} i={i} /> : <CardLista key={`${cat}-${idx}`} i={i} />
                )}
              </div>
            )}
          </section>
        );
      })}

      {/* Resumo final: total por categoria + total do projeto */}
      <section className="space-y-3 pt-2">
        <h3 className="font-display text-xl font-semibold text-[var(--verde-escuro)]">Resumo</h3>
        <div className="bg-white rounded-2xl border border-[var(--border)] divide-y divide-[var(--border)] overflow-hidden">
          {grupos.map(([cat, itens]) => (
            <div key={cat} className="flex items-center justify-between px-5 py-3.5">
              <span className="text-sm font-medium text-[var(--foreground)]">
                {cat}
                <span className="ml-2 text-xs font-normal text-[var(--muted-foreground)]">({itens.length})</span>
              </span>
              <span className="text-sm font-semibold text-[var(--verde-escuro)]">
                {brl.format(itens.reduce((s, i) => s + i.valorTotal, 0))}
              </span>
            </div>
          ))}
        </div>
        <div className="bg-[var(--verde-escuro)] rounded-2xl px-5 py-5 flex flex-wrap items-center justify-between gap-2 shadow-md">
          <span className="text-sm text-white/80">
            {amb === "Todos" ? "Total do projeto" : `Total · ${amb}`}
            <span className="ml-1 text-white/60">({filtrados.length} itens)</span>
          </span>
          <span className="font-sans text-3xl font-semibold text-white">{brl.format(total)}</span>
        </div>
      </section>
    </div>
  );
}
