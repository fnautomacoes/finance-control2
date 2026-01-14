import {
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  varchar,
  decimal,
  boolean,
  date,
  json,
  serial,
} from "drizzle-orm/pg-core";

// ==================== ENUMS ====================

export const roleEnum = pgEnum("role", ["user", "admin"]);
export const categoryTypeEnum = pgEnum("category_type", ["income", "expense"]);
export const accountTypeEnum = pgEnum("account_type", ["checking", "savings", "investment", "credit_card", "other"]);
export const currencyEnum = pgEnum("currency", ["BRL", "USD", "EUR"]);
export const transactionTypeEnum = pgEnum("transaction_type", ["income", "expense"]);
export const transactionStatusEnum = pgEnum("transaction_status", ["pending", "completed", "cancelled"]);
export const investmentTypeEnum = pgEnum("investment_type", [
  "stock",
  "etf",
  "fund",
  "fii",
  "bond",
  "crypto",
  "real_estate",
  "other",
]);
export const goalTypeEnum = pgEnum("goal_type", ["budget", "savings", "investment"]);
export const priorityEnum = pgEnum("priority", ["low", "medium", "high"]);
export const projectStatusEnum = pgEnum("project_status", ["active", "completed", "paused", "cancelled"]);
export const contactTypeEnum = pgEnum("contact_type", ["person", "company"]);
export const payableStatusEnum = pgEnum("payable_status", ["pending", "paid", "overdue", "cancelled"]);
export const receivableStatusEnum = pgEnum("receivable_status", ["pending", "received", "overdue", "cancelled"]);
export const assetTypeEnum = pgEnum("asset_type", ["real_estate", "vehicle", "jewelry", "art", "other"]);
export const liabilityTypeEnum = pgEnum("liability_type", ["loan", "mortgage", "credit_card", "other"]);

// ==================== TABLES ====================

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = pgTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: serial("id").primaryKey(),
  /** Unique email identifier for login */
  email: varchar("email", { length: 320 }).notNull().unique(),
  /** Hashed password using bcrypt */
  passwordHash: varchar("passwordHash", { length: 255 }).notNull(),
  name: text("name"),
  role: roleEnum("role").default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Categorias de transações (Alimentação, Moradia, Lazer, Salário, etc)
 */
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  type: categoryTypeEnum("type").notNull(),
  color: varchar("color", { length: 7 }).default("#3b82f6"),
  icon: varchar("icon", { length: 50 }),
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Category = typeof categories.$inferSelect;
export type InsertCategory = typeof categories.$inferInsert;

/**
 * Contas bancárias e de investimento
 */
export const accounts = pgTable("accounts", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  type: accountTypeEnum("type").notNull(),
  currency: currencyEnum("currency").default("BRL").notNull(),
  balance: decimal("balance", { precision: 15, scale: 2 }).default("0"),
  initialBalance: decimal("initialBalance", { precision: 15, scale: 2 }).default("0"),
  isActive: boolean("isActive").default(true),
  bankName: varchar("bankName", { length: 100 }),
  accountNumber: varchar("accountNumber", { length: 50 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Account = typeof accounts.$inferSelect;
export type InsertAccount = typeof accounts.$inferInsert;

/**
 * Transações financeiras
 */
export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  accountId: integer("accountId").notNull(),
  categoryId: integer("categoryId"),
  projectId: integer("projectId"),
  contactId: integer("contactId"),
  description: varchar("description", { length: 255 }).notNull(),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  type: transactionTypeEnum("type").notNull(),
  date: date("date").notNull(),
  status: transactionStatusEnum("status").default("completed"),
  notes: text("notes"),
  attachments: json("attachments"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = typeof transactions.$inferInsert;

/**
 * Investimentos (ações, fundos, criptomoedas, etc)
 */
export const investments = pgTable("investments", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  accountId: integer("accountId").notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  ticker: varchar("ticker", { length: 20 }),
  type: investmentTypeEnum("type").notNull(),
  quantity: decimal("quantity", { precision: 15, scale: 6 }).notNull(),
  averagePrice: decimal("averagePrice", { precision: 15, scale: 4 }).notNull(),
  currentPrice: decimal("currentPrice", { precision: 15, scale: 4 }),
  totalCost: decimal("totalCost", { precision: 15, scale: 2 }).notNull(),
  currentValue: decimal("currentValue", { precision: 15, scale: 2 }),
  currency: currencyEnum("currency").default("BRL").notNull(),
  purchaseDate: date("purchaseDate").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Investment = typeof investments.$inferSelect;
export type InsertInvestment = typeof investments.$inferInsert;

/**
 * Metas financeiras (orçamento, economia, investimento)
 */
export const goals = pgTable("goals", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  categoryId: integer("categoryId"),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  type: goalTypeEnum("type").notNull(),
  targetAmount: decimal("targetAmount", { precision: 15, scale: 2 }).notNull(),
  currentAmount: decimal("currentAmount", { precision: 15, scale: 2 }).default("0"),
  currency: currencyEnum("currency").default("BRL").notNull(),
  startDate: date("startDate").notNull(),
  endDate: date("endDate"),
  priority: priorityEnum("priority").default("medium"),
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Goal = typeof goals.$inferSelect;
export type InsertGoal = typeof goals.$inferInsert;

/**
 * Centros de custos (para análise por departamento/projeto)
 */
export const costCenters = pgTable("costCenters", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  code: varchar("code", { length: 20 }).unique(),
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type CostCenter = typeof costCenters.$inferSelect;
export type InsertCostCenter = typeof costCenters.$inferInsert;

/**
 * Projetos para alocação de receitas/despesas
 */
export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  status: projectStatusEnum("status").default("active"),
  budget: decimal("budget", { precision: 15, scale: 2 }),
  spent: decimal("spent", { precision: 15, scale: 2 }).default("0"),
  currency: currencyEnum("currency").default("BRL").notNull(),
  startDate: date("startDate"),
  endDate: date("endDate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Project = typeof projects.$inferSelect;
export type InsertProject = typeof projects.$inferInsert;

/**
 * Contatos (pessoas/empresas para transações)
 */
export const contacts = pgTable("contacts", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  email: varchar("email", { length: 100 }),
  phone: varchar("phone", { length: 20 }),
  type: contactTypeEnum("type").notNull(),
  category: varchar("category", { length: 50 }),
  notes: text("notes"),
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Contact = typeof contacts.$inferSelect;
export type InsertContact = typeof contacts.$inferInsert;

/**
 * Contas a pagar
 */
export const payables = pgTable("payables", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  contactId: integer("contactId"),
  description: varchar("description", { length: 255 }).notNull(),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  currency: currencyEnum("currency").default("BRL").notNull(),
  dueDate: date("dueDate").notNull(),
  paidDate: date("paidDate"),
  status: payableStatusEnum("status").default("pending"),
  categoryId: integer("categoryId"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Payable = typeof payables.$inferSelect;
export type InsertPayable = typeof payables.$inferInsert;

/**
 * Contas a receber
 */
export const receivables = pgTable("receivables", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  contactId: integer("contactId"),
  description: varchar("description", { length: 255 }).notNull(),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  currency: currencyEnum("currency").default("BRL").notNull(),
  dueDate: date("dueDate").notNull(),
  receivedDate: date("receivedDate"),
  status: receivableStatusEnum("status").default("pending"),
  categoryId: integer("categoryId"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Receivable = typeof receivables.$inferSelect;
export type InsertReceivable = typeof receivables.$inferInsert;

/**
 * Ativos (imóveis, veículos, etc)
 */
export const assets = pgTable("assets", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  type: assetTypeEnum("type").notNull(),
  description: text("description"),
  purchaseDate: date("purchaseDate"),
  purchasePrice: decimal("purchasePrice", { precision: 15, scale: 2 }),
  currentValue: decimal("currentValue", { precision: 15, scale: 2 }),
  currency: currencyEnum("currency").default("BRL").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Asset = typeof assets.$inferSelect;
export type InsertAsset = typeof assets.$inferInsert;

/**
 * Passivos (empréstimos, financiamentos, dívidas)
 */
export const liabilities = pgTable("liabilities", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  type: liabilityTypeEnum("type").notNull(),
  description: text("description"),
  originalAmount: decimal("originalAmount", { precision: 15, scale: 2 }).notNull(),
  currentAmount: decimal("currentAmount", { precision: 15, scale: 2 }).notNull(),
  interestRate: decimal("interestRate", { precision: 5, scale: 2 }),
  startDate: date("startDate"),
  endDate: date("endDate"),
  currency: currencyEnum("currency").default("BRL").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Liability = typeof liabilities.$inferSelect;
export type InsertLiability = typeof liabilities.$inferInsert;

/**
 * Índices de mercado para comparação (CDI, IPCA, IBOVESPA, etc)
 */
export const marketIndices = pgTable("marketIndices", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 20 }).unique().notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  value: decimal("value", { precision: 15, scale: 4 }),
  date: date("date").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type MarketIndex = typeof marketIndices.$inferSelect;
export type InsertMarketIndex = typeof marketIndices.$inferInsert;

/**
 * Histórico de patrimônio para gráficos de evolução
 */
export const netWorthHistory = pgTable("netWorthHistory", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  totalAssets: decimal("totalAssets", { precision: 15, scale: 2 }).notNull(),
  totalLiabilities: decimal("totalLiabilities", { precision: 15, scale: 2 }).notNull(),
  netWorth: decimal("netWorth", { precision: 15, scale: 2 }).notNull(),
  currency: currencyEnum("currency").default("BRL").notNull(),
  date: date("date").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type NetWorthHistory = typeof netWorthHistory.$inferSelect;
export type InsertNetWorthHistory = typeof netWorthHistory.$inferInsert;
