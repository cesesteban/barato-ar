import { NextResponse } from "next/server";
import { runPopular } from "@/server/search/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const zone = url.searchParams.get("zone") ?? "caba-palermo";
  const response = await runPopular(zone);
  return NextResponse.json(response);
}
