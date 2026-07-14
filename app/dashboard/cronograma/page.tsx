import { getCachedUser, getCachedAccessToken } from "@/src/lib/supabase/user";
import { getUserData } from "@/src/lib/cache";
import { CalendarDays, CheckCircle2, Circle } from "lucide-react";

export default async function CronogramaPage() {
  const user = await getCachedUser();
  const token = await getCachedAccessToken();

  const itens = await getUserData(user!.id, token, "cronograma", async (sb) =>
    (await sb
      .from("cronograma")
      .select("*")
      .eq("cliente_id", user!.id)
      .order("data_prevista")).data ?? []
  );

  const hoje = new Date();

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--verde-escuro)]">Cronograma</h1>
        <p className="text-sm text-[var(--muted-foreground)] mt-1">Datas de entrega do projeto.</p>
      </div>

      {!itens || itens.length === 0 ? (
        <div className="bg-white rounded-lg border border-[var(--border)] p-12 text-center">
          <CalendarDays size={32} className="mx-auto text-[var(--muted-foreground)] mb-3" />
          <p className="text-sm text-[var(--muted-foreground)]">Nenhuma data cadastrada ainda.</p>
        </div>
      ) : (
        <div className="relative">
          {/* Linha vertical */}
          <div className="absolute left-5 top-0 bottom-0 w-px bg-[var(--border)]" />

          <ol className="space-y-4">
            {itens.map((item) => {
              const data = new Date(item.data_prevista + "T00:00:00");
              const passado = data < hoje;
              return (
                <li key={item.id} className="flex gap-4 items-start">
                  <div className="z-10 mt-0.5 shrink-0">
                    {item.concluido ? (
                      <CheckCircle2 size={22} className="text-[var(--verde-escuro)]" />
                    ) : (
                      <Circle size={22} className={passado ? "text-[var(--terracota)]" : "text-[var(--muted-foreground)]"} />
                    )}
                  </div>
                  <div className="bg-white rounded-lg border border-[var(--border)] p-4 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-sm font-medium ${item.concluido ? "line-through text-[var(--muted-foreground)]" : ""}`}>
                        {item.titulo}
                      </p>
                      <span className={`text-xs shrink-0 ${passado && !item.concluido ? "text-[var(--terracota)] font-medium" : "text-[var(--muted-foreground)]"}`}>
                        {data.toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                    {item.descricao && (
                      <p className="text-xs text-[var(--muted-foreground)] mt-1">{item.descricao}</p>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      )}
    </div>
  );
}
