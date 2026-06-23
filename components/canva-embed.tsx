"use client";

import { useState } from "react";
import { Play } from "lucide-react";

interface Props {
  src: string;
  title: string;
}

function toEmbedUrl(url: string): string {
  if (!url.includes("canva.com")) return url;
  let base = url.split("?")[0].replace(/\/$/, "");
  if (base.endsWith("/edit")) base = base.slice(0, -5) + "/view";
  if (!base.endsWith("/view")) base = base + "/view";
  return base + "?embed";
}

export function CanvaEmbed({ src, title }: Props) {
  const [loaded, setLoaded] = useState(false);
  const embedUrl = toEmbedUrl(src);

  if (!loaded) {
    return (
      <div
        className="aspect-video bg-[var(--creme)] flex flex-col items-center justify-center gap-3 cursor-pointer group"
        onClick={() => setLoaded(true)}
      >
        <div className="w-12 h-12 rounded-full bg-[var(--verde-escuro)] flex items-center justify-center group-hover:bg-[var(--verde-medio)] transition-colors">
          <Play size={20} className="text-white ml-0.5" />
        </div>
        <p className="text-sm text-[var(--muted-foreground)]">Clique para carregar a apresentação</p>
      </div>
    );
  }

  return (
    <div className="aspect-video">
      <iframe
        src={embedUrl}
        title={title}
        allowFullScreen
        allow="fullscreen"
        className="w-full h-full border-0"
        loading="lazy"
      />
    </div>
  );
}
