"use client";

import { useEffect, useRef, useState } from "react";
import { Glasses, Maximize2 } from "lucide-react";

interface Props {
  src: string;
  title: string;
}

type PannellumViewer = Pannellum.Viewer;

export function PanoramaViewer({ src, title }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const vrLeftRef = useRef<HTMLDivElement>(null);
  const vrRightRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<PannellumViewer | null>(null);
  const vrLeftViewer = useRef<PannellumViewer | null>(null);
  const vrRightViewer = useRef<PannellumViewer | null>(null);

  const [vrMode, setVrMode] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [pannellumReady, setPannellumReady] = useState(false);

  // Carrega Pannellum via CDN
  useEffect(() => {
    if (window.pannellum) { setPannellumReady(true); return; }
    if (document.getElementById("pannellum-css")) return;

    const link = document.createElement("link");
    link.id = "pannellum-css";
    link.rel = "stylesheet";
    link.href = "https://cdn.jsdelivr.net/npm/pannellum@2.5.6/build/pannellum.css";
    document.head.appendChild(link);

    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/pannellum@2.5.6/build/pannellum.js";
    script.onload = () => setPannellumReady(true);
    document.body.appendChild(script);
  }, []);

  // Visualizador normal
  useEffect(() => {
    if (!pannellumReady || !loaded || !containerRef.current || vrMode) return;
    viewerRef.current = window.pannellum.viewer(containerRef.current, {
      type: "equirectangular",
      panorama: src,
      autoLoad: true,
      showControls: false,
      compass: false,
      hfov: 100,
    });
    return () => { viewerRef.current?.destroy(); viewerRef.current = null; };
  }, [pannellumReady, loaded, src, vrMode]);

  // Visualizadores VR + giroscópio
  useEffect(() => {
    if (!vrMode || !pannellumReady) return;

    // Aguarda o React renderizar as divs do VR antes de inicializar
    const init = () => {
      if (!vrLeftRef.current || !vrRightRef.current) return;

      const config: Pannellum.ConfigOptions = {
        type: "equirectangular",
        panorama: src,
        autoLoad: true,
        showControls: false,
        compass: false,
        hfov: 90,
      };

      vrLeftViewer.current = window.pannellum.viewer(vrLeftRef.current, { ...config });
      vrRightViewer.current = window.pannellum.viewer(vrRightRef.current, { ...config });

      // Giroscópio: sincroniza os dois viewers com o movimento do celular
      function onOrientation(e: DeviceOrientationEvent) {
        if (e.alpha === null || e.beta === null) return;
        const yaw = e.alpha;
        // beta: 90° = celular em pé (portrait). Inclinar para trás = olhar para cima
        const pitch = 90 - (e.beta ?? 90);
        vrLeftViewer.current?.setYaw(yaw, false);
        vrLeftViewer.current?.setPitch(pitch, false);
        vrRightViewer.current?.setYaw(yaw, false);
        vrRightViewer.current?.setPitch(pitch, false);
      }

      window.addEventListener("deviceorientation", onOrientation);
      return () => window.removeEventListener("deviceorientation", onOrientation);
    };

    // Pequeno delay para garantir que as refs estejam montadas
    const t = setTimeout(init, 50);
    return () => {
      clearTimeout(t);
      vrLeftViewer.current?.destroy();
      vrRightViewer.current?.destroy();
      vrLeftViewer.current = null;
      vrRightViewer.current = null;
    };
  }, [vrMode, pannellumReady, src]);

  // Tecla Escape sai do VR
  useEffect(() => {
    if (!vrMode) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") sairVR(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [vrMode]);

  async function ativarVR() {
    // Solicita permissão do giroscópio no iOS
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const DOE = DeviceOrientationEvent as any;
    if (typeof DOE.requestPermission === "function") {
      try { await DOE.requestPermission(); } catch { /* usuário negou */ }
    }
    setVrMode(true);
    try { await document.documentElement.requestFullscreen(); } catch { /* ignorar */ }
    // Força landscape após entrar em fullscreen (não funciona no iOS, mas está correto no Android)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    try { await (screen.orientation as any).lock("landscape"); } catch { /* iOS não suporta */ }
  }

  function sairVR() {
    setVrMode(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    try { (screen.orientation as any).unlock(); } catch { /* ignorar */ }
    try { if (document.fullscreenElement) document.exitFullscreen(); } catch { /* ignorar */ }
  }

  if (vrMode) {
    return (
      <div
        style={{
          position: "fixed", inset: 0, zIndex: 9999,
          background: "#000", display: "flex",
        }}
      >
        {/* Olho esquerdo */}
        <div ref={vrLeftRef} style={{ width: "50%", height: "100%", overflow: "hidden" }} />

        {/* Divisor central */}
        <div style={{ width: 2, background: "rgba(255,255,255,0.35)", flexShrink: 0 }} />

        {/* Olho direito */}
        <div ref={vrRightRef} style={{ width: "50%", height: "100%", overflow: "hidden" }} />

        {/* Botão sair — renderizado fora dos viewers, sem iframe, recebe cliques normalmente */}
        <button
          onClick={sairVR}
          style={{
            position: "absolute", top: 16, right: 16, zIndex: 10000,
            background: "rgba(0,0,0,0.75)", color: "#fff",
            border: "1px solid rgba(255,255,255,0.4)", borderRadius: 9999,
            padding: "8px 18px", fontSize: 13, cursor: "pointer",
            backdropFilter: "blur(8px)",
          }}
        >
          ✕ Sair do VR
        </button>

        <p style={{
          position: "absolute", bottom: 12, left: "50%",
          transform: "translateX(-50%)", color: "rgba(255,255,255,0.35)",
          fontSize: 11, whiteSpace: "nowrap", pointerEvents: "none",
        }}>
          Gire o celular para explorar o ambiente
        </p>
      </div>
    );
  }

  if (!loaded) {
    return (
      <div
        className="aspect-video bg-[var(--verde-escuro)] flex flex-col items-center justify-center gap-3 cursor-pointer group rounded-lg overflow-hidden"
        onClick={() => setLoaded(true)}
      >
        <div className="w-16 h-16 rounded-full border-2 border-white/40 flex items-center justify-center group-hover:border-white transition-colors">
          <span className="text-white text-2xl">360°</span>
        </div>
        <p className="text-white/70 text-sm">Clique para abrir o panorama</p>
        <p className="text-white/40 text-xs">{title}</p>
      </div>
    );
  }

  return (
    <div className="relative aspect-video rounded-lg overflow-hidden">
      <div ref={containerRef} className="w-full h-full" />
      <div className="absolute bottom-3 right-3 flex gap-2">
        <button
          onClick={ativarVR}
          title="Modo VR (Google Cardboard)"
          className="flex items-center gap-1.5 bg-black/60 text-white text-xs px-3 py-1.5 rounded-full backdrop-blur-sm hover:bg-black/80 transition-colors"
        >
          <Glasses size={14} />
          Modo VR
        </button>
        <button
          onClick={() => containerRef.current?.requestFullscreen?.()}
          title="Tela cheia"
          className="bg-black/60 text-white p-1.5 rounded-full backdrop-blur-sm hover:bg-black/80 transition-colors"
        >
          <Maximize2 size={14} />
        </button>
      </div>
    </div>
  );
}
