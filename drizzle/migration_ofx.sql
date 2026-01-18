-- Migration for OFX Import feature and Category Hierarchy
-- Run this on your production database

-- 1. Add fitId column to transactions table
ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "fitId" varchar(100);

-- 2. Add parentId column to categories table for hierarchy support
ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "parentId" integer;

-- 3. Create categoryMappings table
CREATE TABLE IF NOT EXISTS "categoryMappings" (
  "id" SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL,
  "pattern" VARCHAR(255) NOT NULL,
  "categoryId" INTEGER NOT NULL,
  "isActive" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL,
  "updatedAt" TIMESTAMP DEFAULT NOW() NOT NULL
);

-- 4. Create ofxImports table
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

-- 5. Create index on fitId for duplicate detection
CREATE INDEX IF NOT EXISTS "idx_transactions_fitId" ON "transactions" ("fitId");
CREATE INDEX IF NOT EXISTS "idx_transactions_account_fitId" ON "transactions" ("accountId", "fitId");

-- 6. Create index on categoryMappings for user lookup
CREATE INDEX IF NOT EXISTS "idx_categoryMappings_userId" ON "categoryMappings" ("userId");

-- 7. Create index on ofxImports for user lookup
CREATE INDEX IF NOT EXISTS "idx_ofxImports_userId" ON "ofxImports" ("userId");

-- 8. Create index on categories parentId for hierarchy queries
CREATE INDEX IF NOT EXISTS "idx_categories_parentId" ON "categories" ("parentId");
CREATE INDEX IF NOT EXISTS "idx_categories_userId_parentId" ON "categories" ("userId", "parentId");
