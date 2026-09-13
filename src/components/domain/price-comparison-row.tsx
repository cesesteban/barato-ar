import Link from "next/link";
import { ChainBadge } from "./chain-badge";
import { PriceTag } from "./price-tag";
import { PromoBadge, type PromoType } from "./promo-badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { resolveStoreLink } from "@/lib/store-links";

export type PriceComparisonRowProps = {
  rank: number;
  storeName: string;
  storeAddress?: string | undefined;
  chainSlug: string;
  chainName?: string | undefined;
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
  /**
   * Fallback href — se usa solo si `resolveStoreLink` no puede armar un link
   * externo (chain sin builder ni websiteUrl). Preferido cuando F019 activo:
   * pasar `productName`, `brand`, `storeProductUrl`, `chainWebsiteUrl`
   * para que el component genere link externo a la tienda.
   */
  href: string;
  /** Props F019 para armar link externo a la tienda. Opcionales para BC. */
  productName?: string | undefined;
  brand?: string | null | undefined;
  storeProductUrl?: string | null | undefined;
  chainWebsiteUrl?: string | null | undefined;
  best?: boolean | undefined;
  className?: string | undefined;
};

export function PriceComparisonRow({
  rank,
  storeName,
  storeAddress,
  chainSlug,
  chainName,
  price,
  previousPrice,
  deltaVsAvgPct,
  distanceKm,
  pricePerUnit,
  promo,
  href,
  productName,
  brand,
  storeProductUrl,
  chainWebsiteUrl,
  best,
  className,
}: PriceComparisonRowProps) {
  // F019: si tenemos productName, intentamos armar link externo.
  const externalHref = productName
    ? resolveStoreLink({
        chainSlug,
        productName,
        brand,
        storeProductUrl,
        chainWebsiteUrl,
      })
    : null;
  const resolvedHref = externalHref ?? chainWebsiteUrl ?? href;
  const isExternal = /^https?:\/\//.test(resolvedHref);
  const linkAriaLabel = isExternal
    ? `Ir a la tienda de ${chainName ?? chainSlug} (abre en nueva pestaña)`
    : `Ir a la tienda de ${chainName ?? chainSlug}`;

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
        <Link
          href={resolvedHref}
          {...(isExternal
            ? {
                target: "_blank",
                rel: "noopener noreferrer nofollow sponsored",
                "data-store-click": chainSlug,
                "data-store-has-pdp": String(!!storeProductUrl),
              }
            : {})}
          aria-label={linkAriaLabel}
        >
          Ir a la tienda →
        </Link>
      </Button>
    </div>
  );
}
