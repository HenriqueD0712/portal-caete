"use client";

import { useMemo, useState } from "react";
import { ExternalLink, Package, ImageOff } from "lucide-react";
import type { OrcamentoItem } from "@/src/lib/orcamento";

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

function Thumb({ src, alt }: { src: string; alt: string }) {
  const [erro, setErro] = useState(false);
  if (!src || erro) {
    return (
      <div className="w-16 h-16 shrink-0 rounded-lg bg-[var(--creme-escuro)] flex items-center justify-center">
        <ImageOff size={18} className="text-[var(--muted-foreground)]" />
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
      className="w-16 h-16 shrink-0 rounded-lg object-cover bg-[var(--creme-escuro)]"
    />
  );
}

function Card({ i }: { i: OrcamentoItem }) {
  return (
    <div className="flex gap-3 bg-white rounded-xl border border-[var(--border)] p-3">
      <Thumb src={i.imageUrl} alt={i.item} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium leading-snug text-[var(--foreground)]">{i.item}</p>
        {i.ambienteRaw && (
          <p className="text-xs text-[var(--verde-claro)] mt-0.5">{i.ambienteRaw}</p>
        )}
        <div className="flex items-end justify-between gap-2 mt-2">
          <span className="text-xs text-[var(--muted-foreground)]">
            {i.qtd > 0 ? `${i.qtd} un · ${brl.format(i.precoUnit)}` : "A escolher"}
          </span>
          <span className="text-sm font-semibold text-[var(--verde-escuro)] whitespace-nowrap">
            {i.valorTotal > 0 ? brl.format(i.valorTotal) : "—"}
          </span>
        </div>
        {i.link && (
          <a
            href={i.link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-[var(--terracota)] mt-1.5 hover:underline"
          >
            <ExternalLink size={12} /> Ver na loja
          </a>
        )}
      </div>
    </div>
  );
}

export function OrcamentoView({ items }: { items: OrcamentoItem[] }) {
  const [amb, setAmb] = useState("Todos");

  const ambientes = useMemo(() => {
    const s = new Set<string>();
    items.forEach((i) => i.ambientes.forEach((a) => s.add(a)));
    return ["Todos", ...Array.from(s).sort((a, b) => a.localeCompare(b, "pt-BR"))];
  }, [items]);

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
      <div className="bg-white rounded-lg border border-[var(--border)] p-12 text-center">
        <Package size={32} className="mx-auto text-[var(--muted-foreground)] mb-3" />
        <p className="text-sm text-[var(--muted-foreground)]">Nenhum item orçado disponível ainda.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Filtro por ambiente */}
      <div className="-mx-1 overflow-x-auto">
        <div className="flex gap-2 px-1 pb-1 w-max">
          {ambientes.map((a) => (
            <button
              key={a}
              onClick={() => setAmb(a)}
              className={`text-xs font-medium px-3 py-1.5 rounded-full border whitespace-nowrap transition-colors ${
                amb === a
                  ? "bg-[var(--verde-escuro)] text-white border-[var(--verde-escuro)]"
                  : "bg-white text-[var(--verde-escuro)] border-[var(--border)] hover:border-[var(--verde-escuro)]"
              }`}
            >
              {a}
            </button>
          ))}
        </div>
      </div>

      {/* Total */}
      <div className="bg-[var(--verde-escuro)] rounded-xl px-4 py-3 flex items-center justify-between">
        <span className="text-xs text-white/70">
          {amb === "Todos" ? "Total geral" : `Total · ${amb}`}
          <span className="ml-1">({filtrados.length} itens)</span>
        </span>
        <span className="text-lg font-semibold text-white">{brl.format(total)}</span>
      </div>

      {/* Grupos por categoria */}
      {grupos.map(([cat, itens]) => {
        const subtotal = itens.reduce((s, i) => s + i.valorTotal, 0);
        return (
          <section key={cat} className="space-y-2.5">
            <div className="flex items-baseline justify-between">
              <h3 className="text-xs font-semibold text-[var(--verde-escuro)] uppercase tracking-wide">
                {cat}
              </h3>
              <span className="text-xs text-[var(--muted-foreground)]">{brl.format(subtotal)}</span>
            </div>
            {itens.map((i, idx) => (
              <Card key={`${cat}-${idx}`} i={i} />
            ))}
          </section>
        );
      })}
    </div>
  );
}
