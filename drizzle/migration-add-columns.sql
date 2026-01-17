-- Migration: Add new columns for CDI investments and credit card limits
-- Run this on your PostgreSQL database

-- Add creditLimit to accounts table
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS "creditLimit" DECIMAL(15, 2);

-- Add new columns to investments table
ALTER TABLE investments ADD COLUMN IF NOT EXISTS "maturityDate" DATE;
ALTER TABLE investments ADD COLUMN IF NOT EXISTS "cdiPercentage" DECIMAL(5, 2);
ALTER TABLE investments ADD COLUMN IF NOT EXISTS "fixedRate" DECIMAL(5, 2);
ALTER TABLE investments ADD COLUMN IF NOT EXISTS "institution" VARCHAR(100);

-- Add new investment types to enum (if not already exists)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'cdb' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'investment_type')) THEN
        ALTER TYPE investment_type ADD VALUE 'cdb';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'lci_lca' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'investment_type')) THEN
        ALTER TYPE investment_type ADD VALUE 'lci_lca';
    END IF;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- ==================== API TOKENS TABLE ====================
-- Create API Tokens table for REST API Bearer authentication
CREATE TABLE IF NOT EXISTS "apiTokens" (
    "id" SERIAL PRIMARY KEY,
    "userId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    "name" VARCHAR(100) NOT NULL,
    "token" VARCHAR(64) NOT NULL UNIQUE,
    "lastUsedAt" TIMESTAMP,
    "expiresAt" TIMESTAMP,
    "isActive" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL,
    "updatedAt" TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create indexes for faster token lookup
CREATE INDEX IF NOT EXISTS "idx_apiTokens_token" ON "apiTokens" ("token");
CREATE INDEX IF NOT EXISTS "idx_apiTokens_userId" ON "apiTokens" ("userId");
CREATE INDEX IF NOT EXISTS "idx_apiTokens_active" ON "apiTokens" ("isActive") WHERE "isActive" = true;

-- ==================== VERIFICATION ====================
-- Verify the changes
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'accounts' AND column_name = 'creditLimit';

SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'investments' AND column_name IN ('maturityDate', 'cdiPercentage', 'fixedRate', 'institution');

SELECT table_name FROM information_schema.tables WHERE table_name = 'apiTokens';
