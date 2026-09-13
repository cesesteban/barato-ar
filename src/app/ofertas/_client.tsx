"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Checkbox, Chip, Label } from "@/components/ui";
import { NeighborsToggle } from "@/components/domain";
import { DealCard } from "@/components/domain";
import { productHref } from "@/lib/urls";
import type { OffersParams, OfferListing } from "@/server/offers/schemas";

type Facets = {
  chains: Array<{ slug: string; name: string; count: number }>;
  verticals: Array<{ slug: string; count: number }>;
};

const VERTICALS: Array<{ slug: OffersParams["vertical"]; label: string }> = [
  { slug: "supermarket", label: "Supermercado" },
  { slug: "delivery", label: "Delivery" },
  { slug: "pharmacy", label: "Farmacia" },
  { slug: "beverages", label: "Bebidas" },
];

const SORTS: Array<{ slug: OffersParams["sort"]; label: string }> = [
  { slug: "discount", label: "Mayor descuento" },
  { slug: "new", label: "Más nuevas" },
  { slug: "popular", label: "Populares" },
  { slug: "price_unit", label: "Menor $/unidad" },
];

export function FiltersSidebar({ facets }: { facets: Facets }) {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  function setParam(name: string, value: string | null) {
    const next = new URLSearchParams(params.toString());
    if (value === null || value === "") next.delete(name);
    else next.set(name, value);
    next.delete("cursor");
    router.push(`${pathname}?${next.toString()}`);
  }

  const currentVertical = params.get("vertical") ?? "";
  const currentChains = (params.get("chains") ?? "").split(",").filter(Boolean);
  const currentSort = params.get("sort") ?? "discount";
  const minDiscount = Number(params.get("minDiscount") ?? "0");
  const includeNearby = params.get("includeNearby") !== "false";
  const maxDistanceKm = Number(params.get("maxDistanceKm") ?? "10");

  function toggleChain(slug: string) {
    const next = new Set(currentChains);
    if (next.has(slug)) next.delete(slug);
    else next.add(slug);
    setParam("chains", next.size > 0 ? [...next].join(",") : null);
  }

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-4">
      <section className="flex flex-col gap-2">
        <h3 className="text-2xs font-semibold uppercase tracking-wider text-text-subtle">Ordenar</h3>
        <div className="flex flex-wrap gap-1.5">
          {SORTS.map((s) => (
            <Chip
              key={s.slug}
              variant={currentSort === s.slug ? "selected" : "neutral"}
              onClick={() => setParam("sort", s.slug === "discount" ? null : s.slug!)}
            >
              {s.label}
            </Chip>
          ))}
        </div>
      </section>

      <hr className="border-border" />

      <section className="flex flex-col gap-2">
        <h3 className="text-2xs font-semibold uppercase tracking-wider text-text-subtle">Vertical</h3>
        <div className="flex flex-wrap gap-1.5">
          <Chip
            variant={currentVertical === "" ? "selected" : "neutral"}
            onClick={() => setParam("vertical", null)}
          >
            Todo
          </Chip>
          {VERTICALS.map((v) => (
            <Chip
              key={v.slug!}
              variant={currentVertical === v.slug ? "selected" : "neutral"}
              onClick={() => setParam("vertical", v.slug!)}
            >
              {v.label}
            </Chip>
          ))}
        </div>
      </section>

      <hr className="border-border" />

      <section className="flex flex-col gap-2">
        <h3 className="text-2xs font-semibold uppercase tracking-wider text-text-subtle">Cadenas</h3>
        <div className="flex max-h-56 flex-col gap-2 overflow-y-auto">
          {facets.chains.length === 0 ? (
            <span className="text-2xs text-text-subtle">Sin datos aún</span>
          ) : (
            facets.chains.map((c) => (
              <label key={c.slug} className="flex cursor-pointer items-center gap-2 text-sm">
                <Checkbox
                  checked={currentChains.includes(c.slug)}
                  onCheckedChange={() => toggleChain(c.slug)}
                />
                <span className="flex-1">{c.name}</span>
                <span className="text-2xs text-text-subtle">{c.count}</span>
              </label>
            ))
          )}
        </div>
      </section>

      <hr className="border-border" />

      <section className="flex flex-col gap-2">
        <h3 className="text-2xs font-semibold uppercase tracking-wider text-text-subtle">
          Descuento mínimo
        </h3>
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={0}
            max={50}
            step={5}
            value={minDiscount}
            onChange={(e) => setParam("minDiscount", e.target.value === "0" ? null : e.target.value)}
            className="flex-1 accent-primary"
            aria-label="Descuento mínimo"
          />
          <span className="w-10 text-right text-sm font-semibold">{minDiscount}%</span>
        </div>
      </section>

      <hr className="border-border" />

      <NeighborsToggle
        checked={includeNearby}
        onCheckedChange={(v) => setParam("includeNearby", v ? null : "false")}
        radiusKm={maxDistanceKm}
      />
    </div>
  );
}

export function ActiveChips() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const chips: Array<{ key: string; label: string }> = [];
  const vertical = params.get("vertical");
  const chains = (params.get("chains") ?? "").split(",").filter(Boolean);
  const sort = params.get("sort");
  const minDiscount = params.get("minDiscount");
  const includeNearby = params.get("includeNearby");
  const validity = params.get("validity");

  if (vertical) chips.push({ key: `vertical:${vertical}`, label: `Vertical: ${vertical}` });
  for (const c of chains) chips.push({ key: `chain:${c}`, label: c });
  if (sort && sort !== "discount") chips.push({ key: "sort", label: `Orden: ${sort}` });
  if (minDiscount && minDiscount !== "0") chips.push({ key: "minDiscount", label: `≥ ${minDiscount}% off` });
  if (includeNearby === "false") chips.push({ key: "includeNearby", label: "Solo mi zona" });
  if (validity && validity !== "week") chips.push({ key: "validity", label: `Válidas: ${validity}` });

  function removeChip(key: string) {
    const next = new URLSearchParams(params.toString());
    if (key.startsWith("chain:")) {
      const slug = key.slice("chain:".length);
      const remaining = chains.filter((c) => c !== slug);
      if (remaining.length === 0) next.delete("chains");
      else next.set("chains", remaining.join(","));
    } else if (key.startsWith("vertical:")) {
      next.delete("vertical");
    } else {
      next.delete(key);
    }
    next.delete("cursor");
    router.push(`${pathname}?${next.toString()}`);
  }

  if (chips.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-2 pt-2">
      <span className="text-2xs font-semibold uppercase tracking-wider text-text-subtle">Filtros activos:</span>
      {chips.map((c) => (
        <Chip key={c.key} variant="primary" onRemove={() => removeChip(c.key)}>
          {c.label}
        </Chip>
      ))}
      <button
        type="button"
        onClick={() => router.push(pathname)}
        className="text-2xs font-semibold text-text-muted hover:text-primary"
      >
        Limpiar todos
      </button>
    </div>
  );
}

export function InfiniteLoader({
  initialItems,
  initialCursor,
  params,
}: {
  initialItems: OfferListing[];
  initialCursor: string | null;
  params: OffersParams;
}) {
  const [items, setItems] = useState<OfferListing[]>(initialItems);
  const [cursor, setCursor] = useState<string | null>(initialCursor);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(!initialCursor);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Reset cuando cambian los filtros iniciales
    setItems(initialItems);
    setCursor(initialCursor);
    setDone(!initialCursor);
  }, [initialItems, initialCursor]);

  useEffect(() => {
    if (done || !cursor) return;
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      async (entries) => {
        const first = entries[0];
        if (!first?.isIntersecting || loading) return;
        setLoading(true);
        try {
          const url = new URL("/api/offers", window.location.origin);
          for (const [k, v] of Object.entries(paramsToObject(params))) {
            if (v != null && v !== "") url.searchParams.set(k, String(v));
          }
          url.searchParams.set("cursor", cursor);
          const res = await fetch(url.toString());
          if (!res.ok) {
            setDone(true);
            return;
          }
          const data = (await res.json()) as { items: OfferListing[]; nextCursor: string | null };
          setItems((prev) => [...prev, ...data.items]);
          setCursor(data.nextCursor);
          if (!data.nextCursor) setDone(true);
        } finally {
          setLoading(false);
        }
      },
      { rootMargin: "400px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [cursor, done, loading, params]);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {items.map((it) => (
          <DealCard
            key={it.id}
            product={{
              slug: it.productSlug,
              name: it.productName,
              brand: it.productBrand ?? undefined,
              imageUrl: it.productImageUrl ?? undefined,
            }}
            price={it.price}
            previousPrice={it.previousPrice ?? undefined}
            discountPct={it.discountPct ?? undefined}
            chainSlug={it.chainSlug}
            chainLabel={it.chainName}
            pricePerUnit={
              it.pricePerUnit && it.standardUnit
                ? { value: it.pricePerUnit, unit: it.standardUnit }
                : undefined
            }
            promo={
              it.promoType !== "unit"
                ? {
                    type: it.promoType,
                    buyQty: it.promoBuyQty ?? undefined,
                    payQty: it.promoPayQty ?? undefined,
                    secondDiscountPct: it.promoSecondDiscountPct ?? undefined,
                  }
                : undefined
            }
            validUntilLabel={
              it.validTo ? `Válida hasta ${new Date(it.validTo).toISOString().slice(5, 10)}` : undefined
            }
            distanceKm={it.distanceKm ?? undefined}
            href={productHref(it.productSlug, params.zone)}
          />
        ))}
      </div>
      <div ref={sentinelRef} aria-hidden />
      {loading ? (
        <p className="text-center text-sm text-text-subtle">Cargando más ofertas...</p>
      ) : done ? (
        <p className="text-center text-sm text-text-subtle">No hay más ofertas.</p>
      ) : null}
    </div>
  );
}

function paramsToObject(p: OffersParams): Record<string, string | number | boolean | undefined> {
  return {
    zone: p.zone,
    vertical: p.vertical,
    chains: p.chains.length > 0 ? p.chains.join(",") : undefined,
    minDiscount: p.minDiscount || undefined,
    maxDistanceKm: p.maxDistanceKm,
    validity: p.validity,
    sort: p.sort,
    limit: p.limit,
    includeNearby: p.includeNearby,
  };
}

// Suprime unused warning por Label — se usa en versiones futuras del sheet mobile.
export const _label = Label;
