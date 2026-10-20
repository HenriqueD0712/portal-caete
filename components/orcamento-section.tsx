"use client";

import { useState } from "react";
import { Package, ChevronDown } from "lucide-react";
import { OrcamentoView } from "./orcamento-view";
import type { OrcamentoItem } from "@/src/lib/orcamento";

export function OrcamentoSection({
  items,
  title = "Itens orçados",
}: {
  items: OrcamentoItem[];
  title?: string;
}) {
  const [aberto, setAberto] = useState(true);

  return (
    <section className="space-y-6">
      <button
        onClick={() => setAberto((v) => !v)}
        className="flex items-center gap-3 w-full text-left rounded-2xl bg-[var(--verde-escuro)] px-5 py-4 shadow-md hover:bg-[var(--verde-medio)] transition-colors"
        aria-expanded={aberto}
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/15">
          <Package size={20} className="text-white" />
        </span>
        <span className="min-w-0">
          <h2 className="font-display text-xl font-semibold text-white leading-tight">{title}</h2>
          <p className="text-xs text-white/70">{items.length} itens do projeto</p>
        </span>
        <span className="ml-auto flex items-center gap-1 text-xs font-medium text-white/80">
          {aberto ? "Recolher" : "Expandir"}
          <ChevronDown
            size={18}
            className={`text-white transition-transform ${aberto ? "" : "-rotate-90"}`}
          />
        </span>
      </button>

      {aberto && <OrcamentoView items={items} />}
    </section>
  );
}
