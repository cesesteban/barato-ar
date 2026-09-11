import { NextResponse } from "next/server";
import { CreateAlertSchema } from "@/server/alerts/schemas";
import { createAlert } from "@/server/alerts/service";
import { extractIp, ipHash } from "@/lib/hash";
import { getRedis } from "@/lib/redis";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RATE_MAX = 5;
const RATE_WINDOW_S = 3600;

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = CreateAlertSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input", details: parsed.error.flatten() }, { status: 422 });
  }
  const ip = extractIp(request);
  const anonId = ipHash(ip);

  // Rate-limit por IP: 5 nuevas / hora
  const redis = getRedis();
  const key = `alerts:rate:${anonId}`;
  const count = ((await redis.get<number>(key)) ?? 0) as number;
  if (count >= RATE_MAX) {
    return NextResponse.json({ error: "rate_limited", retryAfter: RATE_WINDOW_S }, { status: 429 });
  }
  await redis.set(key, count + 1, { ex: RATE_WINDOW_S });

  const result = await createAlert(parsed.data, anonId);
  if (!result.ok) {
    const status = result.code === "quota_exceeded" ? 429 : 404;
    return NextResponse.json({ error: result.code }, { status });
  }
  return NextResponse.json({
    ok: true,
    alertId: result.alertId,
    message: result.alreadyExists
      ? "Ya tenías una alerta similar. Te reenviamos el link de confirmación."
      : "Revisá tu casilla para confirmar la alerta.",
  }, { status: 202 });
}
