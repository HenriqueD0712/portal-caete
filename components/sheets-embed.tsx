"use client";

import { useState } from "react";
import { TableProperties } from "lucide-react";

interface Props {
  src: string;
  title: string;
}

export function SheetsEmbed({ src, title }: Props) {
  const [loaded, setLoaded] = useState(false);

  if (!loaded) {
    return (
      <div
        className="bg-white rounded-lg border border-[var(--border)] h-64 flex flex-col items-center justify-center gap-3 cursor-pointer group hover:border-[var(--verde-escuro)] transition-colors"
        onClick={() => setLoaded(true)}
      >
        <div className="w-12 h-12 rounded-full bg-[var(--creme-escuro)] flex items-center justify-center group-hover:bg-[var(--verde-escuro)] transition-colors">
          <TableProperties size={20} className="text-[var(--muted-foreground)] group-hover:text-white transition-colors" />
        </div>
        <p className="text-sm text-[var(--muted-foreground)]">Clique para carregar a planilha</p>
        <p className="text-xs text-[var(--muted-foreground)] opacity-60">{title}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-[var(--border)] overflow-hidden" style={{ height: "70vh", minHeight: "400px" }}>
      <iframe
        src={src}
        title={title}
        className="w-full h-full border-0"
        loading="lazy"
      />
    </div>
  );
}
