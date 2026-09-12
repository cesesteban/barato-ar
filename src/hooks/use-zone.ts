"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { DEFAULT_ZONE_SLUG, getZoneBySlug } from "@/lib/zones-catalog";

const LS_KEY = "barato.zone";

/**
 * Hook cliente para leer/setear la zona del usuario.
 *
 * Prioridad de resolución:
 *   1. `?zone=X` en la URL (sirve para links compartidos)
 *   2. localStorage (elección previa del usuario en este navegador)
 *   3. DEFAULT_ZONE_SLUG (Palermo)
 *
 * Al cambiar la zona:
 *   - Escribe a localStorage
 *   - Actualiza el URL param con router.replace (mantiene el resto de query)
 *   - Los server components re-renderizan con searchParams nuevo
 */
export function useZone() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const urlZone = searchParams.get("zone");
  const [zone, setZoneState] = useState<string>(urlZone ?? DEFAULT_ZONE_SLUG);
  const [hydrated, setHydrated] = useState(false);

  // Al montar en el cliente, si no hay ?zone= usar localStorage.
  useEffect(() => {
    if (urlZone && getZoneBySlug(urlZone)) {
      setZoneState(urlZone);
      setHydrated(true);
      return;
    }
    try {
      const stored = window.localStorage.getItem(LS_KEY);
      if (stored && getZoneBySlug(stored)) {
        setZoneState(stored);
      }
    } catch {
      // Storage bloqueado (private mode) — usamos default.
    }
    setHydrated(true);
  }, [urlZone]);

  const setZone = useCallback(
    (nextSlug: string) => {
      if (!getZoneBySlug(nextSlug)) return;
      setZoneState(nextSlug);
      try {
        window.localStorage.setItem(LS_KEY, nextSlug);
      } catch {
        // ignore
      }
      const params = new URLSearchParams(searchParams.toString());
      params.set("zone", nextSlug);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const hasExplicitChoice = useCallback((): boolean => {
    if (urlZone) return true;
    try {
      return !!window.localStorage.getItem(LS_KEY);
    } catch {
      return false;
    }
  }, [urlZone]);

  return { zone, setZone, hydrated, hasExplicitChoice };
}
