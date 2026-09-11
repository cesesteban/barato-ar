-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "vector";

-- CreateEnum
CREATE TYPE "Vertical" AS ENUM ('supermarket', 'delivery', 'pharmacy', 'beverages');

-- CreateEnum
CREATE TYPE "PriceSource" AS ENUM ('flyer', 'precios_claros', 'public_api', 'crowdsourced', 'scraped');

-- CreateEnum
CREATE TYPE "PromoType" AS ENUM ('unit', 'nx1', 'nxm', 'second_off', 'bundle_discount');

-- CreateEnum
CREATE TYPE "IngestionStatus" AS ENUM ('running', 'success', 'partial', 'failed');

-- CreateTable
CREATE TABLE "app_meta" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "version" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "app_meta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "email_verified" TIMESTAMP(3),
    "name" TEXT,
    "image" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "provider_account_id" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "session_token" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_tokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "chains" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "vertical" "Vertical" NOT NULL DEFAULT 'supermarket',
    "logo_url" TEXT,
    "website_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chains_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "zones" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "parent_id" TEXT,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "radius_km" DOUBLE PRECISION,

    CONSTRAINT "zones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stores" (
    "id" TEXT NOT NULL,
    "chain_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "address" TEXT,
    "zone_id" TEXT,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "is_virtual" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "normalized_name" TEXT NOT NULL,
    "brand" TEXT,
    "size" DOUBLE PRECISION,
    "unit" TEXT,
    "standard_size" DECIMAL(10,4),
    "standard_unit" TEXT,
    "packaging_flag" TEXT,
    "category" TEXT,
    "image_url" TEXT,
    "image_source_url" TEXT,
    "image_status" TEXT,
    "image_captured_at" TIMESTAMP(3),
    "ean_code" TEXT,
    "slug" TEXT NOT NULL,
    "canonical_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prices" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "previous_price" DECIMAL(10,2),
    "currency" TEXT NOT NULL DEFAULT 'ARS',
    "is_offer" BOOLEAN NOT NULL DEFAULT false,
    "discount_pct" DOUBLE PRECISION,
    "valid_from" TIMESTAMP(3) NOT NULL,
    "valid_to" TIMESTAMP(3),
    "source" "PriceSource" NOT NULL,
    "source_url" TEXT,
    "store_product_url" TEXT,
    "captured_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "promo_type" "PromoType" NOT NULL DEFAULT 'unit',
    "promo_buy_qty" INTEGER,
    "promo_pay_qty" INTEGER,
    "promo_second_discount_pct" DOUBLE PRECISION,
    "promo_description" TEXT,
    "price_per_unit" DECIMAL(10,4),
    "price_per_unit_eff" DECIMAL(10,4),
    "upvotes_cache" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "prices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "price_history" (
    "id" BIGSERIAL NOT NULL,
    "product_id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "captured_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "price_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "offers" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "product_id" TEXT,
    "chain_id" TEXT NOT NULL,
    "discount_pct" DOUBLE PRECISION,
    "badge" TEXT,
    "valid_from" TIMESTAMP(3) NOT NULL,
    "valid_to" TIMESTAMP(3),
    "source_url" TEXT,
    "upvotes" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "offers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "search_logs" (
    "id" BIGSERIAL NOT NULL,
    "query" TEXT NOT NULL,
    "zone_slug" TEXT,
    "results_count" INTEGER NOT NULL,
    "clicked_product_id" TEXT,
    "ip_hash" TEXT,
    "ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "search_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "normalizer_candidates" (
    "id" TEXT NOT NULL,
    "product_a_id" TEXT NOT NULL,
    "product_b_id" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "features" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "decided_by" TEXT,
    "decided_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "normalizer_candidates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "normalizer_rejects" (
    "id" TEXT NOT NULL,
    "product_a_id" TEXT NOT NULL,
    "product_b_id" TEXT NOT NULL,
    "reason" TEXT,
    "rejected_by" TEXT NOT NULL,
    "rejected_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "normalizer_rejects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ingestion_runs" (
    "id" TEXT NOT NULL,
    "chain_id" TEXT NOT NULL,
    "source" "PriceSource" NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finished_at" TIMESTAMP(3),
    "status" "IngestionStatus" NOT NULL DEFAULT 'running',
    "rows_ingested" INTEGER NOT NULL DEFAULT 0,
    "rows_skipped" INTEGER NOT NULL DEFAULT 0,
    "error_message" TEXT,
    "metadata" JSONB,

    CONSTRAINT "ingestion_runs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_provider_account_id_key" ON "accounts"("provider", "provider_account_id");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_session_token_key" ON "sessions"("session_token");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_token_key" ON "verification_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_identifier_token_key" ON "verification_tokens"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "chains_slug_key" ON "chains"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "zones_slug_key" ON "zones"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "stores_slug_key" ON "stores"("slug");

-- CreateIndex
CREATE INDEX "stores_chain_id_zone_id_idx" ON "stores"("chain_id", "zone_id");

-- CreateIndex
CREATE UNIQUE INDEX "products_ean_code_key" ON "products"("ean_code");

-- CreateIndex
CREATE UNIQUE INDEX "products_slug_key" ON "products"("slug");

-- CreateIndex
CREATE INDEX "products_normalized_name_idx" ON "products"("normalized_name");

-- CreateIndex
CREATE INDEX "products_brand_idx" ON "products"("brand");

-- CreateIndex
CREATE INDEX "products_category_idx" ON "products"("category");

-- CreateIndex
CREATE INDEX "products_standard_unit_standard_size_idx" ON "products"("standard_unit", "standard_size");

-- CreateIndex
CREATE INDEX "products_canonical_id_idx" ON "products"("canonical_id");

-- CreateIndex
CREATE INDEX "prices_store_id_captured_at_idx" ON "prices"("store_id", "captured_at");

-- CreateIndex
CREATE INDEX "prices_product_id_captured_at_idx" ON "prices"("product_id", "captured_at");

-- CreateIndex
CREATE INDEX "prices_price_per_unit_eff_idx" ON "prices"("price_per_unit_eff");

-- CreateIndex
CREATE UNIQUE INDEX "prices_product_id_store_id_source_valid_from_key" ON "prices"("product_id", "store_id", "source", "valid_from");

-- CreateIndex
CREATE INDEX "price_history_product_id_store_id_captured_at_idx" ON "price_history"("product_id", "store_id", "captured_at");

-- CreateIndex
CREATE INDEX "offers_chain_id_valid_to_idx" ON "offers"("chain_id", "valid_to");

-- CreateIndex
CREATE INDEX "search_logs_query_ts_idx" ON "search_logs"("query", "ts");

-- CreateIndex
CREATE INDEX "normalizer_candidates_status_confidence_idx" ON "normalizer_candidates"("status", "confidence");

-- CreateIndex
CREATE UNIQUE INDEX "normalizer_candidates_product_a_id_product_b_id_key" ON "normalizer_candidates"("product_a_id", "product_b_id");

-- CreateIndex
CREATE UNIQUE INDEX "normalizer_rejects_product_a_id_product_b_id_key" ON "normalizer_rejects"("product_a_id", "product_b_id");

-- CreateIndex
CREATE INDEX "ingestion_runs_chain_id_started_at_idx" ON "ingestion_runs"("chain_id", "started_at");

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "zones" ADD CONSTRAINT "zones_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "zones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stores" ADD CONSTRAINT "stores_chain_id_fkey" FOREIGN KEY ("chain_id") REFERENCES "chains"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stores" ADD CONSTRAINT "stores_zone_id_fkey" FOREIGN KEY ("zone_id") REFERENCES "zones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_canonical_id_fkey" FOREIGN KEY ("canonical_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prices" ADD CONSTRAINT "prices_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prices" ADD CONSTRAINT "prices_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_history" ADD CONSTRAINT "price_history_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offers" ADD CONSTRAINT "offers_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offers" ADD CONSTRAINT "offers_chain_id_fkey" FOREIGN KEY ("chain_id") REFERENCES "chains"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ingestion_runs" ADD CONSTRAINT "ingestion_runs_chain_id_fkey" FOREIGN KEY ("chain_id") REFERENCES "chains"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

