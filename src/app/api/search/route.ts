import { NextResponse } from "next/server";
import { runSearch } from "@/server/search/service";
import { SearchParamsSchema } from "@/server/search/schemas";
import { extractIp, ipHash } from "@/lib/hash";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = SearchParamsSchema.safeParse({
    q: url.searchParams.get("q") ?? "",
    zone: url.searchParams.get("zone") ?? undefined,
    vertical: url.searchParams.get("vertical") ?? undefined,
    limit: url.searchParams.get("limit") ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_params", details: parsed.error.flatten() }, { status: 400 });
  }
  const anonId = ipHash(extractIp(request));
  const response = await runSearch(parsed.data, anonId);
  return NextResponse.json(response);
}
