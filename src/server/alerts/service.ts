/**
 * Servicio de alertas email-only (F009).
 * Estados: pending → verified/active → notified → active → ... o cancelled/bounced.
 */

import { render } from "@react-email/render";
import Decimal from "decimal.js";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { sendMail } from "@/lib/mailer";
import { hashToken, signToken } from "@/lib/tokens";
import { AlertVerifyEmail } from "@/emails/alert-verify";
import { AlertTriggeredEmail } from "@/emails/alert-triggered";
import { formatPrice } from "@/lib/format-price";
import type { CreateAlertInput } from "./schemas";

const VERIFY_EXPIRES_MS = 24 * 3600 * 1000;
const MAX_ACTIVE_PER_EMAIL = 20;

export type CreateAlertResult =
  | { ok: true; alertId: string; alreadyExists: boolean }
  | { ok: false; code: "quota_exceeded" | "product_not_found" };

export async function createAlert(
  input: CreateAlertInput,
  ipHash?: string,
): Promise<CreateAlertResult> {
  const emailLower = input.email.trim().toLowerCase();
  const product = await prisma.product.findUnique({
    where: { slug: input.productSlug },
    select: { id: true, name: true },
  });
  if (!product) return { ok: false, code: "product_not_found" };

  const activeCount = await prisma.alert.count({
    where: { email: emailLower, status: { in: ["pending", "active", "notified"] } },
  });
  if (activeCount >= MAX_ACTIVE_PER_EMAIL) return { ok: false, code: "quota_exceeded" };

  const targetPrice = new Decimal(input.targetPrice);

  const existing = await prisma.alert.findUnique({
    where: {
      email_productId_targetPrice: {
        email: emailLower,
        productId: product.id,
        targetPrice,
      },
    },
  });
  if (existing && existing.status !== "cancelled" && existing.status !== "bounced") {
    return { ok: true, alertId: existing.id, alreadyExists: true };
  }

  const expiresAt = new Date(Date.now() + VERIFY_EXPIRES_MS);
  const alert = existing
    ? await prisma.alert.update({
        where: { id: existing.id },
        data: {
          status: "pending",
          cancelledAt: null,
          verifiedAt: null,
          notifiedAt: null,
          expiresAt,
          ipHash: ipHash ?? null,
        },
      })
    : await prisma.alert.create({
        data: {
          email: emailLower,
          productId: product.id,
          targetPrice,
          zoneSlug: input.zoneSlug,
          status: "pending",
          expiresAt,
          ipHash: ipHash ?? null,
          // Se llenan tras el sign; los ponemos con placeholder único-por-alert.
          verifyTokenHash: cryptoRandomHex(),
          unsubTokenHash: cryptoRandomHex(),
        },
      });

  const verifyToken = signToken(alert.id, "verify");
  const unsubToken = signToken(alert.id, "unsub");
  await prisma.alert.update({
    where: { id: alert.id },
    data: {
      verifyTokenHash: hashToken(verifyToken),
      unsubTokenHash: hashToken(unsubToken),
    },
  });

  const verifyUrl = `${env.NEXT_PUBLIC_APP_URL}/api/alerts/verify?token=${verifyToken}`;
  const html = await render(
    AlertVerifyEmail({
      productName: product.name,
      targetPrice: formatPrice(Number(targetPrice)),
      verifyUrl,
    }),
  );
  await sendMail({
    to: emailLower,
    subject: `Confirmá tu alerta para ${product.name}`,
    html,
    headers: {
      "List-Unsubscribe": `<${env.NEXT_PUBLIC_APP_URL}/api/alerts/unsubscribe?token=${unsubToken}>`,
    },
  });
  await recordEmailEvent(alert.id, "sent", { kind: "verify" });

  return { ok: true, alertId: alert.id, alreadyExists: false };
}

export async function verifyAlert(alertId: string): Promise<{ ok: boolean; alreadyVerified: boolean }> {
  const alert = await prisma.alert.findUnique({ where: { id: alertId } });
  if (!alert) return { ok: false, alreadyVerified: false };
  if (alert.status === "cancelled" || alert.status === "bounced") return { ok: false, alreadyVerified: false };
  if (alert.verifiedAt) return { ok: true, alreadyVerified: true };
  if (alert.expiresAt < new Date()) return { ok: false, alreadyVerified: false };

  await prisma.alert.update({
    where: { id: alertId },
    data: { status: "active", verifiedAt: new Date() },
  });
  await recordEmailEvent(alertId, "verified");
  return { ok: true, alreadyVerified: false };
}

export async function unsubscribeAlert(alertId: string): Promise<boolean> {
  const alert = await prisma.alert.findUnique({ where: { id: alertId } });
  if (!alert) return false;
  if (alert.status === "cancelled") return true;
  await prisma.alert.update({
    where: { id: alertId },
    data: { status: "cancelled", cancelledAt: new Date() },
  });
  await recordEmailEvent(alertId, "cancelled");
  return true;
}

export async function recordEmailEvent(alertId: string, kind: string, metadata?: object): Promise<void> {
  await prisma.emailEvent.create({
    data: metadata ? { alertId, kind, metadata: metadata as never } : { alertId, kind },
  });
}

function cryptoRandomHex(): string {
  const buf = new Uint8Array(32);
  globalThis.crypto.getRandomValues(buf);
  return Array.from(buf, (b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Ejecuta el scan de precios y dispara emails para alertas cuyo target ya
 * quedó cumplido. Cooldown 7d entre notificaciones (F009 · SC-006).
 */
export async function scanAndNotify(): Promise<{ triggered: number; skipped: number }> {
  const cutoff = new Date(Date.now() - 7 * 24 * 3600 * 1000);
  const candidates = await prisma.alert.findMany({
    where: {
      status: { in: ["active", "notified"] },
      verifiedAt: { not: null },
      OR: [{ notifiedAt: null }, { notifiedAt: { lt: cutoff } }],
    },
    include: { product: true },
    take: 500,
  });

  let triggered = 0;
  let skipped = 0;

  for (const alert of candidates) {
    const rows = await prisma.$queryRaw<
      Array<{
        price: string;
        chain_name: string;
        store_name: string;
        product_slug: string;
      }>
    >`
      SELECT pr.price::text AS price, c.name AS chain_name, s.name AS store_name, p.slug AS product_slug
      FROM prices pr
      JOIN products p ON p.id = pr.product_id
      JOIN stores s ON s.id = pr.store_id
      JOIN chains c ON c.id = s.chain_id
      WHERE (p.id = ${alert.productId} OR p.canonical_id = ${alert.productId})
        AND pr.captured_at > NOW() - INTERVAL '7 days'
        AND pr.price > 0
        AND pr.price <= ${alert.targetPrice.toString()}::decimal
        AND (s.zone_id = ${alert.zoneSlug} OR s.is_virtual = true)
      ORDER BY pr.price ASC
      LIMIT 1
    `;
    const hit = rows[0];
    if (!hit) {
      skipped++;
      continue;
    }
    const unsubToken = signToken(alert.id, "unsub");
    const currentPrice = Number(hit.price);
    const productUrl = `${env.NEXT_PUBLIC_APP_URL}/producto/${hit.product_slug}`;
    const unsubscribeUrl = `${env.NEXT_PUBLIC_APP_URL}/api/alerts/unsubscribe?token=${unsubToken}`;

    const html = await render(
      AlertTriggeredEmail({
        productName: alert.product.name,
        currentPrice: formatPrice(currentPrice),
        targetPrice: formatPrice(Number(alert.targetPrice)),
        chainName: hit.chain_name,
        storeName: hit.store_name,
        productUrl,
        unsubscribeUrl,
      }),
    );
    await sendMail({
      to: alert.email,
      subject: `¡Bajó! ${alert.product.name} a ${formatPrice(currentPrice)}`,
      html,
      headers: { "List-Unsubscribe": `<${unsubscribeUrl}>` },
    });
    await prisma.alert.update({
      where: { id: alert.id },
      data: { status: "notified", notifiedAt: new Date() },
    });
    await recordEmailEvent(alert.id, "sent", { kind: "triggered", price: currentPrice });
    triggered++;
  }
  return { triggered, skipped };
}
