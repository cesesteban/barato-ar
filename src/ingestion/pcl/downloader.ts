/**
 * Descarga streaming de CSVs SEPA a /tmp para procesar con csv-parse.
 * Con `Retry-After` honoring y politeFetch (rate-limit + robots).
 */

import { createWriteStream } from "node:fs";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { politeFetch } from "../core/http";

export async function downloadToTemp(url: string, label: string): Promise<string> {
  const res = await politeFetch(url, { label });
  if (!res.ok) throw new Error(`${label} HTTP ${res.status}`);
  if (!res.body) throw new Error(`${label} sin body`);
  const filename = `sepa-${label.replace(/[^a-z0-9]/gi, "-")}-${Date.now()}.csv`;
  const path = join(tmpdir(), filename);
  await pipeline(Readable.fromWeb(res.body as never), createWriteStream(path));
  return path;
}
