/**
 * On-demand revalidation post-ingesta (C-008).
 * El endpoint /api/revalidate se implementó en F001.
 */

export type RevalidateTag = `offers-${string}` | `chain-${string}` | `product-${string}` | "offers-home";

export async function revalidateAfterIngest(chainId: string, affectedZones: string[] = []): Promise<void> {
  const base = process.env.NEXT_PUBLIC_APP_URL;
  const secret = process.env.REVALIDATE_SECRET;
  if (!base || !secret) {
    console.warn("[revalidate] NEXT_PUBLIC_APP_URL o REVALIDATE_SECRET no seteados — skip");
    return;
  }

  const tags: RevalidateTag[] = [
    "offers-home",
    `chain-${chainId}`,
    ...affectedZones.map((z): RevalidateTag => `offers-${z}`),
  ];

  try {
    const res = await fetch(`${base}/api/revalidate`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-revalidate-secret": secret },
      body: JSON.stringify({ tags }),
    });
    if (!res.ok) {
      console.warn(`[revalidate] HTTP ${res.status} — el cache queda con revalidate ISR (5 min)`);
    }
  } catch (err) {
    console.warn(`[revalidate] fetch falló:`, err instanceof Error ? err.message : err);
  }
}
