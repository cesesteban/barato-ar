/**
 * Upstash Redis client singleton (F006+).
 * En dev sin credenciales, devuelve un stub in-memory que satisface la API
 * mínima que usamos (get/set/del con TTL) — así el resto del código no
 * necesita branching.
 */

import { Redis } from "@upstash/redis";

type MinimalRedis = {
  get<T = unknown>(key: string): Promise<T | null>;
  set(key: string, value: unknown, opts?: { ex?: number }): Promise<unknown>;
  del(key: string): Promise<number>;
};

let cached: MinimalRedis | null = null;

export function getRedis(): MinimalRedis {
  if (cached) return cached;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (url && token) {
    cached = new Redis({ url, token }) as unknown as MinimalRedis;
    return cached;
  }
  cached = makeMemoryStub();
  return cached;
}

function makeMemoryStub(): MinimalRedis {
  type Entry = { value: unknown; expiresAt: number | null };
  const store = new Map<string, Entry>();
  return {
    async get<T>(key: string): Promise<T | null> {
      const entry = store.get(key);
      if (!entry) return null;
      if (entry.expiresAt && entry.expiresAt < Date.now()) {
        store.delete(key);
        return null;
      }
      return entry.value as T;
    },
    async set(key: string, value: unknown, opts?: { ex?: number }) {
      const expiresAt = opts?.ex ? Date.now() + opts.ex * 1000 : null;
      store.set(key, { value, expiresAt });
      return "OK";
    },
    async del(key: string) {
      return store.delete(key) ? 1 : 0;
    },
  };
}
