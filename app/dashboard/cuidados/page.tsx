import { createClient } from "@/src/lib/supabase/server";
import { ShieldCheck } from "lucide-react";

export default async function CuidadosPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: cuidados } = await supabase
    .from("cuidados")
    .select("*")
    .eq("cliente_id", user!.id)
    .order("ordem");

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--verde-escuro)]">Cuidados com o Projeto</h1>
        <p className="text-sm text-[var(--muted-foreground)] mt-1">
          Orientações sobre os materiais e acabamentos do seu projeto.
        </p>
      </div>

      {!cuidados || cuidados.length === 0 ? (
        <div className="bg-white rounded-lg border border-[var(--border)] p-12 text-center">
          <ShieldCheck size={32} className="mx-auto text-[var(--muted-foreground)] mb-3" />
          <p className="text-sm text-[var(--muted-foreground)]">Nenhuma orientação cadastrada ainda.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {cuidados.map((item) => (
            <div key={item.id} className="bg-white rounded-lg border border-[var(--border)] p-5">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-[var(--terracota)]" />
                <h3 className="font-semibold text-sm text-[var(--verde-escuro)]">{item.material}</h3>
              </div>
              <p className="text-sm text-[var(--foreground)] leading-relaxed">{item.descricao}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
