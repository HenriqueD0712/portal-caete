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
    <section className="space-y-4">
      <button
        onClick={() => setAberto((v) => !v)}
        className="flex items-center gap-2 w-full text-left"
        aria-expanded={aberto}
      >
        <Package size={16} className="text-[var(--verde-escuro)] shrink-0" />
        <h2 className="text-sm font-semibold text-[var(--verde-escuro)] uppercase tracking-wide">
          {title}
        </h2>
        <span className="ml-auto flex items-center gap-1 text-xs font-medium text-[var(--muted-foreground)]">
          {aberto ? "Recolher" : "Expandir"}
          <ChevronDown
            size={16}
            className={`text-[var(--verde-escuro)] transition-transform ${aberto ? "" : "-rotate-90"}`}
          />
        </span>
      </button>

      {aberto && <OrcamentoView items={items} />}
    </section>
  );
}
