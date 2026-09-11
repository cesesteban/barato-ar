-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('pending', 'approved', 'rejected', 'auto_hidden', 're_review');

-- CreateTable
CREATE TABLE "reports" (
    "id" TEXT NOT NULL,
    "product_slug" TEXT,
    "product_text" TEXT,
    "chain_slug" TEXT NOT NULL,
    "store_text" TEXT,
    "store_id" TEXT,
    "price" DECIMAL(10,2) NOT NULL,
    "previous_price" DECIMAL(10,2),
    "valid_to" TIMESTAMP(3),
    "photo_url" TEXT,
    "photo_blob_key" TEXT,
    "description" TEXT,
    "ip_hash" TEXT NOT NULL,
    "status" "ReportStatus" NOT NULL DEFAULT 'pending',
    "reason_rejected" TEXT,
    "approved_by" TEXT,
    "approved_at" TIMESTAMP(3),
    "purged_at" TIMESTAMP(3),
    "upvotes" INTEGER NOT NULL DEFAULT 0,
    "downvotes" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_votes" (
    "id" TEXT NOT NULL,
    "report_id" TEXT NOT NULL,
    "ip_hash" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "report_votes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "reports_status_created_at_idx" ON "reports"("status", "created_at");

-- CreateIndex
CREATE INDEX "reports_ip_hash_created_at_idx" ON "reports"("ip_hash", "created_at");

-- CreateIndex
CREATE INDEX "report_votes_report_id_kind_idx" ON "report_votes"("report_id", "kind");

-- CreateIndex
CREATE UNIQUE INDEX "report_votes_report_id_ip_hash_key" ON "report_votes"("report_id", "ip_hash");

-- AddForeignKey
ALTER TABLE "report_votes" ADD CONSTRAINT "report_votes_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

