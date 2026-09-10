/**
 * Pass 1: Match automático por EAN (F005).
 * Dos productos con mismo `ean_code` = mismo canonical.
 * SQL directo para performance.
 */

import { prisma } from "@/lib/db";

export async function runEanPass(): Promise<{ merged: number }> {
  // Encuentra todos los EANs con >1 producto. Elegí el "primer" por createdAt
  // como canonical y linkea el resto.
  const groups = await prisma.$queryRaw<Array<{ ean_code: string; ids: string[] }>>`
    SELECT ean_code, ARRAY_AGG(id ORDER BY created_at ASC) AS ids
    FROM products
    WHERE ean_code IS NOT NULL
    GROUP BY ean_code
    HAVING COUNT(*) > 1
  `;

  let merged = 0;
  for (const g of groups) {
    const [canonical, ...aliases] = g.ids;
    if (!canonical || aliases.length === 0) continue;
    const updated = await prisma.product.updateMany({
      where: { id: { in: aliases }, canonicalId: null },
      data: { canonicalId: canonical },
    });
    // Y encadenar los que ya apuntaban a cualquiera de los aliases.
    await prisma.product.updateMany({
      where: { canonicalId: { in: aliases } },
      data: { canonicalId: canonical },
    });
    merged += updated.count;
  }
  return { merged };
}
