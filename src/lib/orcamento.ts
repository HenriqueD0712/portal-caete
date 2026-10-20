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
  // Só fixa a aba (gid) se ela vier no link; senão, o Google devolve a 1ª aba.
  const gid = sheetUrl.match(/[#&?]gid=(\d+)/)?.[1];

  // Formato "Publicar na web": /spreadsheets/d/e/<token>/pubhtml
  const pub = sheetUrl.match(/\/spreadsheets\/d\/e\/([^/]+)/);
  if (pub) {
    let u = `https://docs.google.com/spreadsheets/d/e/${pub[1]}/pub?output=csv&single=true`;
    if (gid) u += `&gid=${gid}`;
    return u;
  }

  // Formato normal (editor): /spreadsheets/d/<id>/edit
  const m = sheetUrl.match(/\/spreadsheets\/d\/([^/]+)/);
  if (!m) return sheetUrl;
  const base = `https://docs.google.com/spreadsheets/d/${m[1]}/export?format=csv`;
  return gid ? `${base}&gid=${gid}` : base;
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

// Chave sem acento/maiúscula/pontos para comparar nomes de ambiente ("A.S." = "a s").
const fold = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[.\s]+/g, " ").trim();

// Apelidos usados na planilha -> nome oficial do filtro.
const AMBIENTE_APELIDOS: Record<string, string[]> = {
  "a s": ["Área de Serviço"],
  "banheiro suite": ["BWC Suíte"],
  "banheiro suite master": ["BWC Suíte Master"],
  "banheiro hospedes": ["BWC Hóspedes"],
  // "Todos" / "Todos os Ambientes": item geral, aparece só na visão "Todos" (sem filtro próprio).
  todos: [],
  "todos os ambientes": [],
};

const TODOS_BWC = "BWCs"; // expandido para todos os "BWC ..." da planilha

// "Cozinha, A.S., Lavabo e Banheiro Suíte" ou "Cozinha/Varanda" -> lista de ambientes.
function splitAmbientes(raw: string): string[] {
  return raw
    .split(/\s*(?:\/|,|;|\s+e\s+)\s*/i)
    .map((a) => a.trim())
    .filter(Boolean)
    .flatMap((a) => AMBIENTE_APELIDOS[fold(a)] ?? [a]);
}

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
    if (col0.toLowerCase() === "item") continue; // cabeçalho repetido
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
      ambientes: Array.from(new Set(splitAmbientes(ambienteRaw))),
      link: norm(r[7]),
      categoria,
    });
  }

  // "BWCs" = todos os banheiros "BWC ..." existentes na planilha.
  const bwcs = Array.from(
    new Set(items.flatMap((i) => i.ambientes).filter((a) => a.startsWith("BWC ")))
  );
  if (bwcs.length > 0) {
    for (const i of items) {
      if (i.ambientes.includes(TODOS_BWC)) {
        i.ambientes = Array.from(new Set(i.ambientes.flatMap((a) => (a === TODOS_BWC ? bwcs : [a]))));
      }
    }
  }
  return items;
}
