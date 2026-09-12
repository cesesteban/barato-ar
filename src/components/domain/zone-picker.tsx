"use client";

import { MapPin, Navigation, Check, Loader2 } from "lucide-react";
import { Suspense, useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import {
  DEFAULT_ZONE_SLUG,
  formatZoneLabel,
  groupZonesByRegion,
  nearestZone,
  type ZoneEntry,
  type ZoneRegion,
} from "@/lib/zones-catalog";
import { ZoneChip } from "./zone-chip";
import { useZone } from "@/hooks/use-zone";

export type ZonePickerProps = {
  /** Renderizado del disparador. Si no se pasa, usa ZoneChip. */
  trigger?: React.ReactNode;
  /** Si `true`, abre automáticamente cuando el usuario aún no eligió zona. */
  autoOpenOnFirstVisit?: boolean;
  className?: string;
};

/**
 * Wrapper con <Suspense/> — necesario porque `useZone` internamente usa
 * `useSearchParams`, que Next 15 obliga a envolver para permitir
 * prerender de páginas estáticas que rendericen este componente.
 */
export function ZonePicker(props: ZonePickerProps) {
  const fallback = props.trigger ?? (
    <ZoneChip zoneLabel={formatZoneLabel(DEFAULT_ZONE_SLUG)} />
  );
  return (
    <Suspense fallback={<span className={props.className}>{fallback}</span>}>
      <ZonePickerInner {...props} />
    </Suspense>
  );
}

type GeoState =
  | { status: "idle" }
  | { status: "requesting" }
  | { status: "denied"; message: string }
  | { status: "unavailable"; message: string }
  | { status: "ok"; matched: ZoneEntry };

function ZonePickerInner({ trigger, autoOpenOnFirstVisit = false, className }: ZonePickerProps) {
  const { zone, setZone, hydrated, hasExplicitChoice } = useZone();
  const [open, setOpen] = useState(false);
  const [geo, setGeo] = useState<GeoState>({ status: "idle" });

  useEffect(() => {
    if (!autoOpenOnFirstVisit || !hydrated) return;
    if (hasExplicitChoice()) return;
    setOpen(true);
  }, [autoOpenOnFirstVisit, hydrated, hasExplicitChoice]);

  const groups = groupZonesByRegion();

  const handleGeolocation = () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setGeo({ status: "unavailable", message: "Tu navegador no soporta geolocalización." });
      return;
    }
    setGeo({ status: "requesting" });
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const matched = nearestZone(pos.coords.latitude, pos.coords.longitude);
        setGeo({ status: "ok", matched });
        setZone(matched.slug);
        setTimeout(() => setOpen(false), 800);
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setGeo({
            status: "denied",
            message: "No pudimos acceder a tu ubicación. Elegí tu zona manualmente.",
          });
        } else {
          setGeo({ status: "unavailable", message: "No se pudo obtener tu ubicación." });
        }
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 600_000 },
    );
  };

  const handlePick = (slug: string) => {
    setZone(slug);
    setOpen(false);
  };

  const currentLabel = formatZoneLabel(zone);
  const defaultTrigger = <ZoneChip zoneLabel={currentLabel} />;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <span className={className}>{trigger ?? defaultTrigger}</span>
      </DialogTrigger>
      <DialogContent aria-describedby="zone-picker-desc">
        <DialogHeader>
          <DialogTitle>Elegí tu zona</DialogTitle>
          <DialogDescription id="zone-picker-desc">
            Los precios y sucursales se muestran para la zona que elijas.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={handleGeolocation}
            disabled={geo.status === "requesting" || geo.status === "ok"}
            className="justify-start gap-2"
          >
            {geo.status === "requesting" ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : geo.status === "ok" ? (
              <Check className="size-4 text-primary" aria-hidden />
            ) : (
              <Navigation className="size-4" aria-hidden />
            )}
            {geo.status === "ok"
              ? `Detectado: ${geo.matched.name}`
              : geo.status === "requesting"
                ? "Buscando tu ubicación…"
                : "Usar mi ubicación"}
          </Button>
          {geo.status === "denied" || geo.status === "unavailable" ? (
            <p className="text-xs text-text-muted">{geo.message}</p>
          ) : null}
        </div>

        <div className="mt-4 max-h-[60vh] overflow-y-auto pr-1">
          {groups.map((g) => (
            <ZoneGroup
              key={g.region}
              title={g.region}
              zones={g.zones}
              currentSlug={zone}
              onPick={handlePick}
            />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ZoneGroup({
  title,
  zones,
  currentSlug,
  onPick,
}: {
  title: ZoneRegion;
  zones: ZoneEntry[];
  currentSlug: string;
  onPick: (slug: string) => void;
}) {
  return (
    <div className="mb-4 last:mb-0">
      <h3 className="mb-2 text-2xs font-semibold uppercase tracking-wider text-text-subtle">
        {title}
      </h3>
      <ul className="grid grid-cols-2 gap-1 sm:grid-cols-3">
        {zones.map((z) => {
          const active = z.slug === currentSlug;
          return (
            <li key={z.slug}>
              <button
                type="button"
                onClick={() => onPick(z.slug)}
                aria-pressed={active}
                className={cn(
                  "flex w-full items-center justify-between gap-2 rounded-[var(--radius)] border px-3 py-2 text-left text-sm transition-colors",
                  active
                    ? "border-primary bg-primary/5 font-semibold text-text"
                    : "border-border bg-surface text-text hover:border-primary/50 hover:bg-surface-alt",
                )}
              >
                <span className="flex items-center gap-2 truncate">
                  <MapPin className="size-3.5 shrink-0 text-text-subtle" aria-hidden />
                  {z.name}
                </span>
                {active ? <Check className="size-4 shrink-0 text-primary" aria-hidden /> : null}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
