import { politeFetch } from "../../core/http";

const CARREFOUR_HOME = "https://www.carrefour.com.ar";

/**
 * Descubre y descarga el folleto semanal vigente de Carrefour.
 * En MVP: busca en `/promociones` un link con clase/hash conocido y baja el HTML.
 * La URL exacta cambia entre semanas; usamos heurísticas.
 * TODO: cachear metadata (URL) y auditar cambios de layout.
 */
export async function fetchCarrefourFlyer(): Promise<{ raw: string; sourceUrl: string; capturedAt: Date }> {
  const overrideUrl = process.env.CARREFOUR_FLYER_URL;
  if (overrideUrl) {
    const res = await politeFetch(overrideUrl, { label: "carrefour.flyer" });
    if (!res.ok) throw new Error(`Carrefour flyer HTTP ${res.status}`);
    const raw = await res.text();
    return { raw, sourceUrl: overrideUrl, capturedAt: new Date() };
  }

  const promosUrl = `${CARREFOUR_HOME}/promociones`;
  const promoRes = await politeFetch(promosUrl, { label: "carrefour.promociones" });
  if (!promoRes.ok) throw new Error(`Carrefour promociones HTTP ${promoRes.status}`);
  const promoHtml = await promoRes.text();

  // El folleto semanal suele estar como link con "folleto" o "revista" en href.
  const match = promoHtml.match(/href="([^"]*(?:folleto|revista)[^"]*)"/i);
  const relative = match?.[1];
  if (!relative) {
    throw new Error("Carrefour: no se encontró link a folleto semanal en /promociones");
  }
  const flyerUrl = relative.startsWith("http") ? relative : `${CARREFOUR_HOME}${relative}`;

  const flyerRes = await politeFetch(flyerUrl, { label: "carrefour.flyer" });
  if (!flyerRes.ok) throw new Error(`Carrefour flyer HTTP ${flyerRes.status}`);
  const raw = await flyerRes.text();
  return { raw, sourceUrl: flyerUrl, capturedAt: new Date() };
}
