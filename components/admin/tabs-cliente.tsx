"use client";

import { useState, useTransition, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  User, FileText, Image as ImageIcon, Video, Calendar, BarChart2,
  CheckSquare, MessageSquare, Shield, Trash2, Plus, Check, Edit2, Upload, X, Building2,
  Lock, Unlock, KeyRound, Table2, BookOpen, GripVertical,
} from "lucide-react";
import {
  updateProfile, saveArquivo, updateArquivo, deleteArquivo,
  saveCronograma, updateCronograma, deleteCronograma,
  saveProgresso, updateProgresso, deleteProgresso,
  saveAprovacao, updateAprovacao, deleteAprovacao, adminToggleBloqueio,
  saveReuniao, updateReuniao, deleteReuniao,
  saveReuniaoAgendada, updateReuniaoAgendada, deleteReuniaoAgendada,
  saveCuidado, updateCuidado, deleteCuidado,
  changeClientPassword, reorderPanoramas,
} from "@/app/admin/actions";

// ── Types ──────────────────────────────────────────────────
type Profile = {
  id: string; nome: string; nome_projeto?: string; google_sheets_url?: string;
  progresso_criativo?: number; progresso_executivo?: number;
  data_entrega_criativo?: string; data_entrega_executivo?: string;
  subcategorias_executivo?: string[];
};
type Arquivo = { id: string; nome: string; descricao?: string; categoria: string; url: string; tipo_arquivo?: string; tamanho_bytes?: number; created_at: string; ordem?: number; x_pos?: number | null; y_pos?: number | null };
type Cronograma = { id: string; titulo: string; descricao?: string; data_prevista: string; concluido: boolean };
type Progresso = { id: string; etapa: string; item: string; percentual: number; status: string; ordem: number };
type Aprovacao = { id: string; etapa: string; status: string; comentario?: string; updated_at: string; bloqueado?: boolean };
type Reuniao = { id: string; data_reuniao: string; assunto: string; ata_texto?: string; ata_url?: string; ata_nome?: string };
type ReuniaoAgendada = { id: string; data_reuniao: string; horario: string; modalidade: string; assunto?: string; link_reuniao?: string; local_reuniao?: string };
type Cuidado = { id: string; material: string; descricao: string; ordem: number };

type ClientData = {
  profile: Profile;
  arquivos: Arquivo[];
  panoramas: Arquivo[];
  cronograma: Cronograma[];
  progresso: Progresso[];
  aprovacoes: Aprovacao[];
  reunioes: Reuniao[];
  reunioesAgendadas: ReuniaoAgendada[];
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

  const categorias = ["orcamento", "contrato", "destaque", "outro", ...subcategoriasExecutivo];

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
  { id: "midias3d", label: "3D", icon: Video },
  { id: "planilhas", label: "Planilhas", icon: Table2 },
  { id: "executivo_subs", label: "Executivo", icon: Building2 },
  { id: "arquivos", label: "Documentos", icon: FileText },
  { id: "progresso", label: "Progresso", icon: BarChart2 },
  { id: "aprovacoes", label: "Aprovações", icon: CheckSquare },
  { id: "agenda_reunioes", label: "Agenda", icon: Calendar },
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
    const [destaqueUploading, setDestaqueUploading] = useState(false);
    const [destaqueProgress, setDestaqueProgress] = useState(0);
    const [destaqueDone, setDestaqueDone] = useState(false);
    const [destaqueErro, setDestaqueErro] = useState("");
    const destaqueRef = useRef<HTMLInputElement>(null);
    const destaqueAtual = data.arquivos.find(a => a.categoria === "destaque");

    function save() {
      run(async () => {
        await updateProfile(clienteId, { nome, nome_projeto: nomeProjeto, google_sheets_url: sheetsUrl });
        setSaved(true); setTimeout(() => setSaved(false), 2000);
      });
    }

    async function uploadDestaque(file: File) {
      setDestaqueUploading(true);
      setDestaqueErro("");
      setDestaqueProgress(0);
      try {
        if (destaqueAtual) {
          const chave = destaqueAtual.url.split("/").slice(-3).join("/");
          await deleteArquivo(destaqueAtual.id, chave, clienteId);
        }
        const chave = `arquivos/${clienteId}/${Date.now()}-${file.name.replace(/\s/g, "_")}`;
        const res = await fetch("/api/admin/upload-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chave, tipoArquivo: file.type }),
        });
        if (!res.ok) throw new Error("Falha ao obter URL de upload.");
        const { uploadUrl, publicUrl } = await res.json();
        await xhrUpload(uploadUrl, file, setDestaqueProgress);
        await saveArquivo(clienteId, { nome: "Imagem de Destaque", categoria: "destaque", url: publicUrl, tipo_arquivo: file.type, tamanho_bytes: file.size });
        setDestaqueDone(true);
        setTimeout(() => setDestaqueDone(false), 3000);
      } catch (e: unknown) {
        setDestaqueErro(e instanceof Error ? e.message : "Erro desconhecido.");
      } finally {
        setDestaqueUploading(false);
        setDestaqueProgress(0);
      }
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

        <Card>
          <SectionTitle>Imagem de Destaque</SectionTitle>
          <p className="text-xs text-[var(--muted-foreground)] mb-3">Aparece como imagem principal no topo do dashboard do cliente.</p>
          {destaqueAtual && (
            <div className="mb-3 rounded-lg overflow-hidden border border-[var(--border)] relative" style={{ aspectRatio: "16/6" }}>
              <img src={destaqueAtual.url} alt="Destaque atual" className="w-full h-full object-cover" />
              <div className="absolute top-2 right-2">
                <Btn variant="danger" disabled={isPending} onClick={() => {
                  const chave = destaqueAtual.url.split("/").slice(-3).join("/");
                  run(() => deleteArquivo(destaqueAtual.id, chave, clienteId));
                }}>
                  <Trash2 size={12} /> Remover
                </Btn>
              </div>
            </div>
          )}
          {destaqueErro && <p className="text-xs text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-md mb-3">{destaqueErro}</p>}
          {destaqueUploading && (
            <div className="mb-3 space-y-1">
              <div className="w-full bg-[var(--creme-escuro)] rounded-full h-2">
                <div className="bg-[var(--verde-escuro)] h-2 rounded-full transition-all" style={{ width: `${destaqueProgress}%` }} />
              </div>
              <p className="text-xs text-center text-[var(--muted-foreground)]">{destaqueProgress}% enviado</p>
            </div>
          )}
          <input ref={destaqueRef} type="file" accept="image/*" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadDestaque(f); }} />
          <Btn onClick={() => destaqueRef.current?.click()} disabled={destaqueUploading || isPending}>
            {destaqueUploading ? `Enviando ${destaqueProgress}%...`
              : destaqueDone ? <><Check size={13} /> Salvo!</>
              : <><Upload size={13} /> {destaqueAtual ? "Trocar imagem" : "Selecionar imagem"}</>}
          </Btn>
        </Card>

        <CardAlterarSenha />
      </div>
    );
  }

  // ── TAB: Perfil (senha) ───────────────────────────────────
  function CardAlterarSenha() {
    const [senha, setSenha] = useState("");
    const [ok, setOk] = useState(false);
    const [erro, setErro] = useState("");

    return (
      <Card>
        <SectionTitle><KeyRound size={14} className="inline mr-1" />Alterar senha do cliente</SectionTitle>
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <Input label="Nova senha" type="password" value={senha} onChange={(e) => { setSenha(e.target.value); setOk(false); setErro(""); }} placeholder="Mínimo 6 caracteres" />
          </div>
          <Btn disabled={isPending || senha.length < 6} onClick={() => {
            run(async () => {
              try {
                await changeClientPassword(clienteId, senha);
                setOk(true); setSenha(""); setTimeout(() => setOk(false), 3000);
              } catch (e: unknown) { setErro(e instanceof Error ? e.message : "Erro ao alterar senha."); }
            });
          }}>
            {ok ? <><Check size={13} /> Alterada!</> : "Salvar"}
          </Btn>
        </div>
        {erro && <p className="text-xs text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-md mt-2">{erro}</p>}
      </Card>
    );
  }

  // ── Panoramas Grid (com drag-to-reorder) ─────────────────
  function PanoramasGrid({ clienteId, panoramas, isPending, run }: { clienteId: string; panoramas: Arquivo[]; isPending: boolean; run: (fn: () => Promise<unknown>) => void }) {
    const [items, setItems] = useState(panoramas);
    const [editId, setEditId] = useState<string | null>(null);
    const [editNome, setEditNome] = useState("");
    const [editDesc, setEditDesc] = useState("");
    const [dragOver, setDragOver] = useState<number | null>(null);
    const dragIdx = useRef<number | null>(null);

    useEffect(() => { setItems(panoramas); }, [panoramas]);

    function startEdit(p: Arquivo) { setEditId(p.id); setEditNome(p.nome); setEditDesc(p.descricao ?? ""); }
    function cancelEdit() { setEditId(null); setEditNome(""); setEditDesc(""); }
    function saveEdit(id: string) {
      run(async () => { await updateArquivo(id, { nome: editNome, descricao: editDesc }, clienteId); cancelEdit(); });
    }

    function handleDrop(toIdx: number) {
      const fromIdx = dragIdx.current;
      if (fromIdx === null || fromIdx === toIdx) { setDragOver(null); return; }
      const next = [...items];
      next.splice(toIdx, 0, next.splice(fromIdx, 1)[0]);
      setItems(next);
      setDragOver(null);
      dragIdx.current = null;
      run(async () => {
        await reorderPanoramas(next.map((p, i) => ({ id: p.id, ordem: i })), clienteId);
      });
    }

    return (
      <Card>
        <div className="flex items-center justify-between mb-3">
          <SectionTitle>Panoramas publicados ({items.length})</SectionTitle>
          <span className="text-xs text-[var(--muted-foreground)]">Arraste para reordenar</span>
        </div>

        {editId && (
          <div className="mb-4 p-3 border border-[var(--verde-claro)] rounded-lg bg-[var(--creme-escuro)] space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <Input label="Nome" value={editNome} onChange={(e) => setEditNome(e.target.value)} />
              <Input label="Descrição" value={editDesc} onChange={(e) => setEditDesc(e.target.value)} />
            </div>
            <div className="flex gap-2">
              <Btn onClick={() => saveEdit(editId)} disabled={isPending || !editNome}><Check size={12} /> Salvar</Btn>
              <Btn variant="ghost" onClick={cancelEdit}>Cancelar</Btn>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          {items.map((p, idx) => (
            <div
              key={p.id}
              draggable
              onDragStart={() => { dragIdx.current = idx; }}
              onDragOver={(e) => { e.preventDefault(); setDragOver(idx); }}
              onDragLeave={() => setDragOver(null)}
              onDrop={() => handleDrop(idx)}
              className={`border rounded-lg overflow-hidden bg-white transition-all cursor-grab active:cursor-grabbing ${
                dragOver === idx ? "border-[var(--verde-escuro)] shadow-md scale-[1.02]" : "border-[var(--border)]"
              } ${editId === p.id ? "ring-2 ring-[var(--verde-claro)]" : ""}`}
            >
              <div className="relative aspect-video bg-gray-100 overflow-hidden">
                <img
                  src={p.url}
                  alt={p.nome}
                  className="w-full h-full object-cover"
                  draggable={false}
                />
                <div className="absolute top-1.5 left-1.5 bg-black/50 rounded px-1.5 py-0.5">
                  <GripVertical size={12} className="text-white" />
                </div>
                <a
                  href={p.url}
                  target="_blank"
                  rel="noreferrer"
                  className="absolute top-1.5 right-1.5 bg-black/50 text-white text-xs px-2 py-0.5 rounded hover:bg-black/70"
                  onClick={(e) => e.stopPropagation()}
                >
                  Ver
                </a>
              </div>
              <div className="p-2 space-y-1">
                <p className="text-xs font-medium truncate">{p.nome}</p>
                {p.descricao && <p className="text-xs text-[var(--muted-foreground)] truncate">{p.descricao}</p>}
                <p className="text-xs text-[var(--muted-foreground)]">
                  {new Date(p.created_at).toLocaleDateString("pt-BR")}
                  {p.tamanho_bytes ? ` · ${(p.tamanho_bytes / 1024 / 1024).toFixed(1)} MB` : ""}
                </p>
                <div className="flex gap-1 pt-1">
                  <Btn variant="ghost" onClick={() => startEdit(p)} className="text-xs py-1 px-2"><Edit2 size={11} /> Editar</Btn>
                  <Btn
                    variant="danger"
                    disabled={isPending}
                    className="text-xs py-1 px-2"
                    onClick={() => { const chave = p.url.split("/").slice(-3).join("/"); run(() => deleteArquivo(p.id, chave, clienteId)); }}
                  >
                    <Trash2 size={11} />
                  </Btn>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  // ── Planta + Editor de hotspots ──────────────────────────
  function r2Proxy(url: string) {
    return `/api/r2-proxy?url=${encodeURIComponent(url)}`;
  }

  function FloorPlanSection({ planta, panoramas }: { planta: Arquivo | null; panoramas: Arquivo[] }) {
    const router = useRouter();
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [erro, setErro] = useState("");
    const imgRef = useRef<HTMLImageElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    async function uploadPlanta(file: File) {
      setUploading(true); setErro(""); setProgress(0);
      try {
        const chave = `panoramas/${clienteId}/${Date.now()}-planta-${file.name.replace(/\s/g, "_")}`;
        const res = await fetch("/api/admin/upload-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chave, tipoArquivo: file.type }),
        });
        if (!res.ok) throw new Error("Falha ao obter URL de upload.");
        const { uploadUrl, publicUrl } = await res.json();
        await xhrUpload(uploadUrl, file, setProgress);
        // saveArquivo já deleta a planta antiga atomicamente no servidor
        await saveArquivo(clienteId, { nome: "Planta do projeto", categoria: "planta", url: publicUrl, tipo_arquivo: file.type, tamanho_bytes: file.size });
        router.refresh();
      } catch (e: unknown) {
        setErro(e instanceof Error ? e.message : "Erro desconhecido.");
      } finally { setUploading(false); setProgress(0); }
    }

    function handleMapClick(e: React.MouseEvent<HTMLDivElement>) {
      if (!selectedId || !imgRef.current) return;
      const rect = imgRef.current.getBoundingClientRect();
      const x = Math.max(2, Math.min(98, ((e.clientX - rect.left) / rect.width) * 100));
      const y = Math.max(2, Math.min(98, ((e.clientY - rect.top) / rect.height) * 100));
      const id = selectedId;
      setSelectedId(null);
      run(async () => { await updateArquivo(id, { x_pos: x, y_pos: y }, clienteId); });
    }

    const selectedNome = panoramas.find(p => p.id === selectedId)?.nome;

    return (
      <div className="space-y-4">
        <Card>
          <SectionTitle>Planta do projeto</SectionTitle>
          <p className="text-xs text-[var(--muted-foreground)] mb-3">
            Faça upload da planta baixa do projeto. Depois, posicione cada panorama 360° clicando na planta.
          </p>
          <div className="flex items-center gap-3 flex-wrap">
            <input ref={inputRef} type="file" accept="image/*" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadPlanta(f); e.target.value = ""; }} />
            <Btn variant="ghost" onClick={() => inputRef.current?.click()} disabled={uploading}>
              <Upload size={13} /> {planta ? "Substituir planta" : "Upload da planta"}
            </Btn>
            {planta && <span className="text-xs text-green-600 font-medium">✓ Planta carregada</span>}
          </div>
          {uploading && (
            <div className="mt-2 space-y-1">
              <div className="h-1.5 bg-[var(--creme-escuro)] rounded-full overflow-hidden">
                <div className="h-full bg-[var(--verde-escuro)] transition-all" style={{ width: `${progress}%` }} />
              </div>
              <p className="text-xs text-[var(--muted-foreground)]">{progress}%</p>
            </div>
          )}
          {erro && <p className="text-xs text-red-600 mt-2">{erro}</p>}

          {/* Preview da planta */}
          {planta && !uploading && (
            <div className="mt-3 space-y-1">
              <div className="rounded-lg border border-[var(--border)] bg-white overflow-hidden">
                <img
                  src={r2Proxy(planta.url)}
                  alt="Preview da planta"
                  className="w-full h-auto block"
                  onError={(e) => { (e.currentTarget.parentElement as HTMLElement).style.display = "none"; }}
                />
              </div>
            </div>
          )}
        </Card>

        {planta && panoramas.length > 0 && (
          <Card>
            <SectionTitle>Posicionar panoramas na planta</SectionTitle>
            {selectedId
              ? <p className="text-xs bg-amber-50 border border-amber-200 text-amber-800 rounded-md px-3 py-2 mb-3">Clique na planta para posicionar: <strong>{selectedNome}</strong></p>
              : <p className="text-xs text-[var(--muted-foreground)] mb-3">Selecione um panorama na lista e clique na planta para posicioná-lo.</p>
            }
            <div className="grid grid-cols-3 gap-4">
              {/* Planta com marcadores */}
              <div className="col-span-2">
                <div
                  className={`relative rounded-lg overflow-hidden border-2 transition-colors select-none ${
                    selectedId ? "border-[var(--verde-escuro)] cursor-crosshair" : "border-[var(--border)]"
                  }`}
                  onClick={handleMapClick}
                >
                  <div className="bg-white">
                    <img
                      ref={imgRef}
                      src={r2Proxy(planta.url)}
                      alt="Planta"
                      className="w-full h-auto block"
                      draggable={false}
                      onError={(e) => { (e.currentTarget.parentElement as HTMLElement).style.display = "none"; }}
                    />
                  </div>
                  {panoramas.filter(p => p.x_pos != null && p.y_pos != null).map((p) => {
                    const idx = panoramas.indexOf(p);
                    const isSel = selectedId === p.id;
                    return (
                      <button key={p.id}
                        style={{ position: "absolute", left: `${p.x_pos}%`, top: `${p.y_pos}%`, transform: "translate(-50%,-50%)" }}
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 border-white shadow-md transition-all
                          ${isSel ? "bg-[var(--verde-escuro)] text-white scale-125" : "bg-white text-[var(--verde-escuro)] hover:scale-110"}`}
                        onClick={(e) => { e.stopPropagation(); setSelectedId(p.id === selectedId ? null : p.id); }}
                        title={p.nome}
                      >{idx + 1}</button>
                    );
                  })}
                </div>
              </div>

              {/* Lista de panoramas */}
              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {panoramas.map((p, i) => (
                  <div key={p.id}
                    className={`p-2 rounded-lg border cursor-pointer transition-colors ${
                      selectedId === p.id ? "border-[var(--verde-escuro)] bg-[var(--creme-escuro)]" : "border-[var(--border)] hover:bg-[var(--creme-escuro)]"
                    }`}
                    onClick={() => setSelectedId(p.id === selectedId ? null : p.id)}
                  >
                    <div className="flex items-start gap-2">
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                        p.x_pos != null ? "bg-[var(--verde-escuro)] text-white" : "bg-gray-200 text-gray-500"}`}>
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{p.nome}</p>
                        <p className={`text-xs ${p.x_pos != null ? "text-green-600" : "text-[var(--muted-foreground)]"}`}>
                          {p.x_pos != null ? "✓ Posicionado" : "Sem posição"}
                        </p>
                      </div>
                    </div>
                    {p.x_pos != null && (
                      <button className="mt-1 text-xs text-red-500 hover:text-red-700"
                        onClick={(e) => { e.stopPropagation(); run(async () => { await updateArquivo(p.id, { x_pos: null, y_pos: null }, clienteId); if (selectedId === p.id) setSelectedId(null); }); }}>
                        Remover posição
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )}
      </div>
    );
  }

  // ── TAB: Panoramas 360° ──────────────────────────────────
  function TabPanoramas() {
    const planta = data.arquivos.find(a => a.categoria === "planta") ?? null;
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
            <Btn variant="ghost" onClick={configurarCors}>Configurar CORS do R2</Btn>
            {corsOk === true && <span className="text-xs text-green-600 font-medium">✓ CORS configurado!</span>}
            {corsOk === false && <span className="text-xs text-red-600">Erro ao configurar. Verifique as variáveis R2 no Vercel.</span>}
          </div>
        </Card>

        <FloorPlanSection planta={planta} panoramas={data.panoramas} />

        {data.panoramas.length > 0 && (
          <PanoramasGrid clienteId={clienteId} panoramas={data.panoramas} isPending={isPending} run={run} />
        )}
      </div>
    );
  }

  // ── TAB: Visual 3D (Canva) ───────────────────────────────
  function TabVisual3D() {
    const visuais = data.arquivos.filter(a => a.categoria === "visual_3d");
    const [nome, setNome] = useState("");
    const [url, setUrl] = useState("");
    const [editId, setEditId] = useState<string | null>(null);
    const [editNome, setEditNome] = useState("");
    const [editUrl, setEditUrl] = useState("");

    function add() {
      if (!nome || !url) return;
      run(async () => { await saveArquivo(clienteId, { nome, categoria: "visual_3d", url }); setNome(""); setUrl(""); });
    }
    function startEdit(v: Arquivo) { setEditId(v.id); setEditNome(v.nome); setEditUrl(v.url); }
    function cancelEdit() { setEditId(null); setEditNome(""); setEditUrl(""); }
    function saveEdit(id: string) {
      run(async () => { await updateArquivo(id, { nome: editNome, url: editUrl }, clienteId); cancelEdit(); });
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
              {visuais.map((v) => editId === v.id ? (
                <div key={v.id} className="py-2 border-b border-[var(--border)] last:border-0 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <Input label="Nome" value={editNome} onChange={(e) => setEditNome(e.target.value)} />
                    <Input label="URL Canva" value={editUrl} onChange={(e) => setEditUrl(e.target.value)} />
                  </div>
                  <div className="flex gap-2">
                    <Btn onClick={() => saveEdit(v.id)} disabled={isPending || !editNome || !editUrl}><Check size={12} /> Salvar</Btn>
                    <Btn variant="ghost" onClick={cancelEdit}>Cancelar</Btn>
                  </div>
                </div>
              ) : (
                <div key={v.id} className="flex items-center justify-between py-2 border-b border-[var(--border)] last:border-0">
                  <div>
                    <p className="text-sm font-medium">{v.nome}</p>
                    <p className="text-xs text-[var(--muted-foreground)] truncate max-w-xs">{v.url}</p>
                  </div>
                  <div className="flex gap-2">
                    <Btn variant="ghost" onClick={() => startEdit(v)}><Edit2 size={12} /></Btn>
                    <Btn variant="danger" disabled={isPending} onClick={() => run(() => deleteArquivo(v.id, "", clienteId))}><Trash2 size={12} /></Btn>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    );
  }

  // ── TAB: Planilhas & Cadernos ────────────────────────────
  function TabPlanilhas() {
    const planilhas = data.arquivos.filter(a => a.categoria === "planilha");
    const cadernos  = data.arquivos.filter(a => a.categoria === "caderno");
    const [pNome, setPNome] = useState("");
    const [pUrl,  setPUrl]  = useState("");
    const [cNome, setCNome] = useState("");
    const [cUrl,  setCUrl]  = useState("");
    const [editId, setEditId] = useState<string | null>(null);
    const [editNome, setEditNome] = useState("");
    const [editUrl, setEditUrl] = useState("");

    function addPlanilha() {
      if (!pNome || !pUrl) return;
      run(async () => { await saveArquivo(clienteId, { nome: pNome, categoria: "planilha", url: pUrl }); setPNome(""); setPUrl(""); });
    }
    function addCaderno() {
      if (!cNome || !cUrl) return;
      run(async () => { await saveArquivo(clienteId, { nome: cNome, categoria: "caderno", url: cUrl }); setCNome(""); setCUrl(""); });
    }
    function startEdit(item: Arquivo) { setEditId(item.id); setEditNome(item.nome); setEditUrl(item.url); }
    function cancelEdit() { setEditId(null); setEditNome(""); setEditUrl(""); }
    function saveEdit(id: string) {
      run(async () => { await updateArquivo(id, { nome: editNome, url: editUrl }, clienteId); cancelEdit(); });
    }

    function EditableRow({ item, urlLabel }: { item: Arquivo; urlLabel: string }) {
      if (editId === item.id) return (
        <div className="py-2 border-b border-[var(--border)] last:border-0 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <Input label="Nome" value={editNome} onChange={(e) => setEditNome(e.target.value)} />
            <Input label={urlLabel} value={editUrl} onChange={(e) => setEditUrl(e.target.value)} />
          </div>
          <div className="flex gap-2">
            <Btn onClick={() => saveEdit(item.id)} disabled={isPending || !editNome || !editUrl}><Check size={12} /> Salvar</Btn>
            <Btn variant="ghost" onClick={cancelEdit}>Cancelar</Btn>
          </div>
        </div>
      );
      return (
        <div className="flex items-center justify-between py-2 border-b border-[var(--border)] last:border-0">
          <div><p className="text-sm font-medium">{item.nome}</p><p className="text-xs text-[var(--muted-foreground)] truncate max-w-xs">{item.url}</p></div>
          <div className="flex gap-2">
            <Btn variant="ghost" onClick={() => startEdit(item)}><Edit2 size={12} /></Btn>
            <Btn variant="danger" disabled={isPending} onClick={() => run(() => deleteArquivo(item.id, "", clienteId))}><Trash2 size={12} /></Btn>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {/* Planilhas */}
        <Card>
          <SectionTitle><Table2 size={14} className="inline mr-1" />Adicionar planilha</SectionTitle>
          <p className="text-xs text-[var(--muted-foreground)] mb-3">Cole o link de publicação do Google Sheets (<em>Arquivo → Compartilhar → Publicar na web</em>).</p>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Título" value={pNome} onChange={(e) => setPNome(e.target.value)} placeholder="Ex: Especificações" />
            <Input label="URL da planilha" value={pUrl} onChange={(e) => setPUrl(e.target.value)} placeholder="https://docs.google.com/..." />
          </div>
          <div className="mt-3"><Btn onClick={addPlanilha} disabled={isPending || !pNome || !pUrl}><Plus size={13} /> Adicionar planilha</Btn></div>
        </Card>

        {planilhas.length > 0 && (
          <Card>
            <SectionTitle>Planilhas ({planilhas.length})</SectionTitle>
            <div className="space-y-0">
              {planilhas.map((p) => <EditableRow key={p.id} item={p} urlLabel="URL Sheets" />)}
            </div>
          </Card>
        )}

        {/* Cadernos */}
        <Card>
          <SectionTitle><BookOpen size={14} className="inline mr-1" />Adicionar caderno</SectionTitle>
          <p className="text-xs text-[var(--muted-foreground)] mb-3">Cole o link de apresentação do Canva do caderno de especificações.</p>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Título" value={cNome} onChange={(e) => setCNome(e.target.value)} placeholder="Ex: Caderno de Acabamentos" />
            <Input label="URL do Canva" value={cUrl} onChange={(e) => setCUrl(e.target.value)} placeholder="https://www.canva.com/..." />
          </div>
          <div className="mt-3"><Btn onClick={addCaderno} disabled={isPending || !cNome || !cUrl}><Plus size={13} /> Adicionar caderno</Btn></div>
        </Card>

        {cadernos.length > 0 && (
          <Card>
            <SectionTitle>Cadernos ({cadernos.length})</SectionTitle>
            <div className="space-y-0">
              {cadernos.map((c) => <EditableRow key={c.id} item={c} urlLabel="URL Canva" />)}
            </div>
          </Card>
        )}
      </div>
    );
  }

  // ── TAB: Documentos ───────────────────────────────────────
  function TabArquivos() {
    const docs = data.arquivos.filter(a => a.categoria !== "visual_3d");
    const [editId, setEditId] = useState<string | null>(null);
    const [editNome, setEditNome] = useState("");
    const [editDesc, setEditDesc] = useState("");

    function startEdit(a: Arquivo) { setEditId(a.id); setEditNome(a.nome); setEditDesc(a.descricao ?? ""); }
    function cancelEdit() { setEditId(null); setEditNome(""); setEditDesc(""); }
    function saveEdit(id: string) {
      run(async () => { await updateArquivo(id, { nome: editNome, descricao: editDesc }, clienteId); cancelEdit(); });
    }

    return (
      <div className="space-y-4">
        <Card>
          <SectionTitle>Enviar documento</SectionTitle>
          <ArquivoUpload clienteId={clienteId} subcategoriasExecutivo={data.profile.subcategorias_executivo ?? []} />
        </Card>

        {docs.length > 0 && (
          <Card>
            <SectionTitle>Documentos ({docs.length})</SectionTitle>
            <div className="space-y-0">
              {docs.map((a) => editId === a.id ? (
                <div key={a.id} className="py-2 border-b border-[var(--border)] last:border-0 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <Input label="Nome" value={editNome} onChange={(e) => setEditNome(e.target.value)} />
                    <Input label="Descrição" value={editDesc} onChange={(e) => setEditDesc(e.target.value)} />
                  </div>
                  <div className="flex gap-2">
                    <Btn onClick={() => saveEdit(a.id)} disabled={isPending || !editNome}><Check size={12} /> Salvar</Btn>
                    <Btn variant="ghost" onClick={cancelEdit}>Cancelar</Btn>
                  </div>
                </div>
              ) : (
                <div key={a.id} className="flex items-center justify-between py-2 border-b border-[var(--border)] last:border-0">
                  <div>
                    <p className="text-sm font-medium">{a.nome}</p>
                    <p className="text-xs text-[var(--muted-foreground)]">{a.categoria} · {new Date(a.created_at).toLocaleDateString("pt-BR")}</p>
                    {a.descricao && <p className="text-xs text-[var(--muted-foreground)] italic">{a.descricao}</p>}
                  </div>
                  <div className="flex gap-2">
                    <a href={a.url} target="_blank" rel="noreferrer" className="text-xs text-[var(--verde-escuro)] hover:underline">Abrir</a>
                    <Btn variant="ghost" onClick={() => startEdit(a)}><Edit2 size={12} /></Btn>
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
                  <div className="flex gap-1 flex-wrap items-center">
                    {["pendente", "aprovado", "revisao"].map(s => (
                      <button key={s} disabled={isPending || a.status === s}
                        onClick={() => run(() => updateAprovacao(a.id, s, clienteId))}
                        className={`text-xs px-2 py-1 rounded-md border transition-colors ${a.status === s ? "border-[var(--verde-escuro)] text-[var(--verde-escuro)] font-medium" : "border-[var(--border)] hover:bg-[var(--creme-escuro)]"} disabled:opacity-40`}>
                        {statusLabels[s]}
                      </button>
                    ))}
                    <button
                      disabled={isPending}
                      title={a.bloqueado ? "Liberar alteração pelo cliente" : "Bloquear alteração pelo cliente"}
                      onClick={() => run(() => adminToggleBloqueio(a.id, !a.bloqueado, clienteId))}
                      className={`p-1.5 rounded-md border transition-colors disabled:opacity-40 ${a.bloqueado ? "border-amber-400 text-amber-600 hover:bg-amber-50" : "border-[var(--border)] text-[var(--muted-foreground)] hover:bg-[var(--creme-escuro)]"}`}>
                      {a.bloqueado ? <Lock size={12} /> : <Unlock size={12} />}
                    </button>
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

  // ── Reuniões Agendadas List (with inline edit) ────────────
  function ReuniaoAgendadaList({ clienteId, reunioes, isPending, run }: { clienteId: string; reunioes: ReuniaoAgendada[]; isPending: boolean; run: (fn: () => Promise<unknown>) => void }) {
    const [editId, setEditId] = useState<string | null>(null);
    const [eData, setEData] = useState("");
    const [eHorario, setEHorario] = useState("");
    const [eModalidade, setEModalidade] = useState<"online" | "presencial">("online");
    const [eAssunto, setEAssunto] = useState("");
    const [eLink, setELink] = useState("");
    const [eLocal, setELocal] = useState("");

    function startEdit(r: ReuniaoAgendada) {
      setEditId(r.id); setEData(r.data_reuniao); setEHorario(r.horario.slice(0, 5));
      setEModalidade(r.modalidade as "online" | "presencial");
      setEAssunto(r.assunto ?? ""); setELink(r.link_reuniao ?? ""); setELocal(r.local_reuniao ?? "");
    }
    function cancelEdit() { setEditId(null); }
    function saveEdit(id: string) {
      run(async () => {
        await updateReuniaoAgendada(id, {
          data_reuniao: eData, horario: eHorario, modalidade: eModalidade, assunto: eAssunto,
          link_reuniao: eModalidade === "online" ? eLink : undefined,
          local_reuniao: eModalidade === "presencial" ? eLocal : undefined,
        }, clienteId);
        cancelEdit();
      });
    }

    return (
      <Card>
        <SectionTitle>Reuniões agendadas ({reunioes.length})</SectionTitle>
        <div className="space-y-1">
          {reunioes.map((r) => editId === r.id ? (
            <div key={r.id} className="py-3 border-b border-[var(--border)] last:border-0 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <Input label="Data" type="date" value={eData} onChange={(e) => setEData(e.target.value)} />
                <Input label="Horário" type="time" value={eHorario} onChange={(e) => setEHorario(e.target.value)} />
              </div>
              <Input label="Assunto" value={eAssunto} onChange={(e) => setEAssunto(e.target.value)} />
              <div>
                <label className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wide block mb-1.5">Modalidade</label>
                <div className="flex gap-2">
                  {(["online", "presencial"] as const).map((m) => (
                    <button key={m} type="button" onClick={() => setEModalidade(m)}
                      className={`flex-1 py-1.5 rounded-md border text-sm font-medium transition-colors capitalize ${eModalidade === m ? "border-[var(--verde-escuro)] bg-[var(--verde-escuro)] text-white" : "border-[var(--border)] hover:bg-[var(--creme-escuro)]"}`}>
                      {m === "online" ? "🎥 Online" : "📍 Presencial"}
                    </button>
                  ))}
                </div>
              </div>
              {eModalidade === "online"
                ? <Input label="Link" value={eLink} onChange={(e) => setELink(e.target.value)} placeholder="https://meet.google.com/..." />
                : <Input label="Local" value={eLocal} onChange={(e) => setELocal(e.target.value)} />
              }
              <div className="flex gap-2">
                <Btn onClick={() => saveEdit(r.id)} disabled={isPending || !eData || !eHorario}><Check size={12} /> Salvar</Btn>
                <Btn variant="ghost" onClick={cancelEdit}>Cancelar</Btn>
              </div>
            </div>
          ) : (
            <div key={r.id} className="flex items-start justify-between py-3 border-b border-[var(--border)] last:border-0">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium">{new Date(r.data_reuniao + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })} às {r.horario.slice(0, 5)}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${r.modalidade === "online" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"}`}>
                    {r.modalidade === "online" ? "🎥 Online" : "📍 Presencial"}
                  </span>
                </div>
                {r.assunto && <p className="text-xs text-[var(--muted-foreground)] mt-0.5">{r.assunto}</p>}
                {r.link_reuniao && <a href={r.link_reuniao} target="_blank" rel="noreferrer" className="text-xs text-[var(--verde-escuro)] hover:underline truncate block mt-0.5">{r.link_reuniao}</a>}
                {r.local_reuniao && <p className="text-xs text-[var(--muted-foreground)] mt-0.5">📍 {r.local_reuniao}</p>}
              </div>
              <div className="flex gap-1 shrink-0 ml-2">
                <Btn variant="ghost" onClick={() => startEdit(r)}><Edit2 size={12} /></Btn>
                <Btn variant="danger" disabled={isPending} onClick={() => run(() => deleteReuniaoAgendada(r.id, clienteId))}><Trash2 size={12} /></Btn>
              </div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  // ── TAB: Reuniões Agendadas ───────────────────────────────
  function TabReuniaoAgenda() {
    const [dataA, setDataA] = useState("");
    const [horario, setHorario] = useState("");
    const [modalidade, setModalidade] = useState<"online" | "presencial">("online");
    const [assuntoA, setAssuntoA] = useState("");
    const [link, setLink] = useState("");
    const [local, setLocal] = useState("");

    function salvarAgendamento() {
      if (!dataA || !horario) return;
      run(async () => {
        await saveReuniaoAgendada(clienteId, {
          data_reuniao: dataA, horario, modalidade, assunto: assuntoA,
          link_reuniao: modalidade === "online" ? link : undefined,
          local_reuniao: modalidade === "presencial" ? local : undefined,
        });
        setDataA(""); setHorario(""); setAssuntoA(""); setLink(""); setLocal("");
      });
    }

    return (
      <div className="space-y-4">
        <Card>
          <SectionTitle>Agendar reunião</SectionTitle>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Input label="Data" type="date" value={dataA} onChange={(e) => setDataA(e.target.value)} />
              <Input label="Horário" type="time" value={horario} onChange={(e) => setHorario(e.target.value)} />
            </div>
            <Input label="Assunto (opcional)" value={assuntoA} onChange={(e) => setAssuntoA(e.target.value)} placeholder="Ex: Revisão do projeto executivo" />
            <div>
              <label className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wide block mb-1.5">Modalidade</label>
              <div className="flex gap-3">
                {(["online", "presencial"] as const).map((m) => (
                  <button key={m} type="button" onClick={() => setModalidade(m)}
                    className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors capitalize ${modalidade === m ? "border-[var(--verde-escuro)] bg-[var(--verde-escuro)] text-white" : "border-[var(--border)] hover:bg-[var(--creme-escuro)]"}`}>
                    {m === "online" ? "🎥 Online" : "📍 Presencial"}
                  </button>
                ))}
              </div>
            </div>
            {modalidade === "online"
              ? <Input label="Link da reunião" value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://meet.google.com/..." />
              : <Input label="Local" value={local} onChange={(e) => setLocal(e.target.value)} placeholder="Ex: Escritório Estúdio Caeté" />
            }
          </div>
          <div className="mt-3">
            <Btn disabled={isPending || !dataA || !horario} onClick={salvarAgendamento}>
              <Plus size={13} /> Agendar
            </Btn>
          </div>
        </Card>

        {data.reunioesAgendadas.length > 0 && (
          <ReuniaoAgendadaList clienteId={clienteId} reunioes={data.reunioesAgendadas} isPending={isPending} run={run} />
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
    const [ataFile, setAtaFile] = useState<File | null>(null);
    const [ataUploading, setAtaUploading] = useState(false);
    const [ataProgress, setAtaProgress] = useState(0);
    const [ataErro, setAtaErro] = useState("");
    const ataInputRef = useRef<HTMLInputElement>(null);

    function resetForm() {
      setDataR(""); setAssunto(""); setAta(""); setAtaFile(null); setAtaProgress(0); setAtaErro(""); setEditId(null);
    }

    async function salvar() {
      if (!dataR || !assunto) return;
      let ataUrl: string | undefined;
      let ataNome: string | undefined;

      if (ataFile) {
        setAtaUploading(true);
        setAtaErro("");
        try {
          const chave = `reunioes/${clienteId}/${Date.now()}-${ataFile.name.replace(/\s/g, "_")}`;
          const res = await fetch("/api/admin/upload-url", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chave, tipoArquivo: ataFile.type }),
          });
          if (!res.ok) throw new Error("Falha ao obter URL de upload.");
          const { uploadUrl, publicUrl } = await res.json();
          await xhrUpload(uploadUrl, ataFile, setAtaProgress);
          ataUrl = publicUrl;
          ataNome = ataFile.name;
        } catch (e: unknown) {
          setAtaErro(e instanceof Error ? e.message : "Erro no upload.");
          setAtaUploading(false);
          return;
        }
        setAtaUploading(false);
      }

      run(async () => {
        if (editId) {
          await updateReuniao(editId, {
            data_reuniao: dataR, assunto, ata_texto: ata,
            ...(ataUrl && { ata_url: ataUrl, ata_nome: ataNome }),
          }, clienteId);
        } else {
          await saveReuniao(clienteId, { data_reuniao: dataR, assunto, ata_texto: ata, ata_url: ataUrl, ata_nome: ataNome });
        }
        resetForm();
      });
    }

    return (
      <div className="space-y-4">
        <Card>
          <SectionTitle>{editId ? "Editar reunião" : "Adicionar reunião"}</SectionTitle>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Input label="Data" type="date" value={dataR} onChange={(e) => setDataR(e.target.value)} />
              <Input label="Assunto" value={assunto} onChange={(e) => setAssunto(e.target.value)} />
            </div>
            <Textarea label="Ata / Notas (texto)" value={ata} onChange={(e) => setAta(e.target.value)} placeholder="Resumo da reunião..." />
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wide">Documento da Ata (opcional)</label>
              <div className="flex items-center gap-2 flex-wrap">
                <button type="button" onClick={() => ataInputRef.current?.click()} disabled={ataUploading}
                  className="flex items-center gap-2 px-3 py-2 text-sm border border-[var(--border)] rounded-md hover:bg-[var(--creme-escuro)] transition-colors disabled:opacity-50">
                  <FileText size={14} /> {ataFile ? ataFile.name : "Anexar PDF / documento"}
                </button>
                {ataFile && (
                  <button onClick={() => { setAtaFile(null); setAtaErro(""); }} className="text-[var(--muted-foreground)] hover:text-red-600">
                    <X size={14} />
                  </button>
                )}
              </div>
              <input ref={ataInputRef} type="file" className="hidden" accept=".pdf,.doc,.docx,image/*"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) { setAtaFile(f); setAtaErro(""); } }} />
              {ataErro && <p className="text-xs text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-md">{ataErro}</p>}
              {ataUploading && (
                <div className="space-y-1">
                  <div className="w-full bg-[var(--creme-escuro)] rounded-full h-1.5">
                    <div className="bg-[var(--verde-escuro)] h-1.5 rounded-full transition-all" style={{ width: `${ataProgress}%` }} />
                  </div>
                  <p className="text-xs text-[var(--muted-foreground)]">{ataProgress}% enviado</p>
                </div>
              )}
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            {editId && <Btn variant="ghost" onClick={resetForm}>Cancelar</Btn>}
            <Btn disabled={isPending || ataUploading || !dataR || !assunto} onClick={salvar}>
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
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{r.assunto}</p>
                      <p className="text-xs text-[var(--muted-foreground)]">{new Date(r.data_reuniao + "T12:00:00").toLocaleDateString("pt-BR")}</p>
                      {r.ata_texto && <p className="text-xs text-[var(--foreground)] mt-1 line-clamp-2">{r.ata_texto}</p>}
                      {r.ata_url && (
                        <a href={r.ata_url} target="_blank" rel="noreferrer"
                          className="text-xs text-[var(--verde-escuro)] hover:underline flex items-center gap-1 mt-1">
                          <FileText size={11} /> {r.ata_nome ?? "Ver documento"}
                        </a>
                      )}
                    </div>
                    <div className="flex gap-1 shrink-0 ml-3">
                      <Btn variant="ghost" onClick={() => {
                        setEditId(r.id); setDataR(r.data_reuniao); setAssunto(r.assunto); setAta(r.ata_texto ?? ""); setAtaFile(null);
                      }}>
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
    const [docUploading, setDocUploading] = useState(false);
    const [docProgress, setDocProgress] = useState(0);
    const [docErro, setDocErro] = useState("");
    const docRef = useRef<HTMLInputElement>(null);

    const docAtual = data.arquivos.find((a) => a.categoria === "cuidados");

    async function uploadDoc(file: File) {
      setDocUploading(true); setDocErro(""); setDocProgress(0);
      try {
        if (docAtual) await deleteArquivo(docAtual.id, docAtual.url, clienteId);
        const chave = `cuidados/${clienteId}/${Date.now()}-${file.name.replace(/\s/g, "_")}`;
        const res = await fetch("/api/admin/upload-url", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ chave, tipoArquivo: file.type }) });
        if (!res.ok) throw new Error("Falha ao obter URL de upload.");
        const { uploadUrl, publicUrl } = await res.json();
        await xhrUpload(uploadUrl, file, setDocProgress);
        await saveArquivo(clienteId, { nome: file.name, categoria: "cuidados", url: publicUrl, tipo_arquivo: file.type, tamanho_bytes: file.size });
      } catch (e: unknown) { setDocErro(e instanceof Error ? e.message : "Erro no upload."); }
      setDocUploading(false);
    }

    const isImagem = docAtual?.tipo_arquivo?.startsWith("image/");

    return (
      <div className="space-y-4">
        <Card>
          <SectionTitle>Documento de Cuidados com o Projeto</SectionTitle>
          <p className="text-xs text-[var(--muted-foreground)] mb-4">
            Envie o PDF ou imagem gerado com IA. Substituirá o arquivo anterior automaticamente.
          </p>
          {docAtual ? (
            <div className="space-y-3">
              {isImagem ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={docAtual.url} alt={docAtual.nome} className="w-full rounded-lg border border-[var(--border)] object-contain max-h-64" />
              ) : (
                <div className="flex items-center gap-2 p-3 bg-[var(--creme)] rounded-lg border border-[var(--border)]">
                  <FileText size={16} className="text-[var(--verde-escuro)] shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{docAtual.nome}</p>
                    <a href={docAtual.url} target="_blank" rel="noreferrer" className="text-xs text-[var(--verde-escuro)] hover:underline">Visualizar</a>
                  </div>
                </div>
              )}
              <div className="flex gap-2">
                <Btn variant="ghost" onClick={() => docRef.current?.click()} disabled={docUploading}>Substituir</Btn>
                <Btn variant="danger" disabled={isPending} onClick={() => run(() => deleteArquivo(docAtual.id, docAtual.url, clienteId))}><Trash2 size={12} /></Btn>
              </div>
            </div>
          ) : (
            <button onClick={() => docRef.current?.click()} disabled={docUploading}
              className="w-full flex flex-col items-center gap-2 p-8 border-2 border-dashed border-[var(--border)] rounded-lg hover:border-[var(--verde-escuro)] hover:bg-[var(--creme)] transition-colors disabled:opacity-50">
              <Upload size={24} className="text-[var(--muted-foreground)]" />
              <span className="text-sm text-[var(--muted-foreground)]">Clique para enviar (PDF ou imagem)</span>
            </button>
          )}
          <input ref={docRef} type="file" className="hidden" accept=".pdf,.doc,.docx,image/*"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadDoc(f); e.target.value = ""; }} />
          {docUploading && (
            <div className="space-y-1 mt-2">
              <div className="w-full bg-[var(--creme-escuro)] rounded-full h-1.5">
                <div className="bg-[var(--verde-escuro)] h-1.5 rounded-full transition-all" style={{ width: `${docProgress}%` }} />
              </div>
              <p className="text-xs text-[var(--muted-foreground)]">{docProgress}% enviado</p>
            </div>
          )}
          {docErro && <p className="text-xs text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-md mt-2">{docErro}</p>}
        </Card>
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
    midias3d: <><TabPanoramas /><div className="mt-6"><TabVisual3D /></div></>,
    planilhas: <TabPlanilhas />,
    executivo_subs: <TabExecutivoSubs />,
    arquivos: <TabArquivos />,
    cronograma: <TabCronograma />,
    progresso: <TabProgresso />,
    aprovacoes: <TabAprovacoes />,
    agenda_reunioes: <><TabReuniaoAgenda /><div className="mt-6"><TabReunioes /></div></>,
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
