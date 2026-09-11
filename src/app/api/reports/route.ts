import { NextResponse } from "next/server";
import { CreateReportSchema } from "@/server/reports/schemas";
import { createReport } from "@/server/reports/service";
import { extractIp, ipHash } from "@/lib/hash";
import { getRedis } from "@/lib/redis";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RATE_MAX = 5;
const RATE_WINDOW_S = 3600;

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = CreateReportSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input", details: parsed.error.flatten() }, { status: 422 });
  }
  const anonId = ipHash(extractIp(request));
  const redis = getRedis();
  const key = `reports:rate:${anonId}`;
  const count = ((await redis.get<number>(key)) ?? 0) as number;
  if (count >= RATE_MAX) {
    return NextResponse.json({ error: "rate_limited", retryAfter: RATE_WINDOW_S }, { status: 429 });
  }
  await redis.set(key, count + 1, { ex: RATE_WINDOW_S });

  const result = await createReport(parsed.data, anonId);
  if (!result.ok) {
    return NextResponse.json({ error: result.code }, { status: result.code === "chain_not_found" ? 404 : 422 });
  }
  return NextResponse.json(
    { ok: true, reportId: result.reportId, message: "Gracias — vamos a revisar tu reporte." },
    { status: 202 },
  );
}
