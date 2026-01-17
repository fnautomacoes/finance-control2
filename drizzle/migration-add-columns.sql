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

-- Verify the changes
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'accounts' AND column_name = 'creditLimit';

SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'investments' AND column_name IN ('maturityDate', 'cdiPercentage', 'fixedRate', 'institution');
