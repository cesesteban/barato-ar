/**
 * Descarga y extracción del snapshot diario de SEPA.
 *
 * SEPA publica un ZIP por día de la semana (`sepa_lunes.zip` .. `sepa_domingo.zip`).
 * Cada ZIP contiene una carpeta `YYYY-MM-DD/` con N zips anidados —
 * uno por (id_comercio, id_bandera). Cada zip anidado contiene 3 CSVs:
 * `comercio.csv`, `sucursales.csv`, `productos.csv`.
 *
 * URLs de descarga estables (por día de semana):
 *   https://datos.produccion.gob.ar/dataset/6f47ec76-.../resource/{ID}/download/sepa_{dia}.zip
 *
 * Se puede overridear vía env `SEPA_DAILY_URL` para tests o failover.
 */

import { createWriteStream, mkdirSync, rmSync } from "node:fs";
import { open } from "node:fs/promises";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";
import { join } from "node:path";
import { tmpdir } from "node:os";
import yauzl from "yauzl";
import { politeFetch } from "../core/http";

const SEPA_DAILY_URLS: Record<string, string> = {
  lunes:
    "https://datos.produccion.gob.ar/dataset/6f47ec76-d1ce-4e34-a7e1-621fe9b1d0b5/resource/0a9069a9-06e8-4f98-874d-da5578693290/download/sepa_lunes.zip",
  martes:
    "https://datos.produccion.gob.ar/dataset/6f47ec76-d1ce-4e34-a7e1-621fe9b1d0b5/resource/9dc06241-cc83-44f4-8e25-c9b1636b8bc8/download/sepa_martes.zip",
  miercoles:
    "https://datos.produccion.gob.ar/dataset/6f47ec76-d1ce-4e34-a7e1-621fe9b1d0b5/resource/1e92cd42-4f94-4071-a165-62c4cb2ce23c/download/sepa_miercoles.zip",
  jueves:
    "https://datos.produccion.gob.ar/dataset/6f47ec76-d1ce-4e34-a7e1-621fe9b1d0b5/resource/d076720f-a7f0-4af8-b1d6-1b99d5a90c14/download/sepa_jueves.zip",
  viernes:
    "https://datos.produccion.gob.ar/dataset/6f47ec76-d1ce-4e34-a7e1-621fe9b1d0b5/resource/91bc072a-4726-44a1-85ec-4a8467aad27e/download/sepa_viernes.zip",
  sabado:
    "https://datos.produccion.gob.ar/dataset/6f47ec76-d1ce-4e34-a7e1-621fe9b1d0b5/resource/b3c3da5d-213d-41e7-8d74-f23fda0a3c30/download/sepa_sabado.zip",
  domingo:
    "https://datos.produccion.gob.ar/dataset/6f47ec76-d1ce-4e34-a7e1-621fe9b1d0b5/resource/f8e75128-515a-436e-bf8d-5c63a62f2005/download/sepa_domingo.zip",
};

const WEEKDAY_SLUGS = ["domingo", "lunes", "martes", "miercoles", "jueves", "viernes", "sabado"];

export type ExtractedCommerce = {
  dir: string;                // path del directorio con los 3 CSVs
  fileName: string;           // nombre del zip anidado (para tracing)
  sourceDate: Date;           // fecha del snapshot (parseada de la carpeta)
};

export type ExtractedSnapshot = {
  rootDir: string;            // dir raíz que hay que borrar al final
  sourceUrl: string;          // URL original del snapshot
  commerces: ExtractedCommerce[];
};

function resolveDailyUrl(): { url: string; slug: string } {
  const override = process.env["SEPA_DAILY_URL"];
  if (override) return { url: override, slug: "custom" };
  const now = new Date(Date.now());
  // ART = UTC-3; usamos slugs sin tildes.
  const argTime = new Date(now.getTime() - 3 * 60 * 60 * 1000);
  const slug = WEEKDAY_SLUGS[argTime.getUTCDay()] ?? "sabado";
  const url = SEPA_DAILY_URLS[slug];
  if (!url) throw new Error(`SEPA daily URL no encontrada para día "${slug}"`);
  return { url, slug };
}

async function downloadZip(url: string, label: string): Promise<string> {
  const dir = join(tmpdir(), `sepa-${Date.now()}`);
  mkdirSync(dir, { recursive: true });
  const zipPath = join(dir, `${label}.zip`);
  const res = await politeFetch(url, { label });
  if (!res.ok) throw new Error(`SEPA ${label} HTTP ${res.status}`);
  if (!res.body) throw new Error(`SEPA ${label} sin body`);
  await pipeline(Readable.fromWeb(res.body as never), createWriteStream(zipPath));
  return zipPath;
}

async function extractZip(zipPath: string, outDir: string): Promise<string[]> {
  mkdirSync(outDir, { recursive: true });
  const written: string[] = [];
  await new Promise<void>((resolve, reject) => {
    yauzl.open(zipPath, { lazyEntries: true }, (openErr, zip) => {
      if (openErr || !zip) return reject(openErr ?? new Error("yauzl abrió undefined"));
      zip.readEntry();
      zip.on("entry", (entry) => {
        if (/\/$/.test(entry.fileName)) {
          zip.readEntry();
          return;
        }
        const fileName = entry.fileName.replace(/^.*[\/\\]/, "");
        const out = join(outDir, fileName);
        zip.openReadStream(entry, async (streamErr, readStream) => {
          if (streamErr || !readStream) return reject(streamErr ?? new Error("openReadStream vacío"));
          try {
            await pipeline(readStream, createWriteStream(out));
            written.push(out);
            zip.readEntry();
          } catch (err) {
            reject(err);
          }
        });
      });
      zip.on("end", () => resolve());
      zip.on("error", reject);
    });
  });
  return written;
}

/**
 * Descarga el snapshot diario, extrae la carpeta y luego cada zip por comercio.
 * Deja los CSVs listos para leer en disco. Devolvé `rootDir` para limpiar al final.
 */
export async function downloadAndExtractSnapshot(): Promise<ExtractedSnapshot> {
  const { url, slug } = resolveDailyUrl();
  const rootDir = join(tmpdir(), `sepa-snap-${Date.now()}`);
  mkdirSync(rootDir, { recursive: true });

  const outerZip = await downloadZip(url, `sepa-${slug}`);
  const outerExtractedFiles = await extractZip(outerZip, rootDir);

  // La estructura del outer zip pone todos los inner zips bajo una carpeta
  // YYYY-MM-DD/. yauzl los aplana con nuestro replace — están todos en rootDir.
  const innerZips = outerExtractedFiles.filter((f) => f.endsWith(".zip"));
  if (innerZips.length === 0) {
    throw new Error(`SEPA outer zip no contiene zips por comercio (encontré ${outerExtractedFiles.length} archivos)`);
  }

  const sourceDate = parseDateFromFilename(innerZips[0] ?? "") ?? new Date();

  const commerces: ExtractedCommerce[] = [];
  for (const innerZip of innerZips) {
    const commerceName = innerZip.replace(/\.zip$/, "").replace(/^.*[\/\\]/, "");
    const commerceDir = join(rootDir, commerceName);
    try {
      await extractZip(innerZip, commerceDir);
      commerces.push({ dir: commerceDir, fileName: commerceName, sourceDate });
    } catch (err) {
      // Un zip corrupto/vacío no debe cortar el resto (ej. sepa-36 suele venir vacío).
      console.warn(`[sepa] skip inner zip: ${commerceName} — ${err instanceof Error ? err.message : err}`);
    }
  }

  return { rootDir, sourceUrl: url, commerces };
}

export function cleanupSnapshot(snap: ExtractedSnapshot): void {
  try {
    rmSync(snap.rootDir, { recursive: true, force: true });
  } catch {
    // best effort
  }
}

/**
 * Lee el header BOM-safe de un CSV SEPA.
 * SEPA CSVs vienen con BOM UTF-8 y delimitador `|`.
 */
export async function readCsvHeaderRaw(path: string): Promise<string> {
  const fd = await open(path, "r");
  try {
    const buf = Buffer.alloc(4096);
    await fd.read(buf, 0, buf.length, 0);
    const text = buf.toString("utf-8");
    const line = text.split(/\r?\n/)[0] ?? "";
    return line.replace(/^﻿/, "");
  } finally {
    await fd.close();
  }
}

function parseDateFromFilename(name: string): Date | null {
  const m = /\b(\d{4}-\d{2}-\d{2})_/.exec(name);
  if (!m || !m[1]) return null;
  const d = new Date(`${m[1]}T00:00:00-03:00`);
  return Number.isFinite(d.getTime()) ? d : null;
}
