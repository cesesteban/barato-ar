import { X } from "lucide-react";
import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

const chipVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]",
  {
    variants: {
      variant: {
        neutral: "border border-border bg-surface text-text-muted hover:bg-surface-muted",
        selected: "bg-text text-[var(--color-primary-fg)]",
        primary: "border border-[color:var(--color-primary-soft)] bg-primary-soft text-primary",
      },
    },
    defaultVariants: { variant: "neutral" },
  },
);

export type ChipProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof chipVariants> & {
    onRemove?: () => void;
  };

export const Chip = forwardRef<HTMLButtonElement, ChipProps>(function Chip(
  { className, variant, onRemove, children, ...props },
  ref,
) {
  return (
    <button
      type="button"
      ref={ref}
      className={cn(chipVariants({ variant }), className)}
      {...props}
    >
      {children}
      {onRemove ? (
        <span
          role="button"
          tabIndex={-1}
          aria-label="Quitar"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="-mr-1 inline-flex size-4 items-center justify-center rounded-full hover:bg-black/10"
        >
          <X className="size-3" aria-hidden />
        </span>
      ) : null}
    </button>
  );
});
