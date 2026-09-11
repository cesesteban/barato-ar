import { NextResponse } from "next/server";
import { verifyToken, hashToken } from "@/lib/tokens";
import { unsubscribeAlert } from "@/server/alerts/service";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  if (!token) return NextResponse.redirect(new URL("/alerts/expired", env.NEXT_PUBLIC_APP_URL));

  const parsed = verifyToken(token);
  if (!parsed || parsed.purpose !== "unsub") {
    return NextResponse.redirect(new URL("/alerts/expired", env.NEXT_PUBLIC_APP_URL));
  }
  const alert = await prisma.alert.findUnique({ where: { id: parsed.alertId } });
  if (!alert || alert.unsubTokenHash !== hashToken(token)) {
    return NextResponse.redirect(new URL("/alerts/expired", env.NEXT_PUBLIC_APP_URL));
  }
  await unsubscribeAlert(parsed.alertId);
  return NextResponse.redirect(new URL("/alerts/cancelled", env.NEXT_PUBLIC_APP_URL));
}
