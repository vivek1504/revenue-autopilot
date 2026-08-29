-- CreateTable
CREATE TABLE "customers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "tier" TEXT NOT NULL DEFAULT 'standard',
    "lifetime_spend_paise" INTEGER NOT NULL DEFAULT 0,
    "total_orders" INTEGER NOT NULL DEFAULT 0,
    "first_purchase_date" TIMESTAMP(3),
    "last_purchase_date" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "price_paise" INTEGER NOT NULL,
    "description" TEXT,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "total_paise" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL,
    "completed_at" TIMESTAMP(3),
    "failure_reason" TEXT,
    "items" JSONB NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "carts" (
    "id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "items" JSONB NOT NULL,
    "total_paise" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL,
    "last_activity" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',

    CONSTRAINT "carts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recovery_opportunities" (
    "id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "idempotency_key" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "source_type" TEXT,
    "source_id" TEXT,
    "strategy_key" TEXT,
    "estimated_value_paise" INTEGER NOT NULL,
    "value_is_estimated" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "detected_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMP(3),

    CONSTRAINT "recovery_opportunities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recovery_offers" (
    "id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "opportunity_id" TEXT,
    "action_type" TEXT NOT NULL,
    "amount_paise" INTEGER NOT NULL,
    "discount_percent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "execution_mode" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "razorpay_payment_link_id" TEXT,
    "razorpay_order_id" TEXT,
    "opportunity_type" TEXT,
    "policy_verdict" TEXT,
    "ai_reason" TEXT,
    "ai_confidence_score" DOUBLE PRECISION,

    CONSTRAINT "recovery_offers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_settings" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE INDEX "orders_customer_id_idx" ON "orders"("customer_id");

-- CreateIndex
CREATE INDEX "orders_status_idx" ON "orders"("status");

-- CreateIndex
CREATE INDEX "orders_customer_id_status_created_at_idx" ON "orders"("customer_id", "status", "created_at");

-- CreateIndex
CREATE INDEX "carts_customer_id_idx" ON "carts"("customer_id");

-- CreateIndex
CREATE INDEX "carts_status_idx" ON "carts"("status");

-- CreateIndex
CREATE UNIQUE INDEX "recovery_opportunities_idempotency_key_key" ON "recovery_opportunities"("idempotency_key");

-- CreateIndex
CREATE INDEX "recovery_opportunities_customer_id_idx" ON "recovery_opportunities"("customer_id");

-- CreateIndex
CREATE INDEX "recovery_opportunities_status_idx" ON "recovery_opportunities"("status");

-- CreateIndex
CREATE INDEX "recovery_opportunities_type_idx" ON "recovery_opportunities"("type");

-- CreateIndex
CREATE INDEX "recovery_offers_customer_id_idx" ON "recovery_offers"("customer_id");

-- CreateIndex
CREATE INDEX "recovery_offers_opportunity_id_idx" ON "recovery_offers"("opportunity_id");

-- CreateIndex
CREATE INDEX "recovery_offers_razorpay_payment_link_id_idx" ON "recovery_offers"("razorpay_payment_link_id");

-- CreateIndex
CREATE INDEX "recovery_offers_status_idx" ON "recovery_offers"("status");

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "carts" ADD CONSTRAINT "carts_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recovery_opportunities" ADD CONSTRAINT "recovery_opportunities_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recovery_offers" ADD CONSTRAINT "recovery_offers_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recovery_offers" ADD CONSTRAINT "recovery_offers_opportunity_id_fkey" FOREIGN KEY ("opportunity_id") REFERENCES "recovery_opportunities"("id") ON DELETE SET NULL ON UPDATE CASCADE;
