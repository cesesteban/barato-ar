import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export const Skeleton = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  function Skeleton({ className, ...props }, ref) {
    return (
      <div
        ref={ref}
        aria-hidden
        className={cn("animate-pulse rounded-[var(--radius-sm)] bg-surface-muted", className)}
        {...props}
      />
    );
  },
);
