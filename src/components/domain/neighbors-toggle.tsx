"use client";

import { MapPinned } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/cn";

/**
 * NeighborsToggle (C-002) — incluye ofertas de barrios vecinos (< 3 km).
 */
export type NeighborsToggleProps = {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  radiusKm?: number | undefined;
  className?: string | undefined;
  id?: string | undefined;
};

export function NeighborsToggle({
  checked,
  onCheckedChange,
  radiusKm = 3,
  className,
  id = "neighbors-toggle",
}: NeighborsToggleProps) {
  return (
    <div className={cn("flex items-center gap-3 rounded-lg border border-border bg-surface p-3", className)}>
      <MapPinned className="size-4 text-text-muted" aria-hidden />
      <div className="flex flex-1 flex-col">
        <Label htmlFor={id} className="cursor-pointer">
          Incluir barrios vecinos
        </Label>
        <span className="text-2xs text-text-subtle">
          Ofertas dentro de {radiusKm} km de tu zona.
        </span>
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}
