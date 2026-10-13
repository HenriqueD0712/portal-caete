// Login por NOME DE USUÁRIO.
// O Supabase autentica sempre por e-mail, então convertemos o usuário
// digitado ("caete") em um e-mail interno fixo ("caete@portal.local").
// Se o valor já contiver "@", é usado como está — mantém o acesso do admin
// (que continua entrando com o Gmail real).
export const INTERNAL_EMAIL_DOMAIN = "portal.local";

export function usernameToEmail(input: string): string {
  const v = (input ?? "").trim().toLowerCase();
  if (v.includes("@")) return v;
  // Tira acentos, troca espaços por "-" e remove símbolos que o e-mail não aceita.
  const slug = v
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9._-]/g, "")
    .replace(/^[-.]+|[-.]+$/g, "");
  return `${slug}@${INTERNAL_EMAIL_DOMAIN}`;
}
