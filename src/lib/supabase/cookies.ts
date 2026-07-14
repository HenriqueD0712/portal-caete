// Nome do cookie que guarda a preferência "Lembrar de mim".
// Ausente ou "1" = sessão persistente (continua logado ao fechar o navegador).
// "0" = cookie de sessão (desloga quando o navegador é fechado).
export const REMEMBER_COOKIE = "caete-remember";

// Quando "Lembrar de mim" está desligado, remove maxAge/expires para que
// os cookies de autenticação virem cookies de sessão (some ao fechar o navegador).
export function withRemember<T extends object>(options: T, remember: boolean): T {
  if (remember) return options;
  return { ...options, maxAge: undefined, expires: undefined } as T;
}
