import { cva, type VariantProps } from "class-variance-authority";
import { AlertCircle, CheckCircle2, Info, TriangleAlert } from "lucide-react";
import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

const alertVariants = cva("relative w-full rounded-[var(--radius)] border p-4 text-sm", {
  variants: {
    variant: {
      info: "border-[var(--color-info)] bg-[var(--color-info-soft)] text-text",
      success: "border-savings bg-savings-soft text-text",
      warning: "border-[var(--color-warning)] bg-[var(--color-warning-soft)] text-text",
      error: "border-discount bg-discount-soft text-text",
    },
  },
  defaultVariants: { variant: "info" },
});

const icons = {
  info: Info,
  success: CheckCircle2,
  warning: TriangleAlert,
  error: AlertCircle,
} as const;

export type AlertProps = HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>;

export const Alert = forwardRef<HTMLDivElement, AlertProps>(function Alert(
  { className, variant = "info", children, ...props },
  ref,
) {
  const Icon = icons[variant ?? "info"];
  return (
    <div ref={ref} role="alert" className={cn(alertVariants({ variant }), className)} {...props}>
      <div className="flex items-start gap-3">
        <Icon className="mt-0.5 size-4 shrink-0" aria-hidden />
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
});

export const AlertTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(
  function AlertTitle({ className, ...props }, ref) {
    return <h4 ref={ref} className={cn("mb-1 font-semibold leading-tight", className)} {...props} />;
  },
);

export const AlertDescription = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  function AlertDescription({ className, ...props }, ref) {
    return <div ref={ref} className={cn("text-sm text-text-muted", className)} {...props} />;
  },
);
