"use client";

import { useEffect, useState } from "react";
import { Card, CardBody, CardDescription, CardHeader, CardTitle, Chip } from "@/components/ui";
import { PriceHistoryChart } from "./price-history-chart";
import { formatPrice } from "@/lib/format-price";
import type { HistoryResponse } from "@/server/history/schemas";

export type PriceHistoryCardProps = {
  slug: string;
  zone: string;
  initial: HistoryResponse | null;
};

const RANGES: Array<{ days: number; label: string }> = [
  { days: 30, label: "30D" },
  { days: 90, label: "90D" },
  { days: 180, label: "180D" },
  { days: 365, label: "1A" },
];

export function PriceHistoryCard({ slug, zone, initial }: PriceHistoryCardProps) {
  const [days, setDays] = useState(initial?.days ?? 90);
  const [data, setData] = useState<HistoryResponse | null>(initial);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!initial || days === initial.days) return;
    const controller = new AbortController();
    (async () => {
      setLoading(true);
      try {
        const url = new URL(`/api/product/${slug}/history`, window.location.origin);
        url.searchParams.set("zone", zone);
        url.searchParams.set("days", String(days));
        const res = await fetch(url.toString(), { signal: controller.signal });
        if (!res.ok) return;
        setData((await res.json()) as HistoryResponse);
      } catch (err) {
        if ((err as Error).name !== "AbortError") console.warn("[history] fetch:", err);
      } finally {
        setLoading(false);
      }
    })();
    return () => controller.abort();
  }, [days, initial, slug, zone]);

  const stats = data?.stats ?? { current: null, avg: null, min: null, max: null };

  return (
    <Card>
      <CardHeader className="flex-row items-baseline justify-between gap-2">
        <div>
          <CardTitle>Historial de precios</CardTitle>
          <CardDescription>
            Promedio zonal últimos {days} días · {data?.points.length ?? 0} obs.
          </CardDescription>
        </div>
        <div className="flex gap-1" role="tablist" aria-label="Rango temporal">
          {RANGES.map((r) => (
            <Chip
              key={r.days}
              variant={days === r.days ? "selected" : "neutral"}
              onClick={() => setDays(r.days)}
              aria-selected={days === r.days}
              role="tab"
            >
              {r.label}
            </Chip>
          ))}
        </div>
      </CardHeader>
      <CardBody>
        {loading ? (
          <div className="flex h-56 items-center justify-center text-sm text-text-subtle">
            Cargando historial...
          </div>
        ) : (
          <PriceHistoryChart data={data?.points ?? []} />
        )}
        <dl className="mt-4 grid grid-cols-2 gap-4 border-t border-border pt-4 sm:grid-cols-4">
          <StatCell label="Actual" value={stats.current} />
          <StatCell label="Promedio" value={stats.avg} />
          <StatCell
            label="Mínimo"
            value={stats.min?.price ?? null}
            sublabel={stats.min?.day}
            emphasis="savings"
          />
          <StatCell label="Máximo" value={stats.max?.price ?? null} sublabel={stats.max?.day} />
        </dl>
      </CardBody>
    </Card>
  );
}

function StatCell({
  label,
  value,
  sublabel,
  emphasis,
}: {
  label: string;
  value: number | null;
  sublabel?: string | undefined;
  emphasis?: "savings" | undefined;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-2xs font-semibold uppercase tracking-wider text-text-subtle">{label}</dt>
      <dd
        className={
          "text-lg font-bold tracking-tight " + (emphasis === "savings" ? "text-savings" : "text-text")
        }
      >
        {value != null ? formatPrice(value) : "—"}
      </dd>
      {sublabel ? <span className="text-2xs text-text-subtle">{sublabel}</span> : null}
    </div>
  );
}
