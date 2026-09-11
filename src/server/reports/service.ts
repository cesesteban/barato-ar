/**
 * Servicio de reportes de comunidad (F011).
 * Aprobación crea Price + Offer con source='crowdsourced'.
 */

import Decimal from "decimal.js";
import { prisma } from "@/lib/db";
import { revalidateAfterIngest } from "@/ingestion/core/revalidate";
import type { CreateReportInput } from "./schemas";

export type CreateReportResult =
  | { ok: true; reportId: string }
  | { ok: false; code: "chain_not_found" | "invalid" };

export async function createReport(input: CreateReportInput, ipHash: string): Promise<CreateReportResult> {
  const chain = await prisma.chain.findUnique({ where: { slug: input.chainSlug } });
  if (!chain) return { ok: false, code: "chain_not_found" };
  if (!input.productSlug && !input.productText) return { ok: false, code: "invalid" };

  const report = await prisma.report.create({
    data: {
      productSlug: input.productSlug ?? null,
      productText: input.productText ?? null,
      chainSlug: input.chainSlug,
      storeText: input.storeText ?? null,
      storeId: input.storeId ?? null,
      price: new Decimal(input.price),
      previousPrice: input.previousPrice ? new Decimal(input.previousPrice) : null,
      validTo: input.validTo ? new Date(input.validTo) : null,
      description: input.description ?? null,
      ipHash,
      status: "pending",
    },
  });
  return { ok: true, reportId: report.id };
}

export type ApproveReportInput = {
  reportId: string;
  approvedBy: string;
  overrideProductSlug?: string | undefined;
  overrideStoreId?: string | undefined;
};

export async function approveReport(input: ApproveReportInput): Promise<{ ok: boolean; priceId?: string; error?: string }> {
  const r = await prisma.report.findUnique({ where: { id: input.reportId } });
  if (!r) return { ok: false, error: "not_found" };
  if (r.status !== "pending" && r.status !== "re_review") return { ok: false, error: "already_decided" };

  const productSlug = input.overrideProductSlug ?? r.productSlug;
  if (!productSlug) return { ok: false, error: "missing_product_slug" };
  const product = await prisma.product.findUnique({ where: { slug: productSlug } });
  if (!product) return { ok: false, error: "product_not_found" };

  const storeId = input.overrideStoreId ?? r.storeId;
  const store = storeId
    ? await prisma.store.findUnique({ where: { id: storeId } })
    : await prisma.store.findFirst({ where: { chainId: r.chainSlug, isVirtual: true } });
  if (!store) return { ok: false, error: "store_not_found" };

  const price = Number(r.price);
  const previousPrice = r.previousPrice ? Number(r.previousPrice) : null;
  const discountPct =
    previousPrice && previousPrice > 0 ? ((previousPrice - price) / previousPrice) * 100 : null;

  const validFrom = new Date();
  const inserted = await prisma.price.upsert({
    where: {
      unique_capture: {
        productId: product.id,
        storeId: store.id,
        source: "crowdsourced",
        validFrom,
      },
    },
    update: {
      price: new Decimal(price),
      previousPrice: previousPrice != null ? new Decimal(previousPrice) : null,
      discountPct,
      isOffer: !!(discountPct && discountPct > 0),
      validTo: r.validTo,
    },
    create: {
      productId: product.id,
      storeId: store.id,
      price: new Decimal(price),
      previousPrice: previousPrice != null ? new Decimal(previousPrice) : null,
      discountPct,
      isOffer: !!(discountPct && discountPct > 0),
      validFrom,
      validTo: r.validTo,
      source: "crowdsourced",
      sourceUrl: `report:${r.id}`,
    },
  });
  await prisma.report.update({
    where: { id: r.id },
    data: { status: "approved", approvedBy: input.approvedBy, approvedAt: new Date() },
  });
  await revalidateAfterIngest(r.chainSlug, store.zoneId ? [store.zoneId] : []);
  return { ok: true, priceId: inserted.id };
}

export async function rejectReport(reportId: string, approvedBy: string, reason?: string): Promise<{ ok: boolean }> {
  const r = await prisma.report.findUnique({ where: { id: reportId } });
  if (!r) return { ok: false };
  await prisma.report.update({
    where: { id: reportId },
    data: {
      status: "rejected",
      reasonRejected: reason ?? null,
      approvedBy,
      approvedAt: new Date(),
    },
  });
  return { ok: true };
}

export async function voteReport(reportId: string, ipHash: string, kind: "up" | "down"): Promise<{ ok: boolean }> {
  await prisma.reportVote.upsert({
    where: { reportId_ipHash: { reportId, ipHash } },
    update: { kind },
    create: { reportId, ipHash, kind },
  });
  const [ups, downs] = await Promise.all([
    prisma.reportVote.count({ where: { reportId, kind: "up" } }),
    prisma.reportVote.count({ where: { reportId, kind: "down" } }),
  ]);
  const shouldHide = downs >= 3;
  await prisma.report.update({
    where: { id: reportId },
    data: {
      upvotes: ups,
      downvotes: downs,
      ...(shouldHide ? { status: "re_review" } : {}),
    },
  });
  return { ok: true };
}
