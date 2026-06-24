"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { PanoramaViewer } from "./panorama-viewer";

interface Pano {
  id: string;
  nome: string;
  descricao?: string | null;
  url: string;
  x_pos?: number | null;
  y_pos?: number | null;
}

interface Props {
  panoramas: Pano[];
  plantaUrl: string | null;
}

export function PanoramaFloorPlan({ panoramas, plantaUrl }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const positioned   = panoramas.filter(p => p.x_pos != null && p.y_pos != null);
  const unpositioned = panoramas.filter(p => p.x_pos == null || p.y_pos == null);
  const selected     = panoramas.find(p => p.id === selectedId) ?? null;

  // Sem planta: layout clássico em lista
  if (!plantaUrl) {
    return (
      <div className="space-y-6">
        <Header />
        {panoramas.length === 0 ? (
          <Empty />
        ) : (
          panoramas.map(p => (
            <div key={p.id} className="space-y-2">
              <p className="font-medium text-sm">{p.nome}</p>
              {p.descricao && <p className="text-xs text-[var(--muted-foreground)]">{p.descricao}</p>}
              <PanoramaViewer src={p.url} title={p.nome} />
            </div>
          ))
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Header />

      {/* Planta com marcadores
          -mx-4 sm:mx-0: full-bleed no mobile (cancela o p-4 do layout)
          overflow-visible: pins não são cortados nas bordas
      */}
      <div className="-mx-4 sm:mx-0 sm:rounded-xl sm:border sm:border-[var(--border)] sm:bg-[var(--creme-escuro)]">
        {/* Container de posicionamento — separado do border para overflow-visible funcionar */}
        <div className="relative pt-10 sm:pt-0">
          <img
            src={plantaUrl}
            alt="Planta do projeto"
            className="w-full h-auto block select-none sm:rounded-xl"
            draggable={false}
          />

          {positioned.map((p) => {
            const idx      = panoramas.indexOf(p);
            const isSel    = selectedId === p.id;
            return (
              <button
                key={p.id}
                style={{
                  position: "absolute",
                  left: `${p.x_pos}%`,
                  top:  `${p.y_pos}%`,
                  transform: "translate(-50%, -100%)",
                }}
                onClick={() => setSelectedId(isSel ? null : p.id)}
                title={p.nome}
                className="group focus:outline-none"
              >
                {/* Corpo do pin */}
                <div className={`flex flex-col items-center transition-all duration-200 ${isSel ? "scale-125" : "hover:scale-110"}`}>
                  {/* Círculo — menor no mobile */}
                  <div className={`
                    w-7 h-7 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold
                    border-2 border-white shadow-lg ring-2 transition-colors duration-200
                    ${isSel
                      ? "bg-[var(--verde-escuro)] text-white ring-[var(--verde-escuro)]"
                      : "bg-white text-[var(--verde-escuro)] ring-white/60 group-hover:bg-[var(--verde-escuro)] group-hover:text-white group-hover:ring-[var(--verde-escuro)]"
                    }`}>
                    {idx + 1}
                  </div>
                  {/* Haste */}
                  <div className={`w-0.5 h-2 sm:h-2.5 ${isSel ? "bg-[var(--verde-escuro)]" : "bg-white/80 group-hover:bg-[var(--verde-escuro)]"}`} />
                  {/* Ponto base */}
                  <div className={`w-1.5 h-1.5 rounded-full ${isSel ? "bg-[var(--verde-escuro)]" : "bg-white/80 group-hover:bg-[var(--verde-escuro)]"}`} />
                </div>

                {/* Tooltip com nome */}
                <div className="
                  absolute bottom-full mb-1 left-1/2 -translate-x-1/2
                  bg-black/80 text-white text-xs px-2 py-1 rounded whitespace-nowrap
                  opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10
                ">
                  {p.nome}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Hint quando nenhum panorama está selecionado */}
      {!selected && positioned.length > 0 && (
        <p className="text-center text-sm text-[var(--muted-foreground)]">
          Clique em um ponto da planta para explorar o ambiente
        </p>
      )}

      {/* Visualizador do panorama selecionado */}
      {selected && (
        <div className="rounded-xl border border-[var(--border)] bg-white p-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-semibold text-[var(--verde-escuro)]">{selected.nome}</p>
              {selected.descricao && (
                <p className="text-xs text-[var(--muted-foreground)] mt-0.5">{selected.descricao}</p>
              )}
            </div>
            <button
              onClick={() => setSelectedId(null)}
              className="text-[var(--muted-foreground)] hover:text-[var(--verde-escuro)] transition-colors shrink-0"
            >
              <X size={16} />
            </button>
          </div>
          <PanoramaViewer src={selected.url} title={selected.nome} />

          {/* Navegação entre panoramas posicionados */}
          {positioned.length > 1 && (
            <div className="flex gap-2 flex-wrap pt-1">
              {positioned.map((p) => {
                const idx = panoramas.indexOf(p);
                return (
                  <button
                    key={p.id}
                    onClick={() => setSelectedId(p.id)}
                    className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-colors ${
                      p.id === selectedId
                        ? "bg-[var(--verde-escuro)] text-white border-[var(--verde-escuro)]"
                        : "border-[var(--border)] hover:bg-[var(--creme-escuro)]"
                    }`}
                  >
                    <span className="font-bold">{idx + 1}</span> {p.nome}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Panoramas sem posição na planta */}
      {unpositioned.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-widest">
            Outros panoramas
          </h2>
          {unpositioned.map(p => (
            <div key={p.id} className="space-y-2">
              <p className="font-medium text-sm">{p.nome}</p>
              {p.descricao && <p className="text-xs text-[var(--muted-foreground)]">{p.descricao}</p>}
              <PanoramaViewer src={p.url} title={p.nome} />
            </div>
          ))}
        </div>
      )}

      {panoramas.length === 0 && <Empty />}
    </div>
  );
}

function Header() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-[var(--verde-escuro)]">Panoramas 360°</h1>
      <p className="text-sm text-[var(--muted-foreground)] mt-1">
        Explore os ambientes em 360°. No celular, ative o Modo VR para usar com óculos Google Cardboard.
      </p>
    </div>
  );
}

function Empty() {
  return (
    <div className="bg-white rounded-lg border border-[var(--border)] p-12 text-center">
      <p className="text-3xl mb-3">360°</p>
      <p className="text-sm text-[var(--muted-foreground)]">Nenhum panorama disponível ainda.</p>
    </div>
  );
}
