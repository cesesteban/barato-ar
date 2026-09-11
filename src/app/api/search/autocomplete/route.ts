import { NextResponse } from "next/server";
import { runAutocomplete } from "@/server/search/service";
import { AutocompleteParamsSchema } from "@/server/search/schemas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = AutocompleteParamsSchema.safeParse({ q: url.searchParams.get("q") ?? "" });
  if (!parsed.success) {
    return NextResponse.json({ products: [], brands: [], categories: [] });
  }
  const response = await runAutocomplete(parsed.data.q);
  return NextResponse.json(response);
}
