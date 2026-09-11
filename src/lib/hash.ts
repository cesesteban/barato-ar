/**
 * Hashing helpers para telemetría privacy-first (F006 SearchLog, F011 reports).
 * IPs se hashean con daily salt para agrupar sin identificar (Principio IV).
 */

import { createHash } from "node:crypto";

const DAY_MS = 24 * 3600 * 1000;

function dailySalt(): string {
  const day = Math.floor(Date.now() / DAY_MS);
  const secret = process.env.AUTH_SECRET ?? "fallback-salt";
  return `${day}:${secret}`;
}

export function ipHash(ip: string): string {
  return createHash("sha256").update(`${ip}:${dailySalt()}`).digest("base64url").slice(0, 32);
}

export function extractIp(request: Request): string {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]?.trim() ?? "unknown";
  const real = request.headers.get("x-real-ip");
  if (real) return real;
  return "unknown";
}
