import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "@/lib/cn";
import { formatPrice, formatPricePerUnit } from "@/lib/format-price";

const priceVariants = cva("font-bold tracking-tight text-text", {
  variants: {
    size: {
      sm: "text-base",
      md: "text-xl",
      lg: "text-2xl",
      xl: "text-4xl",
    },
  },
  defaultVariants: { size: "md" },
});

export type PriceTagProps = Omit<HTMLAttributes<HTMLDivElement>, "children"> &
  VariantProps<typeof priceVariants> & {
    amount: number;
    previousAmount?: number | undefined;
    /** C-003: precio por unidad (ARS / L, kg, un). */
    pricePerUnit?: { value: number; unit: string } | undefined;
    strikethrough?: boolean | undefined;
    withCents?: boolean | undefined;
  };

/**
 * PriceTag — precio grande + precio anterior tachado + precio por unidad (C-003).
 * Cuando `amount === 0` muestra "Consultar" (C-007).
 */
export const PriceTag = forwardRef<HTMLDivElement, PriceTagProps>(function PriceTag(
  { amount, previousAmount, pricePerUnit, strikethrough, withCents, size, className, ...props },
  ref,
) {
  const isConsult = amount === 0;
  return (
    <div ref={ref} className={cn("flex flex-col", className)} {...props}>
      <div className="flex items-baseline gap-2">
        <span
          className={cn(
            priceVariants({ size }),
            strikethrough && "text-text-subtle line-through decoration-1",
            isConsult && "text-text-muted",
          )}
        >
          {formatPrice(amount, withCents ? { withCents: true } : undefined)}
        </span>
        {previousAmount !== undefined && previousAmount > amount ? (
          <span className="text-sm text-text-subtle line-through">
            {formatPrice(previousAmount)}
          </span>
        ) : null}
      </div>
      {pricePerUnit && pricePerUnit.value > 0 ? (
        <span className="text-2xs font-medium text-text-muted">
          {formatPricePerUnit(pricePerUnit.value, pricePerUnit.unit)}
        </span>
      ) : null}
    </div>
  );
});
