-- Migration for advanced transactions system
-- Run this migration to add recurring transactions and status management features

-- Create new enums
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'transaction_status') THEN
    CREATE TYPE "transaction_status" AS ENUM('pending', 'scheduled', 'confirmed', 'reconciled');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'recurrence_type') THEN
    CREATE TYPE "recurrence_type" AS ENUM('single', 'installment', 'fixed');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'recurrence_frequency') THEN
    CREATE TYPE "recurrence_frequency" AS ENUM('daily', 'weekly', 'monthly', 'yearly');
  END IF;
END $$;

-- Add new columns to transactions table
ALTER TABLE "transactions"
ADD COLUMN IF NOT EXISTS "status" "transaction_status" DEFAULT 'pending';

ALTER TABLE "transactions"
ADD COLUMN IF NOT EXISTS "isRecurring" BOOLEAN DEFAULT false;

ALTER TABLE "transactions"
ADD COLUMN IF NOT EXISTS "recurrenceType" "recurrence_type";

ALTER TABLE "transactions"
ADD COLUMN IF NOT EXISTS "recurrenceFrequency" "recurrence_frequency";

ALTER TABLE "transactions"
ADD COLUMN IF NOT EXISTS "recurrenceInterval" INTEGER DEFAULT 1;

ALTER TABLE "transactions"
ADD COLUMN IF NOT EXISTS "installmentNumber" INTEGER;

ALTER TABLE "transactions"
ADD COLUMN IF NOT EXISTS "totalInstallments" INTEGER;

ALTER TABLE "transactions"
ADD COLUMN IF NOT EXISTS "parentTransactionId" INTEGER;

ALTER TABLE "transactions"
ADD COLUMN IF NOT EXISTS "documentNumber" VARCHAR(100);

ALTER TABLE "transactions"
ADD COLUMN IF NOT EXISTS "observations" TEXT;

ALTER TABLE "transactions"
ADD COLUMN IF NOT EXISTS "tags" TEXT;

-- Create index for parent transaction lookup
CREATE INDEX IF NOT EXISTS "idx_transactions_parent" ON "transactions" ("parentTransactionId");

-- Create index for status filtering
CREATE INDEX IF NOT EXISTS "idx_transactions_status" ON "transactions" ("status");

-- Create index for recurring transactions
CREATE INDEX IF NOT EXISTS "idx_transactions_recurring" ON "transactions" ("isRecurring") WHERE "isRecurring" = true;
