/**
 * HTTP client para scrapers: undici + rate-limit por dominio + robots.txt (F003).
 * Los reintentos con backoff exponencial vienen de src/lib/http-retry.ts (C-011).
 */

import { request, Agent, setGlobalDispatcher } from "undici";
import robotsParser, { type Robot } from "robots-parser";
import { fetchWithRetry } from "@/lib/http-retry";

const USER_AGENT = "BaratoBot/0.1 (+https://barato.ar/bot)";
const MIN_DELAY_MS = 1000; // 1 req/s por dominio

setGlobalDispatcher(new Agent({ connections: 2, pipelining: 1 }));

const lastRequestByHost = new Map<string, number>();
const robotsByHost = new Map<string, Promise<Robot | null>>();

async function throttleForHost(host: string) {
  const last = lastRequestByHost.get(host) ?? 0;
  const wait = last + MIN_DELAY_MS - Date.now();
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  lastRequestByHost.set(host, Date.now());
}

async function loadRobots(host: string): Promise<Robot | null> {
  const cached = robotsByHost.get(host);
  if (cached) return cached;
  const p = (async () => {
    try {
      const url = `https://${host}/robots.txt`;
      const res = await request(url, { headers: { "user-agent": USER_AGENT } });
      if (res.statusCode !== 200) return null;
      const txt = await res.body.text();
      return robotsParser(url, txt);
    } catch {
      return null;
    }
  })();
  robotsByHost.set(host, p);
  return p;
}

export type PoliteFetchOptions = {
  label?: string;
  headers?: Record<string, string>;
};

/**
 * Fetch respetuoso: robots.txt + rate-limit + retries.
 */
export async function politeFetch(url: string, opts: PoliteFetchOptions = {}): Promise<Response> {
  const parsed = new URL(url);
  const host = parsed.host;

  const robots = await loadRobots(host);
  if (robots && !robots.isAllowed(url, USER_AGENT)) {
    throw new Error(`robots.txt disallows ${url}`);
  }

  await throttleForHost(host);

  return fetchWithRetry(url, {
    label: opts.label ?? `polite:${host}`,
    headers: { "user-agent": USER_AGENT, ...opts.headers },
  });
}
