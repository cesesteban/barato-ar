import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold leading-none",
  {
    variants: {
      variant: {
        neutral: "bg-surface-muted text-text-muted",
        info: "bg-[var(--color-info-soft)] text-[var(--color-info)]",
        savings: "bg-savings-soft text-savings",
        discount: "bg-discount text-[var(--color-discount-fg)]",
        warning: "bg-[var(--color-warning-soft)] text-[var(--color-warning-fg)]",
        primary: "bg-primary-soft text-primary",
        outline: "border border-border bg-transparent text-text",
      },
      size: {
        sm: "px-1.5 py-0.5 text-2xs",
        md: "px-2 py-1 text-xs",
        lg: "px-2.5 py-1 text-sm",
      },
    },
    defaultVariants: { variant: "neutral", size: "md" },
  },
);

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>;

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(function Badge(
  { className, variant, size, ...props },
  ref,
) {
  return <span ref={ref} className={cn(badgeVariants({ variant, size }), className)} {...props} />;
});
