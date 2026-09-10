import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/cn";

/**
 * PromoBadge (C-001) — etiqueta corta para promos combo.
 * PromoType `unit` no renderiza nada.
 */
export type PromoType = "unit" | "nx1" | "nxm" | "second_off" | "bundle_discount";

export type PromoBadgeProps = {
  type: PromoType;
  buyQty?: number | undefined;
  payQty?: number | undefined;
  secondDiscountPct?: number | undefined;
  className?: string | undefined;
};

export function PromoBadge({
  type,
  buyQty,
  payQty,
  secondDiscountPct,
  className,
}: PromoBadgeProps) {
  const label = formatPromoLabel({ type, buyQty, payQty, secondDiscountPct });
  if (!label) return null;
  return (
    <Badge
      variant="savings"
      size="sm"
      className={cn("border border-savings/30", className)}
      aria-label={`Promoción: ${label}`}
    >
      {label}
    </Badge>
  );
}

export function formatPromoLabel({
  type,
  buyQty,
  payQty,
  secondDiscountPct,
}: Pick<PromoBadgeProps, "type" | "buyQty" | "payQty" | "secondDiscountPct">): string | null {
  switch (type) {
    case "unit":
      return null;
    case "nx1":
      return buyQty ? `${buyQty}x1` : "Nx1";
    case "nxm":
      return buyQty && payQty ? `${buyQty}x${payQty}` : "NxM";
    case "second_off":
      return secondDiscountPct ? `2do -${Math.round(secondDiscountPct)}%` : "2do off";
    case "bundle_discount":
      return secondDiscountPct
        ? `${buyQty ?? "N"} iguales -${Math.round(secondDiscountPct)}%`
        : "Combo";
    default:
      return null;
  }
}
