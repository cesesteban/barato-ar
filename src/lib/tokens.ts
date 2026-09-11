/**
 * Tokens firmados con HMAC-SHA256 para F009 (alertas email-only).
 * Formato: <alertId>.<purpose>.<expTs>.<sig>
 *   sig = base64url(HMAC-SHA256(secret, `${alertId}.${purpose}.${expTs}`))
 * Se guarda `sha256(token)` en la DB — el token crudo sólo viaja en URLs.
 */

import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { env } from "./env";

export type TokenPurpose = "verify" | "unsub" | "manage";

const VERIFY_TTL_MS = 24 * 3600 * 1000; // 24h
const MANAGE_TTL_MS = 14 * 24 * 3600 * 1000; // 14d

function purposeTtl(purpose: TokenPurpose): number | null {
  if (purpose === "verify") return VERIFY_TTL_MS;
  if (purpose === "manage") return MANAGE_TTL_MS;
  return null; // unsub no expira
}

function secret(): string {
  return env.AUTH_SECRET;
}

export function signToken(alertId: string, purpose: TokenPurpose, nowMs = Date.now()): string {
  const ttl = purposeTtl(purpose);
  const exp = ttl ? String(nowMs + ttl) : "0";
  const nonce = randomBytes(6).toString("base64url");
  const payload = `${alertId}.${purpose}.${exp}.${nonce}`;
  const sig = createHmac("sha256", secret()).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

export type VerifiedToken = {
  alertId: string;
  purpose: TokenPurpose;
};

/**
 * Verifica firma + expiración. Devuelve el `{alertId, purpose}` o null.
 */
export function verifyToken(token: string): VerifiedToken | null {
  const parts = token.split(".");
  if (parts.length !== 5) return null;
  const [alertId, purpose, exp, nonce, sig] = parts as [string, string, string, string, string];
  if (!isPurpose(purpose)) return null;

  const expected = createHmac("sha256", secret())
    .update(`${alertId}.${purpose}.${exp}.${nonce}`)
    .digest("base64url");
  if (!constantTimeEquals(expected, sig)) return null;

  if (exp !== "0") {
    const expNum = Number(exp);
    if (!Number.isFinite(expNum) || expNum < Date.now()) return null;
  }
  return { alertId, purpose };
}

/**
 * SHA-256 (hex) del token; se guarda en DB.
 */
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function isPurpose(p: string): p is TokenPurpose {
  return p === "verify" || p === "unsub" || p === "manage";
}

function constantTimeEquals(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(Buffer.from(a), Buffer.from(b));
  } catch {
    return false;
  }
}
