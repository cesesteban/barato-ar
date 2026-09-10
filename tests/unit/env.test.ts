import { afterEach, beforeEach, describe, expect, it } from "vitest";

const REQUIRED = {
  NEXT_PUBLIC_APP_URL: "http://localhost:3000",
  DATABASE_URL: "postgresql://user:pass@host/db",
  DATABASE_URL_UNPOOLED: "postgresql://user:pass@host/db",
  AUTH_SECRET: "a".repeat(32),
  AUTH_URL: "http://localhost:3000",
  REVALIDATE_SECRET: "b".repeat(20),
} as const;

let originalEnv: NodeJS.ProcessEnv;

beforeEach(() => {
  originalEnv = { ...process.env };
});

afterEach(() => {
  process.env = originalEnv;
});

async function loadEnvFresh() {
  // vitest cachea imports; reset con dynamic import + querystring hack.
  const mod = await import(`@/lib/env?ts=${Date.now()}`);
  return mod as typeof import("@/lib/env");
}

describe("env.ts", () => {
  it("parsea vars requeridas", async () => {
    process.env = { ...originalEnv, ...REQUIRED } as NodeJS.ProcessEnv;
    const { env } = await loadEnvFresh();
    expect(env.NEXT_PUBLIC_APP_URL).toBe("http://localhost:3000");
    expect(env.REVALIDATE_SECRET).toHaveLength(20);
  });

  it("falla si falta AUTH_SECRET", async () => {
    const { AUTH_SECRET: _drop, ...rest } = REQUIRED;
    process.env = { ...originalEnv, ...rest } as NodeJS.ProcessEnv;
    await expect(loadEnvFresh()).rejects.toThrow(/Environment validation/);
  });

  it("falla si REVALIDATE_SECRET es muy corto", async () => {
    process.env = {
      ...originalEnv,
      ...REQUIRED,
      REVALIDATE_SECRET: "short",
    } as NodeJS.ProcessEnv;
    await expect(loadEnvFresh()).rejects.toThrow(/Environment validation/);
  });

  it("ADMIN_EMAILS se transforma a Set en lowercase", async () => {
    process.env = {
      ...originalEnv,
      ...REQUIRED,
      ADMIN_EMAILS: "Alice@Example.com, bob@example.com",
    } as NodeJS.ProcessEnv;
    const { env } = await loadEnvFresh();
    expect(env.ADMIN_EMAILS.has("alice@example.com")).toBe(true);
    expect(env.ADMIN_EMAILS.has("bob@example.com")).toBe(true);
  });
});
