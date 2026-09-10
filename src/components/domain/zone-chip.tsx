"use client";

import { ChevronDown, MapPin } from "lucide-react";
import { forwardRef } from "react";
import { cn } from "@/lib/cn";

export type ZoneChipProps = {
  zoneLabel: string;
  onChangeZone?: (() => void) | undefined;
  className?: string | undefined;
};

export const ZoneChip = forwardRef<HTMLButtonElement, ZoneChipProps>(function ZoneChip(
  { zoneLabel, onChangeZone, className },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      onClick={onChangeZone}
      aria-label={`Zona actual: ${zoneLabel}. Cambiar.`}
      className={cn(
        "inline-flex items-center gap-2 rounded-[var(--radius)] border border-border bg-surface px-3 py-2 text-sm font-medium text-text hover:bg-surface-muted",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]",
        className,
      )}
    >
      <MapPin className="size-4 text-primary" aria-hidden />
      <span>{zoneLabel}</span>
      <ChevronDown className="size-3 text-text-subtle" aria-hidden />
    </button>
  );
});
