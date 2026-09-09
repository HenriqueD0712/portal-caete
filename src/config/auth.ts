// Login por NOME DE USUÁRIO.
// O Supabase autentica sempre por e-mail, então convertemos o usuário
// digitado ("caete") em um e-mail interno fixo ("caete@portal.local").
// Se o valor já contiver "@", é usado como está — mantém o acesso do admin
// (que continua entrando com o Gmail real).
export const INTERNAL_EMAIL_DOMAIN = "portal.local";

export function usernameToEmail(input: string): string {
  const v = (input ?? "").trim().toLowerCase();
  return v.includes("@") ? v : `${v}@${INTERNAL_EMAIL_DOMAIN}`;
}
