-- ============================================
-- Finance Control - Database Schema
-- PostgreSQL 14+
-- ============================================

-- Create database (run as superuser if needed)
-- CREATE DATABASE financecontrol;

-- Connect to database
-- \c financecontrol;

-- ============================================
-- ENUMS
-- ============================================

CREATE TYPE role AS ENUM ('user', 'admin');
CREATE TYPE category_type AS ENUM ('income', 'expense');
CREATE TYPE account_type AS ENUM ('checking', 'savings', 'investment', 'credit_card', 'other');
CREATE TYPE currency AS ENUM ('BRL', 'USD', 'EUR');
CREATE TYPE transaction_type AS ENUM ('income', 'expense');
CREATE TYPE transaction_status AS ENUM ('pending', 'completed', 'cancelled');
CREATE TYPE investment_type AS ENUM ('stock', 'etf', 'fund', 'fii', 'bond', 'crypto', 'real_estate', 'other');
CREATE TYPE goal_type AS ENUM ('budget', 'savings', 'investment');
CREATE TYPE priority AS ENUM ('low', 'medium', 'high');
CREATE TYPE project_status AS ENUM ('active', 'completed', 'paused', 'cancelled');
CREATE TYPE contact_type AS ENUM ('person', 'company');
CREATE TYPE payable_status AS ENUM ('pending', 'paid', 'overdue', 'cancelled');
CREATE TYPE receivable_status AS ENUM ('pending', 'received', 'overdue', 'cancelled');
CREATE TYPE asset_type AS ENUM ('real_estate', 'vehicle', 'jewelry', 'art', 'other');
CREATE TYPE liability_type AS ENUM ('loan', 'mortgage', 'credit_card', 'other');

-- ============================================
-- TABLES
-- ============================================

-- Users (authentication)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(320) NOT NULL UNIQUE,
    "passwordHash" VARCHAR(255) NOT NULL,
    name TEXT,
    role role NOT NULL DEFAULT 'user',
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "lastSignedIn" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Categories (income/expense categories)
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    "userId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    type category_type NOT NULL,
    color VARCHAR(7) DEFAULT '#3b82f6',
    icon VARCHAR(50),
    "isActive" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Accounts (bank accounts, wallets, etc)
CREATE TABLE accounts (
    id SERIAL PRIMARY KEY,
    "userId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    type account_type NOT NULL,
    currency currency NOT NULL DEFAULT 'BRL',
    balance DECIMAL(15, 2) DEFAULT 0,
    "initialBalance" DECIMAL(15, 2) DEFAULT 0,
    "isActive" BOOLEAN DEFAULT true,
    "bankName" VARCHAR(100),
    "accountNumber" VARCHAR(50),
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Transactions (income/expense records)
CREATE TABLE transactions (
    id SERIAL PRIMARY KEY,
    "userId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    "accountId" INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    "categoryId" INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    "projectId" INTEGER,
    "contactId" INTEGER,
    description VARCHAR(255) NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    type transaction_type NOT NULL,
    date DATE NOT NULL,
    status transaction_status DEFAULT 'completed',
    notes TEXT,
    attachments JSONB,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Investments (stocks, funds, crypto, etc)
CREATE TABLE investments (
    id SERIAL PRIMARY KEY,
    "userId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    "accountId" INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    ticker VARCHAR(20),
    type investment_type NOT NULL,
    quantity DECIMAL(15, 6) NOT NULL,
    "averagePrice" DECIMAL(15, 4) NOT NULL,
    "currentPrice" DECIMAL(15, 4),
    "totalCost" DECIMAL(15, 2) NOT NULL,
    "currentValue" DECIMAL(15, 2),
    currency currency NOT NULL DEFAULT 'BRL',
    "purchaseDate" DATE NOT NULL,
    notes TEXT,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Goals (financial goals)
CREATE TABLE goals (
    id SERIAL PRIMARY KEY,
    "userId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    "categoryId" INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    type goal_type NOT NULL,
    "targetAmount" DECIMAL(15, 2) NOT NULL,
    "currentAmount" DECIMAL(15, 2) DEFAULT 0,
    currency currency NOT NULL DEFAULT 'BRL',
    "startDate" DATE NOT NULL,
    "endDate" DATE,
    priority priority DEFAULT 'medium',
    "isActive" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Cost Centers (for departmental analysis)
CREATE TABLE "costCenters" (
    id SERIAL PRIMARY KEY,
    "userId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    code VARCHAR(20) UNIQUE,
    "isActive" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Projects (for revenue/expense allocation)
CREATE TABLE projects (
    id SERIAL PRIMARY KEY,
    "userId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    status project_status DEFAULT 'active',
    budget DECIMAL(15, 2),
    spent DECIMAL(15, 2) DEFAULT 0,
    currency currency NOT NULL DEFAULT 'BRL',
    "startDate" DATE,
    "endDate" DATE,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Contacts (people/companies for transactions)
CREATE TABLE contacts (
    id SERIAL PRIMARY KEY,
    "userId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    phone VARCHAR(20),
    type contact_type NOT NULL,
    category VARCHAR(50),
    notes TEXT,
    "isActive" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Payables (accounts payable)
CREATE TABLE payables (
    id SERIAL PRIMARY KEY,
    "userId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    "contactId" INTEGER REFERENCES contacts(id) ON DELETE SET NULL,
    description VARCHAR(255) NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    currency currency NOT NULL DEFAULT 'BRL',
    "dueDate" DATE NOT NULL,
    "paidDate" DATE,
    status payable_status DEFAULT 'pending',
    "categoryId" INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    notes TEXT,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Receivables (accounts receivable)
CREATE TABLE receivables (
    id SERIAL PRIMARY KEY,
    "userId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    "contactId" INTEGER REFERENCES contacts(id) ON DELETE SET NULL,
    description VARCHAR(255) NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    currency currency NOT NULL DEFAULT 'BRL',
    "dueDate" DATE NOT NULL,
    "receivedDate" DATE,
    status receivable_status DEFAULT 'pending',
    "categoryId" INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    notes TEXT,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Assets (real estate, vehicles, etc)
CREATE TABLE assets (
    id SERIAL PRIMARY KEY,
    "userId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    type asset_type NOT NULL,
    description TEXT,
    "purchaseDate" DATE,
    "purchasePrice" DECIMAL(15, 2),
    "currentValue" DECIMAL(15, 2),
    currency currency NOT NULL DEFAULT 'BRL',
    notes TEXT,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Liabilities (loans, mortgages, debts)
CREATE TABLE liabilities (
    id SERIAL PRIMARY KEY,
    "userId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    type liability_type NOT NULL,
    description TEXT,
    "originalAmount" DECIMAL(15, 2) NOT NULL,
    "currentAmount" DECIMAL(15, 2) NOT NULL,
    "interestRate" DECIMAL(5, 2),
    "startDate" DATE,
    "endDate" DATE,
    currency currency NOT NULL DEFAULT 'BRL',
    notes TEXT,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Market Indices (CDI, IPCA, IBOVESPA, etc)
CREATE TABLE "marketIndices" (
    id SERIAL PRIMARY KEY,
    code VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    value DECIMAL(15, 4),
    date DATE NOT NULL,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Net Worth History (for evolution charts)
CREATE TABLE "netWorthHistory" (
    id SERIAL PRIMARY KEY,
    "userId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    "totalAssets" DECIMAL(15, 2) NOT NULL,
    "totalLiabilities" DECIMAL(15, 2) NOT NULL,
    "netWorth" DECIMAL(15, 2) NOT NULL,
    currency currency NOT NULL DEFAULT 'BRL',
    date DATE NOT NULL,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================
-- INDEXES (for performance)
-- ============================================

-- Users
CREATE INDEX idx_users_email ON users(email);

-- Categories
CREATE INDEX idx_categories_userId ON categories("userId");
CREATE INDEX idx_categories_type ON categories(type);

-- Accounts
CREATE INDEX idx_accounts_userId ON accounts("userId");
CREATE INDEX idx_accounts_type ON accounts(type);

-- Transactions
CREATE INDEX idx_transactions_userId ON transactions("userId");
CREATE INDEX idx_transactions_accountId ON transactions("accountId");
CREATE INDEX idx_transactions_categoryId ON transactions("categoryId");
CREATE INDEX idx_transactions_date ON transactions(date);
CREATE INDEX idx_transactions_type ON transactions(type);

-- Investments
CREATE INDEX idx_investments_userId ON investments("userId");
CREATE INDEX idx_investments_accountId ON investments("accountId");
CREATE INDEX idx_investments_ticker ON investments(ticker);

-- Goals
CREATE INDEX idx_goals_userId ON goals("userId");
CREATE INDEX idx_goals_categoryId ON goals("categoryId");

-- Cost Centers
CREATE INDEX idx_costCenters_userId ON "costCenters"("userId");

-- Projects
CREATE INDEX idx_projects_userId ON projects("userId");
CREATE INDEX idx_projects_status ON projects(status);

-- Contacts
CREATE INDEX idx_contacts_userId ON contacts("userId");
CREATE INDEX idx_contacts_type ON contacts(type);

-- Payables
CREATE INDEX idx_payables_userId ON payables("userId");
CREATE INDEX idx_payables_dueDate ON payables("dueDate");
CREATE INDEX idx_payables_status ON payables(status);

-- Receivables
CREATE INDEX idx_receivables_userId ON receivables("userId");
CREATE INDEX idx_receivables_dueDate ON receivables("dueDate");
CREATE INDEX idx_receivables_status ON receivables(status);

-- Assets
CREATE INDEX idx_assets_userId ON assets("userId");
CREATE INDEX idx_assets_type ON assets(type);

-- Liabilities
CREATE INDEX idx_liabilities_userId ON liabilities("userId");
CREATE INDEX idx_liabilities_type ON liabilities(type);

-- Net Worth History
CREATE INDEX idx_netWorthHistory_userId ON "netWorthHistory"("userId");
CREATE INDEX idx_netWorthHistory_date ON "netWorthHistory"(date);

-- ============================================
-- FOREIGN KEYS (additional constraints)
-- ============================================

-- Add foreign key for transactions.projectId
ALTER TABLE transactions
    ADD CONSTRAINT fk_transactions_project
    FOREIGN KEY ("projectId") REFERENCES projects(id) ON DELETE SET NULL;

-- Add foreign key for transactions.contactId
ALTER TABLE transactions
    ADD CONSTRAINT fk_transactions_contact
    FOREIGN KEY ("contactId") REFERENCES contacts(id) ON DELETE SET NULL;

-- ============================================
-- TRIGGER: Auto-update updatedAt
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables with updatedAt
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_accounts_updated_at BEFORE UPDATE ON accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_investments_updated_at BEFORE UPDATE ON investments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_goals_updated_at BEFORE UPDATE ON goals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_costCenters_updated_at BEFORE UPDATE ON "costCenters" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON contacts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payables_updated_at BEFORE UPDATE ON payables FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_receivables_updated_at BEFORE UPDATE ON receivables FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_assets_updated_at BEFORE UPDATE ON assets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_liabilities_updated_at BEFORE UPDATE ON liabilities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_marketIndices_updated_at BEFORE UPDATE ON "marketIndices" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SAMPLE DATA (optional - remove in production)
-- ============================================

-- Insert sample market indices
INSERT INTO "marketIndices" (code, name, description, value, date) VALUES
    ('CDI', 'CDI', 'Certificado de Depósito Interbancário', 13.65, CURRENT_DATE),
    ('IPCA', 'IPCA', 'Índice Nacional de Preços ao Consumidor Amplo', 4.62, CURRENT_DATE),
    ('SELIC', 'SELIC', 'Sistema Especial de Liquidação e Custódia', 13.75, CURRENT_DATE),
    ('IBOV', 'IBOVESPA', 'Índice da Bolsa de Valores de São Paulo', 128500.00, CURRENT_DATE);

-- ============================================
-- GRANTS (adjust as needed)
-- ============================================

-- Example: Grant permissions to application user
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO finance_app;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO finance_app;
