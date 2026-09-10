import Link from "next/link";
import { ChainBadge } from "./chain-badge";
import { DiscountBadge } from "./discount-badge";
import { PriceTag } from "./price-tag";
import { PromoBadge, type PromoType } from "./promo-badge";
import type { DealCardProduct } from "./deal-card";
import { cn } from "@/lib/cn";

export type DealCardCompactProps = {
  product: DealCardProduct;
  price: number;
  previousPrice?: number | undefined;
  discountPct?: number | undefined;
  chainSlug: string;
  chainLabel?: string | undefined;
  pricePerUnit?: { value: number; unit: string } | undefined;
  promo?:
    | {
        type: PromoType;
        buyQty?: number | undefined;
        payQty?: number | undefined;
        secondDiscountPct?: number | undefined;
      }
    | undefined;
  validUntilLabel?: string | undefined;
  distanceKm?: number | undefined;
  href: string;
  className?: string | undefined;
};

/** Mobile: card horizontal más compacto. */
export function DealCardCompact({
  product,
  price,
  previousPrice,
  discountPct,
  chainSlug,
  chainLabel,
  pricePerUnit,
  promo,
  validUntilLabel,
  distanceKm,
  href,
  className,
}: DealCardCompactProps) {
  return (
    <Link
      href={href}
      className={cn(
        "flex overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface transition-colors hover:border-border-strong",
        className,
      )}
    >
      <div className="relative flex w-28 shrink-0 items-center justify-center bg-surface-muted">
        {discountPct && discountPct > 0 ? (
          <div className="absolute left-1.5 top-1.5">
            <DiscountBadge pct={discountPct} size="sm" />
          </div>
        ) : null}
        {product.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.imageUrl} alt={product.name} className="h-full max-h-24 w-auto object-contain" />
        ) : null}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <div className="flex items-center gap-1.5">
          <ChainBadge slug={chainSlug} label={chainLabel} />
          {promo ? (
            <PromoBadge type={promo.type} buyQty={promo.buyQty} payQty={promo.payQty} secondDiscountPct={promo.secondDiscountPct} />
          ) : null}
        </div>
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-text">{product.name}</h3>
        <PriceTag
          amount={price}
          previousAmount={previousPrice}
          pricePerUnit={pricePerUnit}
          size="md"
        />
        <span className="text-2xs text-text-subtle">
          {validUntilLabel} {typeof distanceKm === "number" ? `· ${distanceKm.toFixed(1)} km` : ""}
        </span>
      </div>
    </Link>
  );
}
