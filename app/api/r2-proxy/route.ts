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
  };
  return map[ext] ?? "image/jpeg";
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

  const r2Type = upstream.headers.get("content-type") ?? "";
  const contentType = (r2Type && r2Type !== "application/octet-stream")
    ? r2Type
    : mimeFromKey(key);

  // Lê todos os bytes explicitamente (evita problemas de pipe de stream binário)
  const data = await upstream.arrayBuffer();

  return new NextResponse(data, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Content-Length": data.byteLength.toString(),
      "Cache-Control": "private, max-age=3600",
    },
  });
}
