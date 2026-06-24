import { NextRequest, NextResponse } from "next/server";
import { getDownloadUrl } from "@/src/lib/r2";
import { createClient } from "@/src/lib/supabase/server";

function mimeFromKey(key: string): string {
  const ext = key.split(".").pop()?.toLowerCase() ?? "";
  const map: Record<string, string> = {
    webp: "image/webp",
    png:  "image/png",
    jpg:  "image/jpeg",
    jpeg: "image/jpeg",
    gif:  "image/gif",
    avif: "image/avif",
    heic: "image/heic",
  };
  return map[ext] ?? "application/octet-stream";
}

export function keyFromUrl(storedUrl: string): string {
  try {
    return new URL(storedUrl).pathname.slice(1);
  } catch {
    return storedUrl;
  }
}

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const storedUrl = req.nextUrl.searchParams.get("url");
  if (!storedUrl) return new NextResponse("Missing url", { status: 400 });

  const key = keyFromUrl(storedUrl);

  const signedUrl = await getDownloadUrl(key);
  const upstream = await fetch(signedUrl);

  if (!upstream.ok) {
    return new NextResponse(`R2 error: ${upstream.status}`, { status: upstream.status });
  }

  // Usa Content-Type do R2; se genérico, infere pela extensão do arquivo
  const r2Type = upstream.headers.get("content-type") ?? "";
  const contentType = (r2Type && r2Type !== "application/octet-stream")
    ? r2Type
    : mimeFromKey(key);

  return new NextResponse(upstream.body, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
