import { describe, expect, it, vi } from "vitest";

vi.mock("next/cache", () => ({ revalidateTag: vi.fn() }));

vi.mock("@/lib/env", () => ({
  env: {
    REVALIDATE_SECRET: "s".repeat(32),
    ADMIN_EMAILS: new Set<string>(),
  },
}));

async function importRoute() {
  const mod = await import("@/app/api/revalidate/route");
  return mod;
}

describe("/api/revalidate", () => {
  it("responde 403 si el header secret no coincide", async () => {
    const { POST } = await importRoute();
    const req = new Request("http://localhost/api/revalidate", {
      method: "POST",
      headers: { "x-revalidate-secret": "wrong", "content-type": "application/json" },
      body: JSON.stringify({ tags: ["offers-home"] }),
    });
    const res = await POST(req);
    expect(res.status).toBe(403);
  });

  it("responde 400 si el body no trae tags válidos", async () => {
    const { POST } = await importRoute();
    const req = new Request("http://localhost/api/revalidate", {
      method: "POST",
      headers: { "x-revalidate-secret": "s".repeat(32), "content-type": "application/json" },
      body: JSON.stringify({ tags: [123] }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("revalida los tags y responde 200", async () => {
    const { POST } = await importRoute();
    const { revalidateTag } = await import("next/cache");
    const req = new Request("http://localhost/api/revalidate", {
      method: "POST",
      headers: { "x-revalidate-secret": "s".repeat(32), "content-type": "application/json" },
      body: JSON.stringify({ tags: ["offers-home", "offers-palermo"] }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.revalidated).toEqual(["offers-home", "offers-palermo"]);
    expect(revalidateTag).toHaveBeenCalledWith("offers-home");
    expect(revalidateTag).toHaveBeenCalledWith("offers-palermo");
  });
});
