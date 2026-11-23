"use client";

import { useEffect, useState, useTransition } from "react";
import { gerarQrSvg, svgParaDataUrl, svgParaPng } from "@/src/lib/qr-estilizado";
import { Copy, Check, Download, RefreshCw, Eye, EyeOff, Link2 } from "lucide-react";
import { setSecoesOcultas, setLink360 } from "@/app/admin/actions";
import { navigationSections } from "@/src/config/navigation";

function Card({ children }: { children: React.ReactNode }) {
  return <div className="bg-white border border-[var(--border)] rounded-lg p-4">{children}</div>;
}

function Title({ children }: { children: React.ReactNode }) {
  return <h3 className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-widest mb-3">{children}</h3>;
}

function Switch({ on, onChange, disabled }: { on: boolean; onChange: () => void; disabled?: boolean }) {
  return (
    <button
      type="button" role="switch" aria-checked={on} onClick={onChange} disabled={disabled}
      className={`relative w-10 h-6 rounded-full transition-colors shrink-0 disabled:opacity-50 ${on ? "bg-[var(--verde-escuro)]" : "bg-gray-300"}`}
    >
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${on ? "translate-x-4" : ""}`} />
    </button>
  );
}

const btn = "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors disabled:opacity-50 border border-[var(--border)] hover:bg-[var(--creme-escuro)]";

// ── Interruptores: o que o cliente enxerga no portal ───────
export function VisibilidadeCard({ clienteId, ocultasIniciais }: { clienteId: string; ocultasIniciais: string[] }) {
  const [ocultas, setOcultas] = useState<string[]>(ocultasIniciais);
  const [erro, setErro] = useState("");
  const [pending, start] = useTransition();
  const itens = navigationSections.flatMap((s) => s.items);

  function salvar(nova: string[]) {
    const anterior = ocultas;
    setOcultas(nova);
    setErro("");
    start(async () => {
      const r = await setSecoesOcultas(clienteId, nova);
      if (r && "error" in r && r.error) { setOcultas(anterior); setErro(r.error); }
    });
  }

  function alternar(id: string) {
    salvar(ocultas.includes(id) ? ocultas.filter((x) => x !== id) : [...ocultas, id]);
  }

  return (
    <Card>
      <Title>Visível para o cliente</Title>
      <p className="text-xs text-[var(--muted-foreground)] mb-3">
        Item desligado some do menu do cliente e a página mostra “Em breve”. Você continua editando tudo normalmente aqui no painel.
      </p>
      <div className="divide-y divide-[var(--border)]">
        {itens.map((item) => {
          const visivel = !ocultas.includes(item.id);
          return (
            <div key={item.id} className="flex items-center justify-between py-2.5">
              <div className="flex items-center gap-2 text-sm">
                {visivel ? <Eye size={14} className="text-[var(--verde-escuro)]" /> : <EyeOff size={14} className="text-gray-400" />}
                <span className={visivel ? "" : "text-[var(--muted-foreground)]"}>{item.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-[var(--muted-foreground)]">{visivel ? "Visível" : "Oculto"}</span>
                <Switch on={visivel} onChange={() => alternar(item.id)} disabled={pending} />
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex gap-2 mt-3">
        <button className={btn} disabled={pending} onClick={() => salvar(itens.map((i) => i.id))}>Ocultar tudo</button>
        <button className={btn} disabled={pending} onClick={() => salvar([])}>Liberar tudo</button>
      </div>
      {erro && <p className="text-xs text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-md mt-3">{erro}</p>}
    </Card>
  );
}

// ── Link secreto + QR Code do 360° ─────────────────────────
export function Link360Card({ clienteId, token, ativo }: { clienteId: string; token: string | null; ativo: boolean }) {
  const [pending, start] = useTransition();
  const [erro, setErro] = useState("");
  const [copiado, setCopiado] = useState(false);
  const [link, setLink] = useState("");
  const [svg, setSvg] = useState("");

  // O endereço completo depende do site em que o painel está aberto.
  useEffect(() => {
    if (!token) { setLink(""); setSvg(""); return; }
    const url = `${window.location.origin}/360/${token}`;
    setLink(url);
    setSvg(gerarQrSvg(url));
  }, [token]);

  async function baixarPng() {
    const png = await svgParaPng(svg);
    const a = document.createElement("a");
    a.href = png;
    a.download = "qrcode-360.png";
    a.click();
  }

  function acao(opts: { ativo?: boolean; regenerar?: boolean }) {
    setErro("");
    start(async () => {
      const r = await setLink360(clienteId, opts);
      if (r && "error" in r && r.error) setErro(r.error);
    });
  }

  function copiar() {
    navigator.clipboard.writeText(link).then(() => { setCopiado(true); setTimeout(() => setCopiado(false), 2000); });
  }

  return (
    <Card>
      <Title><Link2 size={14} className="inline mr-1" />Link secreto do 360° (QR Code)</Title>
      <p className="text-xs text-[var(--muted-foreground)] mb-3">
        Abre somente o 360° deste cliente, sem pedir login. Só funciona enquanto estiver liberado; desligado, mostra “Em breve”.
      </p>

      {!token ? (
        <button className={btn} disabled={pending} onClick={() => acao({})}>Gerar link secreto</button>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3 p-3 rounded-lg bg-[var(--creme-escuro)]">
            <div>
              <p className="text-sm font-medium">{ativo ? "Link liberado" : "Link bloqueado"}</p>
              <p className="text-xs text-[var(--muted-foreground)]">
                {ativo ? "Quem tiver o link/QR Code consegue ver o 360°." : "O link mostra “Em breve”. Libere na hora da reunião."}
              </p>
            </div>
            <Switch on={ativo} onChange={() => acao({ ativo: !ativo })} disabled={pending} />
          </div>

          <div className="flex gap-2">
            <input readOnly value={link} onFocus={(e) => e.currentTarget.select()}
              className="flex-1 min-w-0 border border-[var(--border)] rounded-md px-3 py-2 text-xs bg-white" />
            <button className={btn} onClick={copiar} disabled={!link}>
              {copiado ? <><Check size={13} /> Copiado</> : <><Copy size={13} /> Copiar</>}
            </button>
          </div>

          {svg && (
            <div className="flex items-center gap-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={svgParaDataUrl(svg)} alt="QR Code do 360°" className="w-40 h-40 border border-[var(--border)] rounded-md bg-white" />
              <div className="space-y-2">
                <button className={btn} onClick={baixarPng}><Download size={13} /> Baixar PNG (fundo transparente)</button>
                <a href={svgParaDataUrl(svg)} download="qrcode-360.svg" className={btn}><Download size={13} /> Baixar SVG (vetor)</a>
                <p className="text-xs text-[var(--muted-foreground)]">Cole o PNG na apresentação. O SVG serve para imprimir sem perder qualidade.</p>
              </div>
            </div>
          )}

          <button className={btn} disabled={pending}
            onClick={() => {
              if (confirm("Gerar um novo link? O QR Code atual deixa de funcionar e você precisará trocá-lo na apresentação.")) acao({ regenerar: true });
            }}>
            <RefreshCw size={13} /> Gerar novo link
          </button>
        </div>
      )}
      {erro && <p className="text-xs text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-md mt-3">{erro}</p>}
    </Card>
  );
}
