import { NextResponse } from "next/server";
import { OffersParamsSchema } from "@/server/offers/schemas";
import { runOffers } from "@/server/offers/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = OffersParamsSchema.safeParse({
    zone: url.searchParams.get("zone") ?? undefined,
    vertical: url.searchParams.get("vertical") ?? undefined,
    chains: url.searchParams.get("chains") ?? undefined,
    minDiscount: url.searchParams.get("minDiscount") ?? undefined,
    maxDistanceKm: url.searchParams.get("maxDistanceKm") ?? undefined,
    validity: url.searchParams.get("validity") ?? undefined,
    sort: url.searchParams.get("sort") ?? undefined,
    cursor: url.searchParams.get("cursor") ?? undefined,
    limit: url.searchParams.get("limit") ?? undefined,
    includeNearby: url.searchParams.get("includeNearby") ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_params", details: parsed.error.flatten() }, { status: 400 });
  }
  const response = await runOffers(parsed.data);
  return NextResponse.json(response);
}
