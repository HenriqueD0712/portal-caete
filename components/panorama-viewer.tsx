"use client";

import { useEffect, useRef, useState } from "react";
import { Glasses, Maximize2 } from "lucide-react";

interface Props {
  src: string;
  title: string;
}

export function PanoramaViewer({ src, title }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<{ destroy: () => void } | null>(null);
  const [vrMode, setVrMode] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [pannellumReady, setPannellumReady] = useState(false);

  useEffect(() => {
    if (document.getElementById("pannellum-css")) {
      setPannellumReady(true);
      return;
    }
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

  useEffect(() => {
    if (!pannellumReady || !loaded || !containerRef.current) return;

    viewerRef.current = window.pannellum.viewer(containerRef.current, {
      type: "equirectangular",
      panorama: src,
      autoLoad: true,
      showControls: false,
      compass: false,
      hfov: 100,
      pitch: 0,
      yaw: 0,
    });

    return () => { viewerRef.current?.destroy(); };
  }, [pannellumReady, loaded, src]);

  useEffect(() => {
    if (!vrMode) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") sairVR();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [vrMode]);

  function ativarVR() {
    setVrMode(true);
    const el = document.documentElement;
    if (el.requestFullscreen) el.requestFullscreen().catch(() => {});
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const DOE = DeviceOrientationEvent as any;
    if (typeof DOE.requestPermission === "function") {
      DOE.requestPermission();
    }
  }

  function sairVR() {
    setVrMode(false);
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
  }

  const embedUrl = `/panorama-embed.html?src=${encodeURIComponent(src)}`;

  if (vrMode) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex">
        <div className="w-1/2 h-full overflow-hidden">
          <iframe
            src={embedUrl}
            className="w-full h-full border-0"
            title={`${title} - VR esquerdo`}
            allow="gyroscope; accelerometer"
          />
        </div>
        <div className="w-px bg-white/30" />
        <div className="w-1/2 h-full overflow-hidden">
          <iframe
            src={embedUrl}
            className="w-full h-full border-0"
            title={`${title} - VR direito`}
            allow="gyroscope; accelerometer"
          />
        </div>
        <button
          onClick={sairVR}
          className="absolute top-4 right-4 bg-white/20 text-white text-xs px-4 py-2 rounded-full backdrop-blur-sm border border-white/30 hover:bg-white/30 transition-colors"
        >
          ✕ Sair do VR
        </button>
        <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/50 text-xs">
          Coloque o celular no óculos Google Cardboard
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
