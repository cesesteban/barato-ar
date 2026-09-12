/**
 * Pass 1 (por comercio): sucursales.csv → upsert Store con zona resuelta.
 * Filtra por CABA + GBA con isInGBA; el resto se descarta en MVP.
 * Devuelve un cache de storeId por (id_comercio, id_bandera, id_sucursal).
 */

import { createReadStream } from "node:fs";
import { parse } from "csv-parse";
import { prisma } from "@/lib/db";
import { SepaSucursalSchema, type SepaSucursal } from "./schemas";
import { mapSepaChain } from "./chains";
import { resolveZoneId, seedZones } from "./zones";
import { isInGBA } from "./geo";
import { slugify } from "../core/normalize";

export type StoreLookup = {
  storeId: string;
  chainId: string;
  zoneId: string | null;
};

export type StoreCache = Map<string, StoreLookup>;

export type Pass1Result = {
  storesUpserted: number;
  rowsSkipped: number;
  storeCache: StoreCache;
};

const CSV_OPTS = {
  columns: (headers: string[]) => headers.map((h) => h.replace(/^﻿/, "").trim().toLowerCase()),
  delimiter: "|",
  skip_empty_lines: true,
  trim: true,
  relax_column_count: true,
  relax_quotes: true,
  quote: false as const,
  bom: true,
} as const;

export async function ingestSucursales(path: string): Promise<Pass1Result> {
  await seedZones();

  const parser = createReadStream(path).pipe(parse(CSV_OPTS));
  const result: Pass1Result = { storesUpserted: 0, rowsSkipped: 0, storeCache: new Map() };

  for await (const rawRow of parser) {
    const parsed = SepaSucursalSchema.safeParse(rawRow);
    if (!parsed.success) {
      result.rowsSkipped++;
      continue;
    }
    const row = parsed.data;
    const chainId = mapSepaChain(row.id_comercio, row.id_bandera);
    if (!chainId) {
      result.rowsSkipped++;
      continue;
    }
    if (!isInGBA(row.sucursales_latitud, row.sucursales_longitud)) {
      result.rowsSkipped++;
      continue;
    }
    const zoneId = resolveZoneId({
      provincia: row.sucursales_provincia ?? "",
      ciudad: row.sucursales_barrio ?? null,
      localidad: row.sucursales_localidad ?? null,
    });
    const storeId = await upsertStore(row, chainId, zoneId);
    result.storeCache.set(cacheKey(row.id_comercio, row.id_bandera, row.id_sucursal), {
      storeId,
      chainId,
      zoneId,
    });
    result.storesUpserted++;
  }
  return result;
}

function cacheKey(idComercio: number, idBandera: number, idSucursal: string): string {
  return `${idComercio}:${idBandera}:${idSucursal}`;
}

export function makeCacheKey(idComercio: number, idBandera: number, idSucursal: string): string {
  return cacheKey(idComercio, idBandera, idSucursal);
}

async function upsertStore(row: SepaSucursal, chainId: string, zoneId: string | null): Promise<string> {
  const locality = row.sucursales_localidad ?? row.sucursales_barrio ?? row.id_sucursal;
  const slug = slugify(`${chainId} ${row.id_bandera} ${row.id_sucursal} ${locality}`);
  const displayName = row.sucursales_nombre ? row.sucursales_nombre : `${chainId} · ${locality}`;
  const address = [row.sucursales_calle, row.sucursales_numero, row.sucursales_localidad]
    .filter(Boolean)
    .join(" ");

  try {
    const store = await prisma.store.upsert({
      where: { slug },
      update: {
        chainId,
        name: displayName,
        address: address || null,
        zoneId,
        lat: row.sucursales_latitud ?? null,
        lng: row.sucursales_longitud ?? null,
        isVirtual: false,
      },
      create: {
        chainId,
        slug,
        name: displayName,
        address: address || null,
        zoneId,
        lat: row.sucursales_latitud ?? null,
        lng: row.sucursales_longitud ?? null,
        isVirtual: false,
      },
      select: { id: true },
    });
    return store.id;
  } catch (err) {
    if (zoneId != null && isForeignKeyError(err)) {
      // Zone no seedeada aún — reintentamos sin zone (mejor tener el store sin zona que perder la sucursal)
      const store = await prisma.store.upsert({
        where: { slug },
        update: {
          chainId,
          name: displayName,
          address: address || null,
          zoneId: null,
          lat: row.sucursales_latitud ?? null,
          lng: row.sucursales_longitud ?? null,
          isVirtual: false,
        },
        create: {
          chainId,
          slug,
          name: displayName,
          address: address || null,
          zoneId: null,
          lat: row.sucursales_latitud ?? null,
          lng: row.sucursales_longitud ?? null,
          isVirtual: false,
        },
        select: { id: true },
      });
      return store.id;
    }
    throw err;
  }
}

function isForeignKeyError(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code: string }).code === "P2003"
  );
}
