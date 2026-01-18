-- Migration for OFX Import feature
-- Run this on your production database

-- 1. Add fitId column to transactions table
ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "fitId" varchar(100);

-- 2. Create categoryMappings table
CREATE TABLE IF NOT EXISTS "categoryMappings" (
  "id" SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL,
  "pattern" VARCHAR(255) NOT NULL,
  "categoryId" INTEGER NOT NULL,
  "isActive" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL,
  "updatedAt" TIMESTAMP DEFAULT NOW() NOT NULL
);

-- 3. Create ofxImports table
CREATE TABLE IF NOT EXISTS "ofxImports" (
  "id" SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL,
  "accountId" INTEGER NOT NULL,
  "fileName" VARCHAR(255),
  "bankId" VARCHAR(50),
  "bankAccountId" VARCHAR(50),
  "transactionCount" INTEGER NOT NULL,
  "duplicateCount" INTEGER DEFAULT 0,
  "startDate" DATE,
  "endDate" DATE,
  "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL
);

-- 4. Create index on fitId for duplicate detection
CREATE INDEX IF NOT EXISTS "idx_transactions_fitId" ON "transactions" ("fitId");
CREATE INDEX IF NOT EXISTS "idx_transactions_account_fitId" ON "transactions" ("accountId", "fitId");

-- 5. Create index on categoryMappings for user lookup
CREATE INDEX IF NOT EXISTS "idx_categoryMappings_userId" ON "categoryMappings" ("userId");

-- 6. Create index on ofxImports for user lookup
CREATE INDEX IF NOT EXISTS "idx_ofxImports_userId" ON "ofxImports" ("userId");
