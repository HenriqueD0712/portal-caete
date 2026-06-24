"use client";

import { useEffect, useRef, useState } from "react";
import { Glasses, Maximize2, Minimize2 } from "lucide-react";

interface Props {
  src: string;
  title: string;
}

type PannellumViewer = Pannellum.Viewer;

export function PanoramaViewer({ src, title }: Props) {
  const wrapperRef   = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const vrLeftRef    = useRef<HTMLDivElement>(null);
  const vrRightRef   = useRef<HTMLDivElement>(null);
  const viewerRef    = useRef<PannellumViewer | null>(null);
  const vrLeftViewer  = useRef<PannellumViewer | null>(null);
  const vrRightViewer = useRef<PannellumViewer | null>(null);

  // Touch VR: offset acumulado pelo arraste (somado ao giroscópio)
  const touchOffsetYaw   = useRef(0);
  const touchOffsetPitch = useRef(0);
  const lastTouch        = useRef<{ x: number; y: number } | null>(null);

  const [vrMode,       setVrMode]       = useState(false);
  const [loaded,       setLoaded]       = useState(false);
  const [pannellumReady, setPannellumReady] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Carrega Pannellum via CDN
  useEffect(() => {
    if (window.pannellum) { setPannellumReady(true); return; }
    if (document.getElementById("pannellum-css")) return;
    const link = document.createElement("link");
    link.id = "pannellum-css"; link.rel = "stylesheet";
    link.href = "https://cdn.jsdelivr.net/npm/pannellum@2.5.6/build/pannellum.css";
    document.head.appendChild(link);
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/pannellum@2.5.6/build/pannellum.js";
    script.onload = () => setPannellumReady(true);
    document.body.appendChild(script);
  }, []);

  // Rastreia se o wrapper está em fullscreen
  useEffect(() => {
    function onChange() { setIsFullscreen(!!document.fullscreenElement); }
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  // Visualizador normal
  useEffect(() => {
    if (!pannellumReady || !loaded || !containerRef.current || vrMode) return;
    viewerRef.current = window.pannellum.viewer(containerRef.current, {
      type: "equirectangular", panorama: src,
      autoLoad: true, showControls: false, compass: false, hfov: 100,
    });
    return () => { viewerRef.current?.destroy(); viewerRef.current = null; };
  }, [pannellumReady, loaded, src, vrMode]);

  // Visualizadores VR + giroscópio
  useEffect(() => {
    if (!vrMode || !pannellumReady) return;

    let rafId = 0;
    let innerCleanup: (() => void) | null = null;

    const t = setTimeout(() => {
      if (!vrLeftRef.current || !vrRightRef.current) return;

      const config: Pannellum.ConfigOptions = {
        type: "equirectangular", panorama: src,
        autoLoad: true, showControls: false, compass: false, hfov: 90,
      };
      vrLeftViewer.current  = window.pannellum.viewer(vrLeftRef.current,  { ...config });
      vrRightViewer.current = window.pannellum.viewer(vrRightRef.current, { ...config });

      // Zera offsets de toque ao entrar no VR
      touchOffsetYaw.current   = 0;
      touchOffsetPitch.current = 0;

      let targetYaw = 0, targetPitch = 0;
      let smoothYaw = 0, smoothPitch = 0;
      let initialized = false;

      function lerpAngle(from: number, to: number, t: number) {
        let diff = to - from;
        while (diff >  180) diff -= 360;
        while (diff < -180) diff += 360;
        return from + diff * t;
      }

      function onOrientation(e: DeviceOrientationEvent) {
        if (e.alpha === null || e.beta === null || e.gamma === null) return;
        const orient: number =
          screen.orientation?.angle ??
          (typeof window.orientation === "number" ? window.orientation : 0);

        let yaw: number, pitch: number;
        if (orient === 90 || orient === -270) {
          yaw   = ((e.alpha ?? 0) - 90 + 360) % 360;
          pitch = -(e.gamma ?? 0);
        } else if (orient === -90 || orient === 270) {
          yaw   = ((e.alpha ?? 0) + 90) % 360;
          pitch = (e.gamma ?? 0);
        } else {
          yaw   = e.alpha ?? 0;
          pitch = 90 - (e.beta ?? 90);
        }

        targetYaw   = yaw;
        targetPitch = Math.max(-75, Math.min(75, pitch));
        if (!initialized) { smoothYaw = targetYaw; smoothPitch = targetPitch; initialized = true; }
      }

      const SMOOTH = 0.25;
      function animate() {
        if (initialized) {
          smoothYaw   = lerpAngle(smoothYaw, targetYaw, SMOOTH);
          smoothPitch = smoothPitch + (targetPitch - smoothPitch) * SMOOTH;

          // Toque adiciona offset sobre o valor do giroscópio
          const finalYaw   = smoothYaw + touchOffsetYaw.current;
          const finalPitch = Math.max(-75, Math.min(75, smoothPitch + touchOffsetPitch.current));

          vrLeftViewer.current?.setYaw(finalYaw, false);
          vrLeftViewer.current?.setPitch(finalPitch, false);
          vrRightViewer.current?.setYaw(finalYaw, false);
          vrRightViewer.current?.setPitch(finalPitch, false);
        }
        rafId = requestAnimationFrame(animate);
      }

      window.addEventListener("deviceorientation", onOrientation);
      rafId = requestAnimationFrame(animate);
      innerCleanup = () => {
        window.removeEventListener("deviceorientation", onOrientation);
        cancelAnimationFrame(rafId);
      };
    }, 50);

    return () => {
      clearTimeout(t);
      innerCleanup?.();
      vrLeftViewer.current?.destroy();
      vrRightViewer.current?.destroy();
      vrLeftViewer.current = null;
      vrRightViewer.current = null;
    };
  }, [vrMode, pannellumReady, src]);

  // Escape sai do VR
  useEffect(() => {
    if (!vrMode) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") sairVR(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [vrMode]);

  // Handlers de toque do VR
  function onVRTouchStart(e: React.TouchEvent) {
    lastTouch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }
  function onVRTouchMove(e: React.TouchEvent) {
    if (!lastTouch.current) return;
    const dx = e.touches[0].clientX - lastTouch.current.x;
    const dy = e.touches[0].clientY - lastTouch.current.y;
    touchOffsetYaw.current   -= dx * 0.25;   // sensibilidade horizontal
    touchOffsetPitch.current += dy * 0.25;   // sensibilidade vertical
    touchOffsetPitch.current  = Math.max(-75, Math.min(75, touchOffsetPitch.current));
    lastTouch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }
  function onVRTouchEnd() { lastTouch.current = null; }

  async function ativarVR() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const DOE = DeviceOrientationEvent as any;
    if (typeof DOE.requestPermission === "function") {
      try { await DOE.requestPermission(); } catch { /* negado */ }
    }
    setVrMode(true);
    try { await document.documentElement.requestFullscreen(); } catch { /* ignorar */ }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    try { await (screen.orientation as any).lock("landscape"); } catch { /* iOS */ }
  }

  function sairVR() {
    setVrMode(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    try { (screen.orientation as any).unlock(); } catch { /* ignorar */ }
    try { if (document.fullscreenElement) document.exitFullscreen(); } catch { /* ignorar */ }
  }

  function entrarFullscreen() {
    wrapperRef.current?.requestFullscreen?.();
  }

  function sairFullscreen() {
    try { document.exitFullscreen(); } catch { /* ignorar */ }
  }

  // ── Modo VR ───────────────────────────────────────────────
  if (vrMode) {
    return (
      <div
        onTouchStart={onVRTouchStart}
        onTouchMove={onVRTouchMove}
        onTouchEnd={onVRTouchEnd}
        style={{ position: "fixed", inset: 0, zIndex: 9999, background: "#000", display: "flex" }}
      >
        <div ref={vrLeftRef}  style={{ width: "50%", height: "100%", overflow: "hidden" }} />
        <div style={{ width: 2, background: "rgba(255,255,255,0.35)", flexShrink: 0 }} />
        <div ref={vrRightRef} style={{ width: "50%", height: "100%", overflow: "hidden" }} />

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
          Arraste para girar · Mova a cabeça com o giroscópio
        </p>
      </div>
    );
  }

  // ── Tela de carregamento ──────────────────────────────────
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

  // ── Visualizador normal ───────────────────────────────────
  return (
    <div ref={wrapperRef} className="relative aspect-video rounded-lg overflow-hidden">
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

        {isFullscreen ? (
          <button
            onClick={sairFullscreen}
            title="Sair da tela cheia"
            className="bg-black/60 text-white p-1.5 rounded-full backdrop-blur-sm hover:bg-black/80 transition-colors"
          >
            <Minimize2 size={14} />
          </button>
        ) : (
          <button
            onClick={entrarFullscreen}
            title="Tela cheia"
            className="bg-black/60 text-white p-1.5 rounded-full backdrop-blur-sm hover:bg-black/80 transition-colors"
          >
            <Maximize2 size={14} />
          </button>
        )}
      </div>
    </div>
  );
}
