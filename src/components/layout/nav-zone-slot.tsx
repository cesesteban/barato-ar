"use client";

import { ZonePicker } from "@/components/domain/zone-picker";

/** Wrapper client para insertar el ZonePicker dentro del Nav (server component). */
export function NavZoneSlot() {
  return <ZonePicker autoOpenOnFirstVisit />;
}
