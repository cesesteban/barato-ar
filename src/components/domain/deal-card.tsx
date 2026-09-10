import Link from "next/link";
import { Clock } from "lucide-react";
import { ChainBadge } from "./chain-badge";
import { DiscountBadge } from "./discount-badge";
import { PriceTag } from "./price-tag";
import { PromoBadge, type PromoType } from "./promo-badge";
import { ExpiredBadge } from "./expired-badge";
import { cn } from "@/lib/cn";

export type DealCardProduct = {
  slug: string;
  name: string;
  brand?: string | undefined;
  imageUrl?: string | undefined;
  imagePlaceholder?: string | undefined;
};

export type DealCardProps = {
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
  expiredDaysAgo?: number | undefined;
  href: string;
  className?: string | undefined;
};

export function DealCard({
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
  expiredDaysAgo,
  href,
  className,
}: DealCardProps) {
  const isExpired = typeof expiredDaysAgo === "number" && expiredDaysAgo > 0;
  return (
    <article
      className={cn(
        "group flex flex-col overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface",
        isExpired && "opacity-70",
        className,
      )}
    >
      <div className="relative flex h-44 items-center justify-center bg-surface-muted">
        {discountPct && discountPct > 0 ? (
          <div className="absolute left-2.5 top-2.5">
            <DiscountBadge pct={discountPct} />
          </div>
        ) : null}
        <div className="absolute right-2.5 top-2.5">
          <ChainBadge slug={chainSlug} label={chainLabel} />
        </div>
        {product.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.imageUrl}
            alt={product.name}
            className="max-h-32 w-auto object-contain"
            loading="lazy"
          />
        ) : (
          <div className="text-text-subtle" aria-hidden>
            {product.imagePlaceholder ?? <BottleGlyph />}
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-3.5">
        {product.brand ? (
          <span className="text-2xs font-semibold uppercase tracking-wider text-text-subtle">
            {product.brand}
          </span>
        ) : null}
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-text">
          <Link href={href} className="hover:text-primary focus-visible:text-primary">
            {product.name}
          </Link>
        </h3>
        <div className="mt-1 flex items-end gap-2">
          <PriceTag
            amount={price}
            previousAmount={previousPrice}
            pricePerUnit={pricePerUnit}
            size="md"
            strikethrough={isExpired}
          />
        </div>
        {promo ? (
          <div className="mt-0.5">
            <PromoBadge
              type={promo.type}
              buyQty={promo.buyQty}
              payQty={promo.payQty}
              secondDiscountPct={promo.secondDiscountPct}
            />
          </div>
        ) : null}
        <div className="mt-auto flex items-center justify-between border-t border-border pt-2.5 text-2xs text-text-subtle">
          <span className="inline-flex items-center gap-1">
            {isExpired ? (
              <ExpiredBadge daysAgo={expiredDaysAgo} />
            ) : validUntilLabel ? (
              <>
                <Clock className="size-3" aria-hidden />
                {validUntilLabel}
              </>
            ) : null}
          </span>
          {typeof distanceKm === "number" ? <span>{distanceKm.toFixed(1)} km</span> : null}
        </div>
      </div>
    </article>
  );
}

function BottleGlyph() {
  return (
    <svg width="72" height="96" viewBox="0 0 40 60" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden>
      <path d="M12 8h16v10c0 2 2 4 2 8v28c0 3-2 4-4 4H14c-2 0-4-1-4-4V26c0-4 2-6 2-8V8z" />
      <path d="M14 18h12" />
    </svg>
  );
}
