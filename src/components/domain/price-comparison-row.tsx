import Link from "next/link";
import { ChainBadge } from "./chain-badge";
import { PriceTag } from "./price-tag";
import { PromoBadge, type PromoType } from "./promo-badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

export type PriceComparisonRowProps = {
  rank: number;
  storeName: string;
  storeAddress?: string | undefined;
  chainSlug: string;
  price: number;
  previousPrice?: number | undefined;
  deltaVsAvgPct?: number | undefined;
  distanceKm?: number | undefined;
  pricePerUnit?: { value: number; unit: string } | undefined;
  promo?:
    | {
        type: PromoType;
        buyQty?: number | undefined;
        payQty?: number | undefined;
        secondDiscountPct?: number | undefined;
      }
    | undefined;
  proximity?: "in_zone" | "nearby" | undefined;
  href: string;
  best?: boolean | undefined;
  className?: string | undefined;
};

export function PriceComparisonRow({
  rank,
  storeName,
  storeAddress,
  chainSlug,
  price,
  previousPrice,
  deltaVsAvgPct,
  distanceKm,
  pricePerUnit,
  promo,
  href,
  best,
  className,
}: PriceComparisonRowProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-[40px_1fr_120px_100px_90px_140px] items-center gap-3 border-b border-border p-4 last:border-b-0",
        best && "bg-savings-soft",
        className,
      )}
    >
      <span
        className={cn(
          "flex size-7 items-center justify-center rounded-md text-xs font-bold",
          best ? "bg-savings text-[var(--color-savings-fg)]" : "bg-surface-muted text-text-muted",
        )}
      >
        {rank}
      </span>
      <div className="flex flex-col gap-0.5">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-text">{storeName}</span>
          <ChainBadge slug={chainSlug} variant="text" />
        </div>
        {storeAddress ? <span className="text-2xs text-text-subtle">{storeAddress}</span> : null}
      </div>
      <PriceTag amount={price} previousAmount={previousPrice} pricePerUnit={pricePerUnit} size="md" />
      <div className="flex flex-col gap-1">
        {promo ? (
          <PromoBadge type={promo.type} buyQty={promo.buyQty} payQty={promo.payQty} secondDiscountPct={promo.secondDiscountPct} />
        ) : null}
        {typeof deltaVsAvgPct === "number" ? (
          <span
            className={cn(
              "text-xs font-semibold",
              deltaVsAvgPct < 0 ? "text-savings" : deltaVsAvgPct > 0 ? "text-discount" : "text-text-muted",
            )}
          >
            {deltaVsAvgPct === 0 ? "±0%" : `${deltaVsAvgPct > 0 ? "+" : ""}${Math.round(deltaVsAvgPct)}%`}
          </span>
        ) : null}
      </div>
      <span className="text-xs text-text-subtle">
        {typeof distanceKm === "number" ? `${distanceKm.toFixed(1)} km` : "—"}
      </span>
      <Button variant={best ? "primary" : "secondary"} size="sm" asChild>
        <Link href={href}>Ir a la tienda →</Link>
      </Button>
    </div>
  );
}
