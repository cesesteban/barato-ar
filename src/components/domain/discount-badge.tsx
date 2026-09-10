import { Badge } from "@/components/ui/badge";
import { formatDiscountPct } from "@/lib/format-price";

export type DiscountBadgeProps = {
  pct: number;
  size?: "sm" | "md" | "lg";
  className?: string;
};

export function DiscountBadge({ pct, size = "md", className }: DiscountBadgeProps) {
  if (!Number.isFinite(pct) || pct === 0) return null;
  return (
    <Badge variant="discount" size={size} className={className} aria-label={`Descuento ${formatDiscountPct(pct)}`}>
      {formatDiscountPct(pct)}
    </Badge>
  );
}
