import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getRedis } from "@/lib/redis";

describe("Redis stub (F006)", () => {
  beforeEach(() => {
    // Sin credenciales → in-memory stub. Sanidad.
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("set/get roundtrip", async () => {
    const r = getRedis();
    await r.set("k1", { hello: "world" });
    const v = await r.get<{ hello: string }>("k1");
    expect(v?.hello).toBe("world");
  });

  it("respeta TTL", async () => {
    vi.useFakeTimers();
    const r = getRedis();
    await r.set("k-ttl", "v", { ex: 1 });
    // Antes de que expire, aún existe.
    expect(await r.get("k-ttl")).toBe("v");
    // Avanzamos el tiempo simulado 2 s → debe estar expirado.
    vi.setSystemTime(Date.now() + 2000);
    expect(await r.get("k-ttl")).toBeNull();
  });

  it("del elimina", async () => {
    const r = getRedis();
    await r.set("k3", "v");
    await r.del("k3");
    expect(await r.get("k3")).toBeNull();
  });
});
