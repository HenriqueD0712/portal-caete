import { createClient } from "@/src/lib/supabase/server";
import { SheetsEmbed } from "@/components/sheets-embed";
import { TableProperties } from "lucide-react";

export default async function PlanilhasPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("google_sheets_url, nome_projeto")
    .eq("id", user!.id)
    .single();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--verde-escuro)]">Planilhas e Cadernos</h1>
        <p className="text-sm text-[var(--muted-foreground)] mt-1">
          Especificações, mobiliários e compras do projeto.
        </p>
      </div>

      {!profile?.google_sheets_url ? (
        <div className="bg-white rounded-lg border border-[var(--border)] p-12 text-center">
          <TableProperties size={32} className="mx-auto text-[var(--muted-foreground)] mb-3" />
          <p className="text-sm text-[var(--muted-foreground)]">Nenhuma planilha vinculada ainda.</p>
        </div>
      ) : (
        <SheetsEmbed src={profile.google_sheets_url} title={profile.nome_projeto ?? "Planilha do projeto"} />
      )}
    </div>
  );
}
