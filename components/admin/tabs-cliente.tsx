"use client";

import { useState, useTransition, useRef, useCallback } from "react";
import {
  User, FileText, Image as ImageIcon, Video, Calendar, BarChart2,
  CheckSquare, MessageSquare, Shield, Trash2, Plus, Check, Edit2, Upload, X, Building2
} from "lucide-react";
import {
  updateProfile, saveArquivo, deleteArquivo,
  saveCronograma, updateCronograma, deleteCronograma,
  saveProgresso, updateProgresso, deleteProgresso,
  saveAprovacao, updateAprovacao, deleteAprovacao,
  saveReuniao, updateReuniao, deleteReuniao,
  saveCuidado, updateCuidado, deleteCuidado,
} from "@/app/admin/actions";

// ── Types ──────────────────────────────────────────────────
type Profile = {
  id: string; nome: string; nome_projeto?: string; google_sheets_url?: string;
  progresso_criativo?: number; progresso_executivo?: number;
  data_entrega_criativo?: string; data_entrega_executivo?: string;
  subcategorias_executivo?: string[];
};
type Arquivo = { id: string; nome: string; descricao?: string; categoria: string; url: string; tipo_arquivo?: string; tamanho_bytes?: number; created_at: string };
type Cronograma = { id: string; titulo: string; descricao?: string; data_prevista: string; concluido: boolean };
type Progresso = { id: string; etapa: string; item: string; percentual: number; status: string; ordem: number };
type Aprovacao = { id: string; etapa: string; status: string; comentario?: string; updated_at: string };
type Reuniao = { id: string; data_reuniao: string; assunto: string; ata_texto?: string };
type Cuidado = { id: string; material: string; descricao: string; ordem: number };

type ClientData = {
  profile: Profile;
  arquivos: Arquivo[];
  panoramas: Arquivo[];
  cronograma: Cronograma[];
  progresso: Progresso[];
  aprovacoes: Aprovacao[];
  reunioes: Reuniao[];
  cuidados: Cuidado[];
};

// ── Helpers ────────────────────────────────────────────────
function Btn({ onClick, disabled, variant = "primary", children, className = "" }: {
  onClick?: () => void; disabled?: boolean; variant?: "primary" | "danger" | "ghost"; children: React.ReactNode; className?: string;
}) {
  const styles = {
    primary: "bg-[var(--verde-escuro)] text-white hover:bg-[var(--verde-medio)]",
    danger: "bg-red-50 text-red-600 hover:bg-red-100",
    ghost: "border border-[var(--border)] hover:bg-[var(--creme-escuro)]",
  };
  return (
    <button onClick={onClick} disabled={disabled}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors disabled:opacity-50 ${styles[variant]} ${className}`}>
      {children}
    </button>
  );
}

function Input({ label, ...props }: { label?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="space-y-1">
      {label && <label className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wide">{label}</label>}
      <input {...props} className="w-full border border-[var(--border)] rounded-md px-3 py-2 text-sm outline-none focus:border-[var(--verde-escuro)] bg-white" />
    </div>
  );
}

function Textarea({ label, ...props }: { label?: string } & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <div className="space-y-1">
      {label && <label className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wide">{label}</label>}
      <textarea {...props} rows={3} className="w-full border border-[var(--border)] rounded-md px-3 py-2 text-sm outline-none focus:border-[var(--verde-escuro)] bg-white resize-none" />
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="bg-white border border-[var(--border)] rounded-lg p-4">{children}</div>;
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-widest mb-3">{children}</h3>;
}

// ── Upload helper (XHR com progresso) ─────────────────────
async function xhrUpload(
  uploadUrl: string,
  file: File,
  onProgress: (pct: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error(`Erro ${xhr.status}: ${xhr.statusText}`));
    };
    xhr.onerror = () => reject(new Error("Falha na conexão. Verifique o CORS do R2."));
    xhr.ontimeout = () => reject(new Error("Tempo esgotado."));
    xhr.open("PUT", uploadUrl);
    xhr.setRequestHeader("Content-Type", file.type);
    xhr.send(file);
  });
}

// ── Panorama Upload ────────────────────────────────────────
function PanoramaUpload({ clienteId }: { clienteId: string }) {
  const [dragOver, setDragOver] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [done, setDone] = useState(false);
  const [erro, setErro] = useState("");
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function upload(file: File) {
    if (!file) return;
    setUploading(true);
    setDone(false);
    setErro("");
    setProgress(0);

    try {
      const chave = `panoramas/${clienteId}/${Date.now()}-${file.name.replace(/\s/g, "_")}`;

      const res = await fetch("/api/admin/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chave, tipoArquivo: file.type }),
      });
      if (!res.ok) throw new Error("Falha ao obter URL de upload.");
      const { uploadUrl, publicUrl } = await res.json();

      await xhrUpload(uploadUrl, file, setProgress);

      await saveArquivo(clienteId, {
        nome: nome || file.name.replace(/\.[^.]+$/, ""),
        descricao,
        categoria: "panorama",
        url: publicUrl,
        tipo_arquivo: file.type,
        tamanho_bytes: file.size,
      });

      setDone(true);
      setNome("");
      setDescricao("");
      setSelectedFile(null);
      setTimeout(() => setDone(false), 3000);
    } catch (e: unknown) {
      setErro(e instanceof Error ? e.message : "Erro desconhecido.");
    } finally {
      setUploading(false);
      setProgress(0);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      setSelectedFile(file);
      if (!nome) setNome(file.name.replace(/\.[^.]+$/, ""));
    }
  }

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${
          dragOver ? "border-[var(--verde-escuro)] bg-[var(--creme-escuro)]" : "border-[var(--border)] hover:border-[var(--verde-claro)] hover:bg-[var(--creme-escuro)]"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) { setSelectedFile(f); if (!nome) setNome(f.name.replace(/\.[^.]+$/, "")); }
          }}
        />
        <div className="flex flex-col items-center gap-2">
          <div className="w-12 h-12 rounded-full bg-[var(--creme-escuro)] flex items-center justify-center">
            <Upload size={20} className="text-[var(--verde-escuro)]" />
          </div>
          {selectedFile ? (
            <div>
              <p className="font-medium text-sm text-[var(--verde-escuro)]">{selectedFile.name}</p>
              <p className="text-xs text-[var(--muted-foreground)]">{(selectedFile.size / 1024 / 1024).toFixed(1)} MB</p>
            </div>
          ) : (
            <div>
              <p className="font-medium text-sm">Arraste a imagem 360° aqui</p>
              <p className="text-xs text-[var(--muted-foreground)] mt-0.5">ou clique para selecionar • JPG, PNG, WEBP</p>
            </div>
          )}
        </div>
      </div>

      {erro && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-md">{erro}</p>
      )}

      {selectedFile && (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <Input label="Nome" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome do ambiente" />
            <Input label="Descrição (opcional)" value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Ex: Sala de estar" />
          </div>
          {uploading && (
            <div className="space-y-1">
              <div className="w-full bg-[var(--creme-escuro)] rounded-full h-2">
                <div className="bg-[var(--verde-escuro)] h-2 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
              </div>
              <p className="text-xs text-[var(--muted-foreground)] text-center">{progress}% enviado</p>
            </div>
          )}
          <div className="flex gap-2">
            <Btn onClick={() => { setSelectedFile(null); setNome(""); setErro(""); }} variant="ghost" disabled={uploading}>
              <X size={13} /> Cancelar
            </Btn>
            <Btn onClick={() => upload(selectedFile)} disabled={uploading || !nome}>
              {uploading ? `Enviando ${progress}%...` : done ? <><Check size={13} /> Salvo!</> : <><Upload size={13} /> Enviar panorama</>}
            </Btn>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Arquivo Upload (documentos) ────────────────────────────
function ArquivoUpload({ clienteId, subcategoriasExecutivo = [] }: { clienteId: string; subcategoriasExecutivo?: string[] }) {
  const [file, setFile] = useState<File | null>(null);
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [categoria, setCategoria] = useState("orcamento");
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [done, setDone] = useState(false);
  const [erro, setErro] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const categorias = ["orcamento", "contrato", "ata", "destaque", "outro", ...subcategoriasExecutivo];

  async function upload() {
    if (!file) return;
    setUploading(true);
    setErro("");
    setProgress(0);
    try {
      const chave = `arquivos/${clienteId}/${Date.now()}-${file.name.replace(/\s/g, "_")}`;
      const res = await fetch("/api/admin/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chave, tipoArquivo: file.type }),
      });
      if (!res.ok) throw new Error("Falha ao obter URL de upload.");
      const { uploadUrl, publicUrl } = await res.json();

      await xhrUpload(uploadUrl, file, setProgress);

      await saveArquivo(clienteId, { nome: nome || file.name, descricao, categoria, url: publicUrl, tipo_arquivo: file.type, tamanho_bytes: file.size });
      setDone(true); setFile(null); setNome(""); setDescricao("");
      setTimeout(() => setDone(false), 3000);
    } catch (e: unknown) {
      setErro(e instanceof Error ? e.message : "Erro desconhecido.");
    } finally {
      setUploading(false); setProgress(0);
    }
  }

  return (
    <div className="space-y-3 p-4 border border-dashed border-[var(--border)] rounded-lg">
      <div className="flex items-center gap-3">
        <button onClick={() => inputRef.current?.click()} className="flex items-center gap-2 px-3 py-2 text-sm border border-[var(--border)] rounded-md hover:bg-[var(--creme-escuro)] transition-colors">
          <FileText size={14} /> {file ? file.name : "Selecionar arquivo"}
        </button>
        {file && <span className="text-xs text-[var(--muted-foreground)]">{(file.size / 1024 / 1024).toFixed(2)} MB</span>}
        <input ref={inputRef} type="file" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) { setFile(f); if (!nome) setNome(f.name.replace(/\.[^.]+$/, "")); } }} />
      </div>
      {erro && <p className="text-xs text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-md">{erro}</p>}
      {file && (
        <div className="grid grid-cols-3 gap-2">
          <Input label="Nome" value={nome} onChange={(e) => setNome(e.target.value)} />
          <Input label="Descrição" value={descricao} onChange={(e) => setDescricao(e.target.value)} />
          <div className="space-y-1">
            <label className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wide">Categoria</label>
            <select value={categoria} onChange={(e) => setCategoria(e.target.value)}
              className="w-full border border-[var(--border)] rounded-md px-3 py-2 text-sm outline-none focus:border-[var(--verde-escuro)] bg-white">
              {categorias.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
            </select>
          </div>
        </div>
      )}
      {uploading && (
        <div className="w-full bg-[var(--creme-escuro)] rounded-full h-1.5">
          <div className="bg-[var(--verde-escuro)] h-1.5 rounded-full transition-all" style={{ width: `${progress}%` }} />
        </div>
      )}
      {file && (
        <Btn onClick={upload} disabled={uploading || !nome}>
          {uploading ? `Enviando ${progress}%...` : done ? <><Check size={13} /> Salvo!</> : <><Upload size={13} /> Enviar arquivo</>}
        </Btn>
      )}
    </div>
  );
}

// ── Main Tabs Component ────────────────────────────────────
const TABS = [
  { id: "perfil", label: "Perfil", icon: User },
  { id: "panoramas", label: "Panoramas 360°", icon: ImageIcon },
  { id: "visual3d", label: "Visual 3D", icon: Video },
  { id: "executivo_subs", label: "Executivo", icon: Building2 },
  { id: "arquivos", label: "Documentos", icon: FileText },
  { id: "progresso", label: "Progresso", icon: BarChart2 },
  { id: "aprovacoes", label: "Aprovações", icon: CheckSquare },
  { id: "reunioes", label: "Reuniões", icon: MessageSquare },
  { id: "cuidados", label: "Cuidados", icon: Shield },
];

export function TabsCliente({ clienteId, initialData }: { clienteId: string; initialData: ClientData }) {
  const [tab, setTab] = useState("perfil");
  const [isPending, startTransition] = useTransition();
  const data = initialData;

  function run(fn: () => Promise<unknown>) {
    startTransition(async () => { await fn(); });
  }

  // ── TAB: Perfil ──────────────────────────────────────────
  function TabPerfil() {
    const [nome, setNome] = useState(data.profile.nome ?? "");
    const [nomeProjeto, setNomeProjeto] = useState(data.profile.nome_projeto ?? "");
    const [sheetsUrl, setSheetsUrl] = useState(data.profile.google_sheets_url ?? "");
    const [saved, setSaved] = useState(false);

    function save() {
      run(async () => {
        await updateProfile(clienteId, { nome, nome_projeto: nomeProjeto, google_sheets_url: sheetsUrl });
        setSaved(true); setTimeout(() => setSaved(false), 2000);
      });
    }

    return (
      <div className="space-y-4 max-w-lg">
        <Card>
          <SectionTitle>Dados do cliente</SectionTitle>
          <div className="space-y-3">
            <Input label="Nome" value={nome} onChange={(e) => setNome(e.target.value)} />
            <Input label="Nome do projeto" value={nomeProjeto} onChange={(e) => setNomeProjeto(e.target.value)} />
            <Input label="URL do Google Sheets" value={sheetsUrl} onChange={(e) => setSheetsUrl(e.target.value)} placeholder="https://docs.google.com/..." />
          </div>
          <div className="mt-4">
            <Btn onClick={save} disabled={isPending}>
              {saved ? <><Check size={13} /> Salvo!</> : <><Edit2 size={13} /> Salvar alterações</>}
            </Btn>
          </div>
        </Card>
      </div>
    );
  }

  // ── TAB: Panoramas 360° ──────────────────────────────────
  function TabPanoramas() {
    const [corsOk, setCorsOk] = useState<boolean | null>(null);

    async function configurarCors() {
      setCorsOk(null);
      try {
        const res = await fetch("/api/admin/setup-r2-cors", { method: "POST" });
        setCorsOk(res.ok);
      } catch {
        setCorsOk(false);
      }
    }

    return (
      <div className="space-y-6">
        <Card>
          <SectionTitle>Adicionar panorama 360°</SectionTitle>
          <PanoramaUpload clienteId={clienteId} />
        </Card>

        <Card>
          <SectionTitle>Configuração de upload</SectionTitle>
          <p className="text-xs text-[var(--muted-foreground)] mb-3">
            Se o upload ficar em 0%, clique abaixo para configurar o CORS do R2 (necessário apenas uma vez).
          </p>
          <div className="flex items-center gap-3">
            <Btn variant="ghost" onClick={configurarCors}>
              Configurar CORS do R2
            </Btn>
            {corsOk === true && <span className="text-xs text-green-600 font-medium">✓ CORS configurado! Tente o upload novamente.</span>}
            {corsOk === false && <span className="text-xs text-red-600">Erro ao configurar. Verifique as variáveis R2 no Vercel.</span>}
          </div>
        </Card>

        {data.panoramas.length > 0 && (
          <Card>
            <SectionTitle>Panoramas publicados ({data.panoramas.length})</SectionTitle>
            <div className="space-y-2">
              {data.panoramas.map((p) => (
                <div key={p.id} className="flex items-center justify-between py-2 border-b border-[var(--border)] last:border-0">
                  <div>
                    <p className="text-sm font-medium">{p.nome}</p>
                    {p.descricao && <p className="text-xs text-[var(--muted-foreground)]">{p.descricao}</p>}
                    <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                      {new Date(p.created_at).toLocaleDateString("pt-BR")}
                      {p.tamanho_bytes ? ` · ${(p.tamanho_bytes / 1024 / 1024).toFixed(1)} MB` : ""}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <a href={p.url} target="_blank" rel="noreferrer" className="text-xs text-[var(--verde-escuro)] hover:underline">Ver</a>
                    <Btn variant="danger" disabled={isPending} onClick={() => {
                      const chave = p.url.split("/").slice(-3).join("/");
                      run(() => deleteArquivo(p.id, chave, clienteId));
                    }}>
                      <Trash2 size={12} />
                    </Btn>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    );
  }

  // ── TAB: Visual 3D (Canva) ───────────────────────────────
  function TabVisual3D() {
    const visuais = data.arquivos.filter(a => a.categoria === "visual_3d");
    const [nome, setNome] = useState("");
    const [url, setUrl] = useState("");

    function add() {
      if (!nome || !url) return;
      run(async () => {
        await saveArquivo(clienteId, { nome, categoria: "visual_3d", url });
        setNome(""); setUrl("");
      });
    }

    return (
      <div className="space-y-4">
        <Card>
          <SectionTitle>Adicionar embed Canva / Visual 3D</SectionTitle>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Título" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: Sala de Estar - Vista 1" />
            <Input label="URL do embed Canva" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://www.canva.com/..." />
          </div>
          <div className="mt-3">
            <Btn onClick={add} disabled={isPending || !nome || !url}><Plus size={13} /> Adicionar</Btn>
          </div>
        </Card>

        {visuais.length > 0 && (
          <Card>
            <SectionTitle>Visuais publicados ({visuais.length})</SectionTitle>
            <div className="space-y-2">
              {visuais.map((v) => (
                <div key={v.id} className="flex items-center justify-between py-2 border-b border-[var(--border)] last:border-0">
                  <div>
                    <p className="text-sm font-medium">{v.nome}</p>
                    <p className="text-xs text-[var(--muted-foreground)] truncate max-w-xs">{v.url}</p>
                  </div>
                  <Btn variant="danger" disabled={isPending} onClick={() => run(() => deleteArquivo(v.id, "", clienteId))}>
                    <Trash2 size={12} />
                  </Btn>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    );
  }

  // ── TAB: Documentos ───────────────────────────────────────
  function TabArquivos() {
    const docs = data.arquivos.filter(a => a.categoria !== "visual_3d");
    return (
      <div className="space-y-4">
        <Card>
          <SectionTitle>Enviar documento</SectionTitle>
          <ArquivoUpload clienteId={clienteId} subcategoriasExecutivo={data.profile.subcategorias_executivo ?? []} />
        </Card>

        {docs.length > 0 && (
          <Card>
            <SectionTitle>Documentos ({docs.length})</SectionTitle>
            <div className="space-y-2">
              {docs.map((a) => (
                <div key={a.id} className="flex items-center justify-between py-2 border-b border-[var(--border)] last:border-0">
                  <div>
                    <p className="text-sm font-medium">{a.nome}</p>
                    <p className="text-xs text-[var(--muted-foreground)]">{a.categoria} · {new Date(a.created_at).toLocaleDateString("pt-BR")}</p>
                  </div>
                  <div className="flex gap-2">
                    <a href={a.url} target="_blank" rel="noreferrer" className="text-xs text-[var(--verde-escuro)] hover:underline">Abrir</a>
                    <Btn variant="danger" disabled={isPending} onClick={() => {
                      const chave = a.url.split("/").slice(-3).join("/");
                      run(() => deleteArquivo(a.id, chave, clienteId));
                    }}><Trash2 size={12} /></Btn>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    );
  }

  // ── TAB: Cronograma ───────────────────────────────────────
  function TabCronograma() {
    const [titulo, setTitulo] = useState("");
    const [descricao, setDescricao] = useState("");
    const [data_prevista, setDataPrevista] = useState("");

    return (
      <div className="space-y-4">
        <Card>
          <SectionTitle>Adicionar etapa</SectionTitle>
          <div className="grid grid-cols-3 gap-3">
            <Input label="Título" value={titulo} onChange={(e) => setTitulo(e.target.value)} />
            <Input label="Descrição" value={descricao} onChange={(e) => setDescricao(e.target.value)} />
            <Input label="Data prevista" type="date" value={data_prevista} onChange={(e) => setDataPrevista(e.target.value)} />
          </div>
          <div className="mt-3">
            <Btn onClick={() => { if (!titulo || !data_prevista) return; run(async () => { await saveCronograma(clienteId, { titulo, descricao, data_prevista }); setTitulo(""); setDescricao(""); setDataPrevista(""); }); }} disabled={isPending || !titulo || !data_prevista}>
              <Plus size={13} /> Adicionar
            </Btn>
          </div>
        </Card>

        {data.cronograma.length > 0 && (
          <Card>
            <SectionTitle>Etapas ({data.cronograma.length})</SectionTitle>
            <div className="space-y-2">
              {data.cronograma.map((c) => (
                <div key={c.id} className="flex items-center justify-between py-2 border-b border-[var(--border)] last:border-0">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => run(() => updateCronograma(c.id, { concluido: !c.concluido }, clienteId))}
                      className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${c.concluido ? "bg-[var(--verde-escuro)] border-[var(--verde-escuro)]" : "border-[var(--border)]"}`}
                    >
                      {c.concluido && <Check size={11} className="text-white" />}
                    </button>
                    <div>
                      <p className={`text-sm font-medium ${c.concluido ? "line-through text-[var(--muted-foreground)]" : ""}`}>{c.titulo}</p>
                      <p className="text-xs text-[var(--muted-foreground)]">
                        {new Date(c.data_prevista + "T12:00:00").toLocaleDateString("pt-BR")}
                        {c.descricao && ` · ${c.descricao}`}
                      </p>
                    </div>
                  </div>
                  <Btn variant="danger" disabled={isPending} onClick={() => run(() => deleteCronograma(c.id, clienteId))}><Trash2 size={12} /></Btn>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    );
  }

  // ── TAB: Progresso ────────────────────────────────────────
  function TabProgresso() {
    const [pCriativo, setPCriativo] = useState<number>(data.profile.progresso_criativo ?? 0);
    const [pExecutivo, setPExecutivo] = useState<number>(data.profile.progresso_executivo ?? 0);
    const [dataCriativo, setDataCriativo] = useState<string>(data.profile.data_entrega_criativo ?? "");
    const [dataExecutivo, setDataExecutivo] = useState<string>(data.profile.data_entrega_executivo ?? "");
    const [saved, setSaved] = useState(false);

    function save() {
      run(async () => {
        await updateProfile(clienteId, {
          progresso_criativo: pCriativo,
          progresso_executivo: pExecutivo,
          data_entrega_criativo: dataCriativo || null,
          data_entrega_executivo: dataExecutivo || null,
        });
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      });
    }

    function SliderEtapa({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
      return (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{label}</span>
            <span className="text-2xl font-bold text-[var(--verde-escuro)]">{value}%</span>
          </div>
          <input
            type="range" min={0} max={100} step={5} value={value}
            onChange={(e) => onChange(+e.target.value)}
            className="w-full h-2 rounded-full appearance-none cursor-pointer accent-[var(--terracota)]"
          />
          <div className="w-full bg-[var(--creme-escuro)] rounded-full h-2 -mt-1">
            <div
              className="h-2 rounded-full transition-all duration-300"
              style={{
                width: `${value}%`,
                background: value === 100 ? "var(--verde-escuro)" : "linear-gradient(90deg, var(--terracota), var(--terracota-claro))",
              }}
            />
          </div>
          <div className="flex justify-between text-xs text-[var(--muted-foreground)]">
            <span>0%</span><span>25%</span><span>50%</span><span>75%</span><span>100%</span>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4 max-w-lg">
        <Card>
          <SectionTitle>Progresso das etapas</SectionTitle>
          <div className="space-y-6">
            <SliderEtapa label="Etapa Criativa" value={pCriativo} onChange={setPCriativo} />
            <SliderEtapa label="Etapa Executiva" value={pExecutivo} onChange={setPExecutivo} />
          </div>
        </Card>

        <Card>
          <SectionTitle>Datas de entrega</SectionTitle>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Prazo — Etapa Criativa" type="date" value={dataCriativo} onChange={(e) => setDataCriativo(e.target.value)} />
            <Input label="Prazo — Etapa Executiva" type="date" value={dataExecutivo} onChange={(e) => setDataExecutivo(e.target.value)} />
          </div>
        </Card>

        <Btn onClick={save} disabled={isPending}>
          {saved ? <><Check size={13} /> Salvo!</> : <><Edit2 size={13} /> Salvar progresso</>}
        </Btn>
      </div>
    );
  }

  // ── TAB: Aprovações ───────────────────────────────────────
  function TabAprovacoes() {
    const statusLabels: Record<string, string> = { pendente: "Pendente", aprovado: "Aprovado", revisao: "Revisão solicitada" };
    const statusColors: Record<string, string> = { pendente: "bg-yellow-100 text-yellow-700", aprovado: "bg-green-100 text-green-700", revisao: "bg-red-100 text-red-600" };

    return (
      <div className="space-y-4">
        <Card>
          <SectionTitle>Criar aprovação</SectionTitle>
          <div className="flex gap-2">
            {["criativo", "executivo"].map(etapa => (
              <Btn key={etapa} variant="ghost" disabled={isPending} onClick={() => run(() => saveAprovacao(clienteId, etapa))}>
                <Plus size={13} /> Etapa {etapa.charAt(0).toUpperCase() + etapa.slice(1)}
              </Btn>
            ))}
          </div>
        </Card>

        {data.aprovacoes.length > 0 && (
          <Card>
            <SectionTitle>Aprovações ({data.aprovacoes.length})</SectionTitle>
            <div className="space-y-3">
              {data.aprovacoes.map((a) => (
                <div key={a.id} className="flex items-start justify-between py-3 border-b border-[var(--border)] last:border-0">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium capitalize">{a.etapa}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[a.status]}`}>{statusLabels[a.status]}</span>
                    </div>
                    {a.comentario && <p className="text-xs text-[var(--muted-foreground)] italic">"{a.comentario}"</p>}
                    <p className="text-xs text-[var(--muted-foreground)] mt-1">Atualizado: {new Date(a.updated_at).toLocaleDateString("pt-BR")}</p>
                  </div>
                  <div className="flex gap-1 flex-wrap">
                    {["pendente", "aprovado", "revisao"].map(s => (
                      <button key={s} disabled={isPending || a.status === s}
                        onClick={() => run(() => updateAprovacao(a.id, s, clienteId))}
                        className={`text-xs px-2 py-1 rounded-md border transition-colors ${a.status === s ? "border-[var(--verde-escuro)] text-[var(--verde-escuro)] font-medium" : "border-[var(--border)] hover:bg-[var(--creme-escuro)]"} disabled:opacity-40`}>
                        {statusLabels[s]}
                      </button>
                    ))}
                    <Btn variant="danger" disabled={isPending} onClick={() => run(() => deleteAprovacao(a.id, clienteId))}><Trash2 size={12} /></Btn>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    );
  }

  // ── TAB: Reuniões ─────────────────────────────────────────
  function TabReunioes() {
    const [dataR, setDataR] = useState("");
    const [assunto, setAssunto] = useState("");
    const [ata, setAta] = useState("");
    const [editId, setEditId] = useState<string | null>(null);

    return (
      <div className="space-y-4">
        <Card>
          <SectionTitle>{editId ? "Editar reunião" : "Adicionar reunião"}</SectionTitle>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Input label="Data" type="date" value={dataR} onChange={(e) => setDataR(e.target.value)} />
              <Input label="Assunto" value={assunto} onChange={(e) => setAssunto(e.target.value)} />
            </div>
            <Textarea label="Ata / Notas" value={ata} onChange={(e) => setAta(e.target.value)} placeholder="Resumo da reunião..." />
          </div>
          <div className="mt-3 flex gap-2">
            {editId && (
              <Btn variant="ghost" onClick={() => { setEditId(null); setDataR(""); setAssunto(""); setAta(""); }}>Cancelar</Btn>
            )}
            <Btn disabled={isPending || !dataR || !assunto} onClick={() => {
              run(async () => {
                if (editId) {
                  await updateReuniao(editId, { data_reuniao: dataR, assunto, ata_texto: ata }, clienteId);
                  setEditId(null);
                } else {
                  await saveReuniao(clienteId, { data_reuniao: dataR, assunto, ata_texto: ata });
                }
                setDataR(""); setAssunto(""); setAta("");
              });
            }}>
              <Plus size={13} /> {editId ? "Salvar" : "Adicionar"}
            </Btn>
          </div>
        </Card>

        {data.reunioes.length > 0 && (
          <Card>
            <SectionTitle>Reuniões ({data.reunioes.length})</SectionTitle>
            <div className="space-y-2">
              {data.reunioes.map((r) => (
                <div key={r.id} className="py-3 border-b border-[var(--border)] last:border-0">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium">{r.assunto}</p>
                      <p className="text-xs text-[var(--muted-foreground)]">{new Date(r.data_reuniao + "T12:00:00").toLocaleDateString("pt-BR")}</p>
                      {r.ata_texto && <p className="text-xs text-[var(--foreground)] mt-1 line-clamp-2">{r.ata_texto}</p>}
                    </div>
                    <div className="flex gap-1 shrink-0 ml-3">
                      <Btn variant="ghost" onClick={() => { setEditId(r.id); setDataR(r.data_reuniao); setAssunto(r.assunto); setAta(r.ata_texto ?? ""); }}>
                        <Edit2 size={12} />
                      </Btn>
                      <Btn variant="danger" disabled={isPending} onClick={() => run(() => deleteReuniao(r.id, clienteId))}><Trash2 size={12} /></Btn>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    );
  }

  // ── TAB: Cuidados ─────────────────────────────────────────
  function TabCuidados() {
    const [material, setMaterial] = useState("");
    const [descricao, setDescricao] = useState("");

    return (
      <div className="space-y-4">
        <Card>
          <SectionTitle>Adicionar cuidado</SectionTitle>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Material" value={material} onChange={(e) => setMaterial(e.target.value)} placeholder="Ex: Mármore, Madeira..." />
            <Textarea label="Instrução" value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Como cuidar deste material..." />
          </div>
          <div className="mt-3">
            <Btn disabled={isPending || !material || !descricao} onClick={() => {
              run(async () => { await saveCuidado(clienteId, { material, descricao, ordem: data.cuidados.length }); setMaterial(""); setDescricao(""); });
            }}>
              <Plus size={13} /> Adicionar
            </Btn>
          </div>
        </Card>

        {data.cuidados.length > 0 && (
          <Card>
            <SectionTitle>Cuidados ({data.cuidados.length})</SectionTitle>
            <div className="space-y-2">
              {data.cuidados.map((c) => (
                <div key={c.id} className="flex items-start justify-between py-2 border-b border-[var(--border)] last:border-0">
                  <div>
                    <p className="text-sm font-medium">{c.material}</p>
                    <p className="text-xs text-[var(--muted-foreground)]">{c.descricao}</p>
                  </div>
                  <Btn variant="danger" disabled={isPending} onClick={() => run(() => deleteCuidado(c.id, clienteId))}><Trash2 size={12} /></Btn>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    );
  }

  // ── TAB: Executivo (subcategorias) ────────────────────────
  function TabExecutivoSubs() {
    const [subs, setSubs] = useState<string[]>(data.profile.subcategorias_executivo ?? []);
    const [novaSub, setNovaSub] = useState("");
    const [saved, setSaved] = useState(false);

    function add() {
      const slug = novaSub.toLowerCase().trim().replace(/\s+/g, "_");
      if (!slug || subs.includes(slug)) return;
      setSubs([...subs, slug]);
      setNovaSub("");
    }

    function remove(sub: string) {
      setSubs(subs.filter((s) => s !== sub));
    }

    function save() {
      run(async () => {
        await updateProfile(clienteId, { subcategorias_executivo: subs });
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      });
    }

    return (
      <div className="space-y-4 max-w-lg">
        <Card>
          <SectionTitle>Subcategorias do Executivo</SectionTitle>
          <p className="text-xs text-[var(--muted-foreground)] mb-4">
            Crie subcategorias como "Obra", "Marcenaria", "Cozinha". Elas aparecem no menu lateral do cliente e permitem o upload de arquivos específicos.
          </p>
          <div className="flex gap-2 mb-4">
            <Input
              value={novaSub}
              onChange={(e) => setNovaSub(e.target.value)}
              placeholder="Ex: Obra, Cozinha, Suite..."
              onKeyDown={(e) => e.key === "Enter" && add()}
            />
            <Btn onClick={add} disabled={!novaSub}>
              <Plus size={13} /> Adicionar
            </Btn>
          </div>
          {subs.length > 0 ? (
            <ul className="space-y-1 mb-4">
              {subs.map((sub) => (
                <li key={sub} className="flex items-center justify-between py-2 border-b border-[var(--border)] last:border-0">
                  <div>
                    <p className="text-sm font-medium">{sub.charAt(0).toUpperCase() + sub.slice(1)}</p>
                    <p className="text-xs text-[var(--muted-foreground)]">/dashboard/executivo/{sub}</p>
                  </div>
                  <Btn variant="danger" onClick={() => remove(sub)}>
                    <Trash2 size={12} />
                  </Btn>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-[var(--muted-foreground)] italic mb-4">Nenhuma subcategoria criada ainda.</p>
          )}
          <Btn onClick={save} disabled={isPending}>
            {saved ? <><Check size={13} /> Salvo!</> : <><Edit2 size={13} /> Salvar subcategorias</>}
          </Btn>
        </Card>
      </div>
    );
  }

  const tabComponents: Record<string, React.ReactNode> = {
    perfil: <TabPerfil />,
    panoramas: <TabPanoramas />,
    visual3d: <TabVisual3D />,
    executivo_subs: <TabExecutivoSubs />,
    arquivos: <TabArquivos />,
    cronograma: <TabCronograma />,
    progresso: <TabProgresso />,
    aprovacoes: <TabAprovacoes />,
    reunioes: <TabReunioes />,
    cuidados: <TabCuidados />,
  };

  return (
    <div className="space-y-4">
      {/* Header do cliente */}
      <div className="bg-white border border-[var(--border)] rounded-lg px-5 py-4 flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-[var(--verde-escuro)] flex items-center justify-center text-white font-semibold">
          {data.profile.nome?.charAt(0)?.toUpperCase() ?? "?"}
        </div>
        <div>
          <p className="font-semibold text-[var(--verde-escuro)]">{data.profile.nome}</p>
          {data.profile.nome_projeto && <p className="text-sm text-[var(--muted-foreground)]">{data.profile.nome_projeto}</p>}
        </div>
        {isPending && <span className="ml-auto text-xs text-[var(--muted-foreground)] animate-pulse">Salvando...</span>}
      </div>

      {/* Tabs nav */}
      <div className="bg-white border border-[var(--border)] rounded-lg overflow-hidden">
        <div className="flex overflow-x-auto border-b border-[var(--border)]">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex items-center gap-1.5 px-4 py-3 text-xs font-medium whitespace-nowrap transition-colors border-b-2 ${
                tab === id
                  ? "border-[var(--verde-escuro)] text-[var(--verde-escuro)] bg-[var(--creme)]"
                  : "border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--creme-escuro)]"
              }`}
            >
              <Icon size={13} />
              {label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="p-5">
          {tabComponents[tab]}
        </div>
      </div>
    </div>
  );
}
