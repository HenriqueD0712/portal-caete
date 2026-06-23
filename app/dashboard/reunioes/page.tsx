import { createClient } from "@/src/lib/supabase/server";
import { CalendarCheck, Download } from "lucide-react";

export default async function ReunioesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: reunioes } = await supabase
    .from("reunioes")
    .select("*")
    .eq("cliente_id", user!.id)
    .order("data_reuniao", { ascending: false });

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--verde-escuro)]">Reuniões e Atas</h1>
        <p className="text-sm text-[var(--muted-foreground)] mt-1">Histórico de reuniões realizadas.</p>
      </div>

      {!reunioes || reunioes.length === 0 ? (
        <div className="bg-white rounded-lg border border-[var(--border)] p-12 text-center">
          <CalendarCheck size={32} className="mx-auto text-[var(--muted-foreground)] mb-3" />
          <p className="text-sm text-[var(--muted-foreground)]">Nenhuma reunião registrada ainda.</p>
        </div>
      ) : (
        <ol className="relative border-l border-[var(--border)] ml-3 space-y-6">
          {reunioes.map((r) => (
            <li key={r.id} className="ml-6">
              <div className="absolute -left-2 mt-1.5 w-3.5 h-3.5 rounded-full border-2 border-[var(--verde-escuro)] bg-white" />
              <div className="bg-white rounded-lg border border-[var(--border)] p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-sm">{r.assunto}</p>
                    <p className="text-xs text-[var(--muted-foreground)]">
                      {new Date(r.data_reuniao + "T00:00:00").toLocaleDateString("pt-BR", {
                        weekday: "long", day: "numeric", month: "long", year: "numeric"
                      })}
                    </p>
                  </div>
                  {r.ata_url && (
                    <a
                      href={r.ata_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 flex items-center gap-1 text-xs text-[var(--verde-escuro)] font-medium hover:underline"
                    >
                      <Download size={13} />
                      Ata
                    </a>
                  )}
                </div>
                {r.ata_texto && (
                  <p className="text-sm text-[var(--foreground)] leading-relaxed whitespace-pre-line">
                    {r.ata_texto}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
