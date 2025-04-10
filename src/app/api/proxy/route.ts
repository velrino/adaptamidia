/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest } from "next/server";
import { Readable } from "node:stream";
import type { ReadableStream as NodeReadableStream } from "node:stream/web";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get("url");

  if (!url) return new Response("Missing URL", { status: 400 });

  try {
    const response = await fetch(url);

    if (!response.ok || !response.body) {
      return new Response("Failed to fetch", { status: response.status });
    }

    const contentType =
      response.headers.get("content-type") ?? "application/octet-stream";
    const stream = Readable.fromWeb(response.body as NodeReadableStream);

    return new Response(stream as any, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400", // Cache de 1 dia
      },
    });
  } catch (err) {
    console.error("Proxy error:", err);
    return new Response("Proxy error", { status: 500 });
  }
}
