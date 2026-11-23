import { getCachedUser } from "@/src/lib/supabase/user";
import { getSecoesOcultas } from "@/src/lib/portal-config";
import { siteText } from "@/src/config/site-text";

// Envolve uma seção do portal: se o admin escondeu essa seção para o cliente,
// mostra "Em breve" no lugar do conteúdo (vale também para quem digita o endereço).
export async function SecaoGuard({ id, children }: { id: string; children: React.ReactNode }) {
  const user = await getCachedUser();
  const ocultas = user ? await getSecoesOcultas(user.id) : [];

  if (ocultas.includes(id)) {
    return (
      <div className="bg-white rounded-lg border border-[var(--border)] p-12 text-center max-w-xl">
        <p className="text-2xl font-semibold text-[var(--verde-escuro)] mb-2">{siteText.secaoEmBreve.titulo}</p>
        <p className="text-sm text-[var(--muted-foreground)]">{siteText.secaoEmBreve.descricao}</p>
      </div>
    );
  }
  return <>{children}</>;
}
