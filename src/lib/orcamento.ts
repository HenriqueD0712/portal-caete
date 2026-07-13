// Lê a planilha financeira do Google Sheets (publicada/compartilhada por link)
// e devolve os itens já organizados para exibição em cards.

export interface OrcamentoItem {
  item: string;
  precoUnit: number;
  qtd: number;
  imageUrl: string;
  valorTotal: number;
  ambienteRaw: string;
  ambientes: string[];
  link: string;
  categoria: string;
}

// Converte qualquer URL do Google Sheets no link de exportação CSV.
export function toCsvUrl(sheetUrl: string): string {
  const m = sheetUrl.match(/\/spreadsheets\/d\/([^/]+)/);
  if (!m) return sheetUrl;
  const gid = sheetUrl.match(/[#&?]gid=(\d+)/)?.[1] ?? "0";
  return `https://docs.google.com/spreadsheets/d/${m[1]}/export?format=csv&gid=${gid}`;
}

// Parser CSV (RFC 4180): lida com aspas, vírgulas e quebras de linha dentro de célula.
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\r") { /* ignora */ }
    else if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
    else field += c;
  }
  if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row); }
  return rows;
}

// "R$ 3.099,00" -> 3099.00 ; " R$  -   " -> 0
function parseMoney(s: string): number {
  if (!s) return 0;
  const cleaned = s.replace(/[R$\s.]/g, "").replace(",", ".").replace(/[^0-9.\-]/g, "");
  const n = parseFloat(cleaned);
  return Number.isNaN(n) ? 0 : n;
}

const norm = (s: string | undefined) => (s ?? "").replace(/\s+/g, " ").trim();

export async function fetchOrcamento(sheetUrl: string): Promise<OrcamentoItem[]> {
  if (!sheetUrl) return [];
  let text: string;
  try {
    const res = await fetch(toCsvUrl(sheetUrl), { next: { revalidate: 300 } });
    if (!res.ok) return [];
    text = await res.text();
  } catch {
    return [];
  }

  const rows = parseCsv(text);
  const h = rows.findIndex((r) => norm(r[0]) === "Item");
  if (h < 0) return [];

  const items: OrcamentoItem[] = [];
  let categoria = "";
  for (const r of rows.slice(h + 1)) {
    const col0 = norm(r[0]);
    if (!col0) continue;
    if (col0.toUpperCase().includes("VALOR TOTAL")) continue; // linhas de subtotal/total

    const temPreco = !!norm(r[1]);
    const temValor = !!norm(r[4]);
    if (!temPreco && !temValor) { categoria = col0; continue; } // cabeçalho de categoria

    const ambienteRaw = norm(r[5]);
    items.push({
      item: col0,
      precoUnit: parseMoney(r[1] ?? ""),
      qtd: parseInt((r[2] ?? "").replace(/\D/g, ""), 10) || 0,
      imageUrl: norm(r[3]),
      valorTotal: parseMoney(r[4] ?? ""),
      ambienteRaw,
      ambientes: ambienteRaw ? ambienteRaw.split("/").map((a) => a.trim()).filter(Boolean) : [],
      link: norm(r[7]),
      categoria,
    });
  }
  return items;
}
