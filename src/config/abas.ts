// ABAS PERSONALIZADAS DE DOCUMENTOS
// O admin pode criar uma aba nova (ex: "Briefing") ao adicionar um documento.
// No banco, a categoria fica como "aba:Briefing". Documentos antigos salvos
// como "outro" aparecem numa aba chamada "Outros".
export const ABA_PREFIX = "aba:";
export const LEGACY_OUTRO = "outro";

export function isAba(categoria: string): boolean {
  return categoria.startsWith(ABA_PREFIX) || categoria === LEGACY_OUTRO;
}

export function abaLabel(categoria: string): string {
  return categoria === LEGACY_OUTRO ? "Outros" : categoria.slice(ABA_PREFIX.length);
}

export function abaSlug(label: string): string {
  return label
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Nome de exibição de qualquer categoria (usado na lista do admin).
export function categoriaLabel(categoria: string): string {
  return isAba(categoria) ? abaLabel(categoria) : categoria;
}
