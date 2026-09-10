/**
 * On-demand revalidation endpoint (C-008).
 * Se llama desde el runner de ingesta al terminar una corrida exitosa.
 * Header: x-revalidate-secret
 * Body: { tags: string[] }
 */

import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { env } from "@/lib/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const secret = request.headers.get("x-revalidate-secret");
  if (secret !== env.REVALIDATE_SECRET) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const tags = extractTags(body);
  if (!tags) {
    return NextResponse.json({ error: "missing_tags" }, { status: 400 });
  }

  for (const tag of tags) {
    revalidateTag(tag);
  }

  return NextResponse.json({ revalidated: tags });
}

function extractTags(body: unknown): string[] | null {
  if (typeof body !== "object" || body === null) return null;
  const tags = (body as { tags?: unknown }).tags;
  if (!Array.isArray(tags)) return null;
  if (!tags.every((t): t is string => typeof t === "string" && t.length > 0)) return null;
  return tags;
}
