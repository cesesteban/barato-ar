/**
 * Fetch con backoff exponencial (C-011).
 * 1s → 4s → 15s. 4xx no reintenta. Falla final logueada como warning en Sentry.
 */

const DELAYS_MS = [1000, 4000, 15000] as const;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export type FetchWithRetryOptions = RequestInit & {
  /** Etiqueta para logs y Sentry (ej. "carrefour.flyer") */
  label?: string;
};

export async function fetchWithRetry(
  url: string,
  opts: FetchWithRetryOptions = {},
): Promise<Response> {
  const { label = "fetch", ...init } = opts;
  let lastError: unknown = null;

  for (let attempt = 0; attempt <= DELAYS_MS.length; attempt++) {
    try {
      const res = await fetch(url, init);
      // 4xx: error del cliente, no reintentar
      if (res.status >= 400 && res.status < 500) return res;
      if (res.ok) return res;
      // 5xx: throw para caer al catch y reintentar
      lastError = new Error(`HTTP ${res.status} en ${url}`);
    } catch (err) {
      lastError = err;
    }

    const nextDelay = DELAYS_MS[attempt];
    if (nextDelay === undefined) {
      // Se agotaron los reintentos. Log en Sentry si está disponible.
      const message = lastError instanceof Error ? lastError.message : String(lastError);
      logFinalFailure(label, url, attempt + 1, message);
      throw new Error(`[${label}] fetchWithRetry agotó reintentos en ${url}: ${message}`);
    }
    await sleep(nextDelay);
  }

  // TypeScript exhaustiveness — inalcanzable.
  throw new Error("unreachable");
}

async function logFinalFailure(label: string, url: string, attempts: number, message: string) {
  // Import perezoso vía dynamic import para no acoplar el módulo a Sentry
  // cuando no está inicializado (ej. tests, scripts standalone).
  try {
    const Sentry = await import("@sentry/nextjs");
    Sentry.captureMessage("scraper_fetch_final_failure", {
      level: "warning",
      tags: { label },
      extra: { url, attempts, message },
    });
  } catch {
    console.warn(`[http-retry] final failure: label=${label} url=${url} attempts=${attempts} msg=${message}`);
  }
}
