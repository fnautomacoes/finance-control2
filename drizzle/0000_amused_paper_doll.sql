CREATE TYPE "public"."account_type" AS ENUM('checking', 'savings', 'investment', 'credit_card', 'other');--> statement-breakpoint
CREATE TYPE "public"."asset_type" AS ENUM('real_estate', 'vehicle', 'jewelry', 'art', 'other');--> statement-breakpoint
CREATE TYPE "public"."category_type" AS ENUM('income', 'expense');--> statement-breakpoint
CREATE TYPE "public"."contact_type" AS ENUM('person', 'company');--> statement-breakpoint
CREATE TYPE "public"."currency" AS ENUM('BRL', 'USD', 'EUR');--> statement-breakpoint
CREATE TYPE "public"."goal_type" AS ENUM('budget', 'savings', 'investment');--> statement-breakpoint
CREATE TYPE "public"."investment_type" AS ENUM('stock', 'etf', 'fund', 'fii', 'bond', 'cdb', 'lci_lca', 'crypto', 'real_estate', 'other');--> statement-breakpoint
CREATE TYPE "public"."liability_type" AS ENUM('loan', 'mortgage', 'credit_card', 'other');--> statement-breakpoint
CREATE TYPE "public"."payable_status" AS ENUM('pending', 'paid', 'overdue', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."priority" AS ENUM('low', 'medium', 'high');--> statement-breakpoint
CREATE TYPE "public"."project_status" AS ENUM('active', 'completed', 'paused', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."receivable_status" AS ENUM('pending', 'received', 'overdue', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('user', 'admin');--> statement-breakpoint
CREATE TYPE "public"."transaction_status" AS ENUM('pending', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."transaction_type" AS ENUM('income', 'expense');--> statement-breakpoint
CREATE TABLE "accounts" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"type" "account_type" NOT NULL,
	"currency" "currency" DEFAULT 'BRL' NOT NULL,
	"balance" numeric(15, 2) DEFAULT '0',
	"initialBalance" numeric(15, 2) DEFAULT '0',
	"creditLimit" numeric(15, 2),
	"isActive" boolean DEFAULT true,
	"bankName" varchar(100),
	"accountNumber" varchar(50),
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "assets" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"name" varchar(100) NOT NULL,
	"type" "asset_type" NOT NULL,
	"description" text,
	"purchaseDate" date,
	"purchasePrice" numeric(15, 2),
	"currentValue" numeric(15, 2),
	"currency" "currency" DEFAULT 'BRL' NOT NULL,
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"type" "category_type" NOT NULL,
	"color" varchar(7) DEFAULT '#3b82f6',
	"icon" varchar(50),
	"isActive" boolean DEFAULT true,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contacts" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"name" varchar(100) NOT NULL,
	"email" varchar(100),
	"phone" varchar(20),
	"type" "contact_type" NOT NULL,
	"category" varchar(50),
	"notes" text,
	"isActive" boolean DEFAULT true,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "costCenters" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"code" varchar(20),
	"isActive" boolean DEFAULT true,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "costCenters_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "goals" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"categoryId" integer,
	"name" varchar(100) NOT NULL,
	"description" text,
	"type" "goal_type" NOT NULL,
	"targetAmount" numeric(15, 2) NOT NULL,
	"currentAmount" numeric(15, 2) DEFAULT '0',
	"currency" "currency" DEFAULT 'BRL' NOT NULL,
	"startDate" date NOT NULL,
	"endDate" date,
	"priority" "priority" DEFAULT 'medium',
	"isActive" boolean DEFAULT true,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "investments" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"accountId" integer NOT NULL,
	"name" varchar(100) NOT NULL,
	"ticker" varchar(20),
	"type" "investment_type" NOT NULL,
	"quantity" numeric(15, 6) NOT NULL,
	"averagePrice" numeric(15, 4) NOT NULL,
	"currentPrice" numeric(15, 4),
	"totalCost" numeric(15, 2) NOT NULL,
	"currentValue" numeric(15, 2),
	"currency" "currency" DEFAULT 'BRL' NOT NULL,
	"purchaseDate" date NOT NULL,
	"maturityDate" date,
	"cdiPercentage" numeric(5, 2),
	"fixedRate" numeric(5, 2),
	"institution" varchar(100),
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "liabilities" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"name" varchar(100) NOT NULL,
	"type" "liability_type" NOT NULL,
	"description" text,
	"originalAmount" numeric(15, 2) NOT NULL,
	"currentAmount" numeric(15, 2) NOT NULL,
	"interestRate" numeric(5, 2),
	"startDate" date,
	"endDate" date,
	"currency" "currency" DEFAULT 'BRL' NOT NULL,
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "marketIndices" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(20) NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"value" numeric(15, 4),
	"date" date NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "marketIndices_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "netWorthHistory" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"totalAssets" numeric(15, 2) NOT NULL,
	"totalLiabilities" numeric(15, 2) NOT NULL,
	"netWorth" numeric(15, 2) NOT NULL,
	"currency" "currency" DEFAULT 'BRL' NOT NULL,
	"date" date NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payables" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"contactId" integer,
	"description" varchar(255) NOT NULL,
	"amount" numeric(15, 2) NOT NULL,
	"currency" "currency" DEFAULT 'BRL' NOT NULL,
	"dueDate" date NOT NULL,
	"paidDate" date,
	"status" "payable_status" DEFAULT 'pending',
	"categoryId" integer,
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"status" "project_status" DEFAULT 'active',
	"budget" numeric(15, 2),
	"spent" numeric(15, 2) DEFAULT '0',
	"currency" "currency" DEFAULT 'BRL' NOT NULL,
	"startDate" date,
	"endDate" date,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "receivables" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"contactId" integer,
	"description" varchar(255) NOT NULL,
	"amount" numeric(15, 2) NOT NULL,
	"currency" "currency" DEFAULT 'BRL' NOT NULL,
	"dueDate" date NOT NULL,
	"receivedDate" date,
	"status" "receivable_status" DEFAULT 'pending',
	"categoryId" integer,
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"accountId" integer NOT NULL,
	"categoryId" integer,
	"projectId" integer,
	"contactId" integer,
	"description" varchar(255) NOT NULL,
	"amount" numeric(15, 2) NOT NULL,
	"type" "transaction_type" NOT NULL,
	"date" date NOT NULL,
	"status" "transaction_status" DEFAULT 'completed',
	"notes" text,
	"attachments" json,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(320) NOT NULL,
	"passwordHash" varchar(255) NOT NULL,
	"name" text,
	"role" "role" DEFAULT 'user' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"lastSignedIn" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
