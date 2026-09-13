"use client";

import { useEffect } from "react";

/**
 * Listener global que captura clicks en cualquier `<a data-store-click="X">`
 * (emitido por `<PriceComparisonRow>` cuando el link es externo) y envía
 * evento `Store Click` a Plausible con props `{ chain, hasPdp }`.
 *
 * Rendering: no renderiza nada visible; solo agrega el event listener al
 * documento en el mount. Cleanup en el unmount.
 *
 * Fallback silencioso: si `window.plausible` no existe (analytics no
 * configurado), no rompe — el click se propaga normalmente al link externo.
 */
export function StoreClickTracker() {
  useEffect(() => {
    const handler = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest("[data-store-click]");
      if (!anchor) return;
      const chain = anchor.getAttribute("data-store-click");
      const hasPdp = anchor.getAttribute("data-store-has-pdp") === "true";
      try {
        const w = window as unknown as {
          plausible?: (event: string, opts?: unknown) => void;
        };
        w.plausible?.("Store Click", { props: { chain, hasPdp: hasPdp ? "yes" : "no" } });
      } catch {
        // no-op — analytics no debe romper el click
      }
    };
    document.addEventListener("click", handler, { capture: true });
    return () => document.removeEventListener("click", handler, { capture: true });
  }, []);
  return null;
}
