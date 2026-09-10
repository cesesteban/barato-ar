/**
 * Merge policy: al mergear dos productos, se elige un canonical
 * (a) el que tiene eanCode; (b) el más viejo por createdAt.
 * El "perdedor" gana `canonicalId = winner.id`.
 */

import { prisma } from "@/lib/db";
import type { Product } from "@prisma/client";

export type MergeResult = {
  canonicalId: string;
  aliasId: string;
};

export async function mergeProducts(a: Product, b: Product): Promise<MergeResult> {
  const winner = pickCanonical(a, b);
  const loser = winner.id === a.id ? b : a;

  // Si el ganador ya tiene canonicalId propio, encadenamos hacia arriba.
  const finalCanonical = winner.canonicalId ?? winner.id;

  await prisma.$transaction([
    prisma.product.update({
      where: { id: loser.id },
      data: { canonicalId: finalCanonical },
    }),
    // Todos los productos que apuntaban al loser también quedan apuntando al winner.
    prisma.product.updateMany({
      where: { canonicalId: loser.id },
      data: { canonicalId: finalCanonical },
    }),
  ]);

  return { canonicalId: finalCanonical, aliasId: loser.id };
}

function pickCanonical(a: Product, b: Product): Product {
  if (a.eanCode && !b.eanCode) return a;
  if (!a.eanCode && b.eanCode) return b;
  return a.createdAt <= b.createdAt ? a : b;
}
