import { describe, expect, it } from "vitest";
import { extractIp, ipHash } from "@/lib/hash";

describe("ipHash (Principio IV — Privacidad)", () => {
  it("es determinístico dentro del mismo día", () => {
    const a = ipHash("1.2.3.4");
    const b = ipHash("1.2.3.4");
    expect(a).toBe(b);
    expect(a).toHaveLength(32);
  });
  it("distintas IPs → distintos hashes", () => {
    expect(ipHash("1.2.3.4")).not.toBe(ipHash("1.2.3.5"));
  });
  it("no revela la IP en el hash", () => {
    expect(ipHash("1.2.3.4")).not.toContain("1.2.3.4");
  });
});

describe("extractIp", () => {
  it("x-forwarded-for primero", () => {
    const req = new Request("http://a", { headers: { "x-forwarded-for": "10.0.0.1, 8.8.8.8" } });
    expect(extractIp(req)).toBe("10.0.0.1");
  });
  it("cae a x-real-ip", () => {
    const req = new Request("http://a", { headers: { "x-real-ip": "192.168.1.1" } });
    expect(extractIp(req)).toBe("192.168.1.1");
  });
  it("sin headers → 'unknown'", () => {
    const req = new Request("http://a");
    expect(extractIp(req)).toBe("unknown");
  });
});
