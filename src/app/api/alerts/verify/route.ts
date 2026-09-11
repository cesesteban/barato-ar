import { NextResponse } from "next/server";
import { verifyToken, hashToken } from "@/lib/tokens";
import { verifyAlert } from "@/server/alerts/service";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  if (!token) return NextResponse.redirect(new URL("/alerts/expired", env.NEXT_PUBLIC_APP_URL));

  const parsed = verifyToken(token);
  if (!parsed || parsed.purpose !== "verify") {
    return NextResponse.redirect(new URL("/alerts/expired", env.NEXT_PUBLIC_APP_URL));
  }
  // Chequeo adicional: el hash del token viaje debe coincidir con el guardado.
  const alert = await prisma.alert.findUnique({ where: { id: parsed.alertId } });
  if (!alert || alert.verifyTokenHash !== hashToken(token)) {
    return NextResponse.redirect(new URL("/alerts/expired", env.NEXT_PUBLIC_APP_URL));
  }

  const result = await verifyAlert(parsed.alertId);
  if (!result.ok) return NextResponse.redirect(new URL("/alerts/expired", env.NEXT_PUBLIC_APP_URL));
  return NextResponse.redirect(new URL("/alerts/verified", env.NEXT_PUBLIC_APP_URL));
}
