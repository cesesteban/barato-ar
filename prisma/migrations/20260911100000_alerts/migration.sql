-- CreateEnum
CREATE TYPE "AlertStatus" AS ENUM ('pending', 'active', 'notified', 'cancelled', 'bounced');

-- DropIndex
DROP INDEX "idx_products_name_trgm";

-- DropIndex
DROP INDEX "idx_search_logs_ts";

-- CreateTable
CREATE TABLE "alerts" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "target_price" DECIMAL(10,2) NOT NULL,
    "zone_slug" TEXT NOT NULL,
    "status" "AlertStatus" NOT NULL DEFAULT 'pending',
    "verify_token_hash" TEXT NOT NULL,
    "unsub_token_hash" TEXT NOT NULL,
    "verified_at" TIMESTAMP(3),
    "notified_at" TIMESTAMP(3),
    "cancelled_at" TIMESTAMP(3),
    "ip_hash" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_events" (
    "id" BIGSERIAL NOT NULL,
    "alert_id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "metadata" JSONB,
    "ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "alerts_verify_token_hash_key" ON "alerts"("verify_token_hash");

-- CreateIndex
CREATE UNIQUE INDEX "alerts_unsub_token_hash_key" ON "alerts"("unsub_token_hash");

-- CreateIndex
CREATE INDEX "alerts_status_verified_at_idx" ON "alerts"("status", "verified_at");

-- CreateIndex
CREATE INDEX "alerts_email_idx" ON "alerts"("email");

-- CreateIndex
CREATE UNIQUE INDEX "alerts_email_product_id_target_price_key" ON "alerts"("email", "product_id", "target_price");

-- CreateIndex
CREATE INDEX "email_events_alert_id_ts_idx" ON "email_events"("alert_id", "ts");

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_events" ADD CONSTRAINT "email_events_alert_id_fkey" FOREIGN KEY ("alert_id") REFERENCES "alerts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

