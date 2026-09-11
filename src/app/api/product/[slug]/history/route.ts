import { NextResponse } from "next/server";
import { HistoryParamsSchema } from "@/server/history/schemas";
import { getHistory } from "@/server/history/get-history";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const url = new URL(request.url);
  const parsed = HistoryParamsSchema.safeParse({
    slug,
    zone: url.searchParams.get("zone") ?? undefined,
    days: url.searchParams.get("days") ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_params" }, { status: 400 });
  }
  const response = await getHistory(parsed.data);
  if (!response) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json(response);
}
