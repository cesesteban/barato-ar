"use client";

import { ZonePicker } from "@/components/domain/zone-picker";

export type NavZoneSlotProps = {
  /** Etiqueta a mostrar durante SSR / suspense fallback. Cliente la sobreescribe. */
  ssrZoneLabel?: string | undefined;
};

/** Wrapper client para insertar el ZonePicker dentro del Nav (server component). */
export function NavZoneSlot({ ssrZoneLabel }: NavZoneSlotProps = {}) {
  return <ZonePicker autoOpenOnFirstVisit ssrLabel={ssrZoneLabel} />;
}
