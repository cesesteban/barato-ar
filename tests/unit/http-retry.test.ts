import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fetchWithRetry } from "@/lib/http-retry";

const originalFetch = globalThis.fetch;

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  globalThis.fetch = originalFetch;
});

describe("fetchWithRetry", () => {
  it("devuelve la respuesta al primer intento si ok", async () => {
    const ok = new Response("ok", { status: 200 });
    globalThis.fetch = vi.fn().mockResolvedValueOnce(ok);
    const p = fetchWithRetry("https://example.com", { label: "test" });
    await vi.runAllTimersAsync();
    const res = await p;
    expect(res.status).toBe(200);
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
  });

  it("no reintenta ante 4xx", async () => {
    const bad = new Response("nope", { status: 404 });
    globalThis.fetch = vi.fn().mockResolvedValueOnce(bad);
    const p = fetchWithRetry("https://example.com", { label: "test" });
    await vi.runAllTimersAsync();
    const res = await p;
    expect(res.status).toBe(404);
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
  });

  it("reintenta ante 5xx y devuelve el 200 final", async () => {
    globalThis.fetch = vi
      .fn()
      .mockResolvedValueOnce(new Response("boom", { status: 502 }))
      .mockResolvedValueOnce(new Response("boom", { status: 503 }))
      .mockResolvedValueOnce(new Response("ok", { status: 200 }));
    const p = fetchWithRetry("https://example.com", { label: "test" });
    await vi.runAllTimersAsync();
    const res = await p;
    expect(res.status).toBe(200);
    expect(globalThis.fetch).toHaveBeenCalledTimes(3);
  });

  it("tras agotar reintentos, throw", async () => {
    globalThis.fetch = vi
      .fn()
      .mockResolvedValue(new Response("boom", { status: 500 }));
    const p = fetchWithRetry("https://example.com", { label: "test" });
    // Attach a noop rejection handler para que Vitest no reporte la rejection
    // como unhandled entre `runAllTimersAsync` y el assert final.
    p.catch(() => {});
    await vi.runAllTimersAsync();
    await expect(p).rejects.toThrow(/agotó reintentos/);
    expect(globalThis.fetch).toHaveBeenCalledTimes(4);
  });
});
