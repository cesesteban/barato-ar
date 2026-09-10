/**
 * Pass 1: sucursales.csv → upsert Zone (jerarquía) + Store (con lat/lng).
 * Filtra por CABA+GBA (isInGBA); resto se ignora en MVP.
 */

import { createReadStream } from "node:fs";
import { parse } from "csv-parse";
import { prisma } from "@/lib/db";
import { SepaSucursalSchema, type SepaSucursal } from "./schemas";
import { mapSepaChain } from "./chains";
import { resolveZoneId, seedZones } from "./zones";
import { isInGBA } from "./geo";
import { slugify } from "../core/normalize";

export type Pass1Result = {
  storesUpserted: number;
  rowsSkipped: number;
};

export async function ingestSucursales(path: string): Promise<Pass1Result> {
  await seedZones(); // idempotente

  const parser = createReadStream(path).pipe(
    parse({
      columns: (headers) => headers.map((h: string) => h.trim().toLowerCase()),
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true,
    }),
  );

  let storesUpserted = 0;
  let rowsSkipped = 0;

  for await (const rawRow of parser) {
    const parsed = SepaSucursalSchema.safeParse(rawRow);
    if (!parsed.success) {
      rowsSkipped++;
      continue;
    }
    const row = parsed.data;
    const chainId = mapSepaChain(row.id_comercio);
    if (!chainId) {
      rowsSkipped++;
      continue;
    }
    if (!isInGBA(row.sucursales_latitud, row.sucursales_longitud)) {
      rowsSkipped++;
      continue;
    }
    const zoneId = resolveZoneId({
      provincia: row.provincia,
      ciudad: row.ciudad ?? null,
      localidad: row.localidad ?? null,
    });

    await upsertStore(row, chainId, zoneId);
    storesUpserted++;
  }
  return { storesUpserted, rowsSkipped };
}

async function upsertStore(row: SepaSucursal, chainId: string, zoneId: string | null) {
  const slug = slugify(
    `${chainId} ${row.id_bandera} ${row.id_sucursal} ${row.ciudad ?? ""} ${row.localidad ?? ""}`,
  );
  const displayName = row.sucursales_nombre
    ? row.sucursales_nombre
    : `${chainId} · ${row.ciudad ?? row.localidad ?? row.id_sucursal}`;
  const address = [row.sucursales_calle, row.sucursales_numero, row.ciudad ?? row.localidad]
    .filter(Boolean)
    .join(" ");

  await prisma.store.upsert({
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
  });
}
