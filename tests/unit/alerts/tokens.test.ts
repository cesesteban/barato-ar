import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { hashToken, signToken, verifyToken } from "@/lib/tokens";

describe("tokens (F009)", () => {
  const originalEnv = process.env.AUTH_SECRET;
  beforeEach(() => {
    process.env.AUTH_SECRET = "test-secret-32-bytes-1234567890";
  });
  afterEach(() => {
    process.env.AUTH_SECRET = originalEnv;
  });

  it("firma y verifica un token válido", () => {
    const token = signToken("alrt_123", "verify");
    const parsed = verifyToken(token);
    expect(parsed).toEqual({ alertId: "alrt_123", purpose: "verify" });
  });

  it("token tampered → null", () => {
    const token = signToken("alrt_123", "verify");
    const tampered = token.slice(0, -3) + "XXX";
    expect(verifyToken(tampered)).toBeNull();
  });

  it("verify token expira (24h)", () => {
    const past = Date.now() - 25 * 3600 * 1000;
    const token = signToken("alrt_123", "verify", past);
    expect(verifyToken(token)).toBeNull();
  });

  it("unsub token no expira", () => {
    const past = Date.now() - 365 * 24 * 3600 * 1000;
    const token = signToken("alrt_123", "unsub", past);
    expect(verifyToken(token)).toEqual({ alertId: "alrt_123", purpose: "unsub" });
  });

  it("hashToken es determinístico y no reversible", () => {
    const t = signToken("alrt_x", "verify");
    const h1 = hashToken(t);
    const h2 = hashToken(t);
    expect(h1).toBe(h2);
    expect(h1).toHaveLength(64);
    expect(h1).not.toContain("alrt_x");
  });

  it("payload malformado → null", () => {
    expect(verifyToken("garbage")).toBeNull();
    expect(verifyToken("a.b.c.d")).toBeNull();
  });
});
