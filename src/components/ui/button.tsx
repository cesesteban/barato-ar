import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 font-medium rounded-[var(--radius)] transition-colors duration-[var(--duration-fast)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)] disabled:opacity-50 disabled:pointer-events-none",
  {
    variants: {
      variant: {
        primary: "bg-primary text-[var(--color-primary-fg)] hover:bg-primary-hover",
        secondary:
          "bg-surface text-text border border-border hover:bg-surface-muted",
        ghost: "text-text hover:bg-surface-muted",
        destructive:
          "bg-discount text-[var(--color-discount-fg)] hover:opacity-90",
        outline:
          "border border-primary text-primary bg-transparent hover:bg-primary-soft",
        link: "text-primary underline-offset-4 hover:underline p-0 h-auto",
      },
      size: {
        sm: "text-sm h-8 px-3",
        md: "text-sm h-9 px-4",
        lg: "text-base h-10 px-5",
        icon: "size-9 p-0",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
    loading?: boolean;
  };

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant, size, asChild, loading, disabled, children, ...props },
  ref,
) {
  const Comp = asChild ? Slot : "button";
  // `Slot` requiere un único child. Cuando asChild=true dejamos que el hijo
  // (típicamente <Link>) tome control total; el spinner solo aplica al modo
  // botón normal.
  return (
    <Comp
      ref={ref}
      className={cn(buttonVariants({ variant, size }), className)}
      // `disabled` no aplica a <a>; sólo lo pasamos cuando no es asChild.
      {...(asChild ? {} : { disabled: disabled || loading })}
      aria-busy={loading || undefined}
      {...props}
    >
      {asChild ? (
        children
      ) : (
        <>
          {loading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
          {children}
        </>
      )}
    </Comp>
  );
});
