"use client";

import { useState } from "react";
import { Trash2, Check } from "lucide-react";

export function CleanupR2Btn() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<number | null>(null);
  const [erro, setErro] = useState("");

  async function cleanup() {
    if (!confirm("Isso vai verificar todos os arquivos no R2 e excluir os que não estão sendo usados no site. Continuar?")) return;
    setLoading(true);
    setErro("");
    setResult(null);
    try {
      const res = await fetch("/api/admin/cleanup-r2", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro desconhecido");
      setResult(data.deleted);
    } catch (e: unknown) {
      setErro(e instanceof Error ? e.message : "Erro ao limpar R2.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <button
        onClick={cleanup}
        disabled={loading}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium border border-[var(--border)] hover:bg-[var(--creme-escuro)] transition-colors disabled:opacity-50"
      >
        <Trash2 size={13} />
        {loading ? "Verificando R2..." : "Limpar arquivos órfãos"}
      </button>
      {result !== null && (
        <span className="text-xs text-green-600 font-medium flex items-center gap-1">
          <Check size={12} />
          {result === 0 ? "Nenhum arquivo órfão encontrado." : `${result} arquivo(s) excluído(s) do R2.`}
        </span>
      )}
      {erro && <span className="text-xs text-red-600">{erro}</span>}
    </div>
  );
}
