import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  decimal,
  boolean,
  date,
  json,
} from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Categorias de transações (Alimentação, Moradia, Lazer, Salário, etc)
 */
export const categories = mysqlTable("categories", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  type: mysqlEnum("type", ["income", "expense"]).notNull(),
  color: varchar("color", { length: 7 }).default("#3b82f6"),
  icon: varchar("icon", { length: 50 }),
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Category = typeof categories.$inferSelect;
export type InsertCategory = typeof categories.$inferInsert;

/**
 * Contas bancárias e de investimento
 */
export const accounts = mysqlTable("accounts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  type: mysqlEnum("type", ["checking", "savings", "investment", "credit_card", "other"]).notNull(),
  currency: mysqlEnum("currency", ["BRL", "USD", "EUR"]).default("BRL").notNull(),
  balance: decimal("balance", { precision: 15, scale: 2 }).default("0"),
  initialBalance: decimal("initialBalance", { precision: 15, scale: 2 }).default("0"),
  isActive: boolean("isActive").default(true),
  bankName: varchar("bankName", { length: 100 }),
  accountNumber: varchar("accountNumber", { length: 50 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Account = typeof accounts.$inferSelect;
export type InsertAccount = typeof accounts.$inferInsert;

/**
 * Transações financeiras
 */
export const transactions = mysqlTable("transactions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  accountId: int("accountId").notNull(),
  categoryId: int("categoryId"),
  projectId: int("projectId"),
  contactId: int("contactId"),
  description: varchar("description", { length: 255 }).notNull(),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  type: mysqlEnum("type", ["income", "expense"]).notNull(),
  date: date("date").notNull(),
  status: mysqlEnum("status", ["pending", "completed", "cancelled"]).default("completed"),
  notes: text("notes"),
  attachments: json("attachments"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = typeof transactions.$inferInsert;

/**
 * Investimentos (ações, fundos, criptomoedas, etc)
 */
export const investments = mysqlTable("investments", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  accountId: int("accountId").notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  ticker: varchar("ticker", { length: 20 }),
  type: mysqlEnum("type", [
    "stock",
    "etf",
    "fund",
    "fii",
    "bond",
    "crypto",
    "real_estate",
    "other",
  ]).notNull(),
  quantity: decimal("quantity", { precision: 15, scale: 6 }).notNull(),
  averagePrice: decimal("averagePrice", { precision: 15, scale: 4 }).notNull(),
  currentPrice: decimal("currentPrice", { precision: 15, scale: 4 }),
  totalCost: decimal("totalCost", { precision: 15, scale: 2 }).notNull(),
  currentValue: decimal("currentValue", { precision: 15, scale: 2 }),
  currency: mysqlEnum("currency", ["BRL", "USD", "EUR"]).default("BRL").notNull(),
  purchaseDate: date("purchaseDate").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Investment = typeof investments.$inferSelect;
export type InsertInvestment = typeof investments.$inferInsert;

/**
 * Metas financeiras (orçamento, economia, investimento)
 */
export const goals = mysqlTable("goals", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  categoryId: int("categoryId"),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  type: mysqlEnum("type", ["budget", "savings", "investment"]).notNull(),
  targetAmount: decimal("targetAmount", { precision: 15, scale: 2 }).notNull(),
  currentAmount: decimal("currentAmount", { precision: 15, scale: 2 }).default("0"),
  currency: mysqlEnum("currency", ["BRL", "USD", "EUR"]).default("BRL").notNull(),
  startDate: date("startDate").notNull(),
  endDate: date("endDate"),
  priority: mysqlEnum("priority", ["low", "medium", "high"]).default("medium"),
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Goal = typeof goals.$inferSelect;
export type InsertGoal = typeof goals.$inferInsert;

/**
 * Centros de custos (para análise por departamento/projeto)
 */
export const costCenters = mysqlTable("costCenters", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  code: varchar("code", { length: 20 }).unique(),
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CostCenter = typeof costCenters.$inferSelect;
export type InsertCostCenter = typeof costCenters.$inferInsert;

/**
 * Projetos para alocação de receitas/despesas
 */
export const projects = mysqlTable("projects", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  status: mysqlEnum("status", ["active", "completed", "paused", "cancelled"]).default("active"),
  budget: decimal("budget", { precision: 15, scale: 2 }),
  spent: decimal("spent", { precision: 15, scale: 2 }).default("0"),
  currency: mysqlEnum("currency", ["BRL", "USD", "EUR"]).default("BRL").notNull(),
  startDate: date("startDate"),
  endDate: date("endDate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Project = typeof projects.$inferSelect;
export type InsertProject = typeof projects.$inferInsert;

/**
 * Contatos (pessoas/empresas para transações)
 */
export const contacts = mysqlTable("contacts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  email: varchar("email", { length: 100 }),
  phone: varchar("phone", { length: 20 }),
  type: mysqlEnum("type", ["person", "company"]).notNull(),
  category: varchar("category", { length: 50 }),
  notes: text("notes"),
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Contact = typeof contacts.$inferSelect;
export type InsertContact = typeof contacts.$inferInsert;

/**
 * Contas a pagar
 */
export const payables = mysqlTable("payables", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  contactId: int("contactId"),
  description: varchar("description", { length: 255 }).notNull(),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  currency: mysqlEnum("currency", ["BRL", "USD", "EUR"]).default("BRL").notNull(),
  dueDate: date("dueDate").notNull(),
  paidDate: date("paidDate"),
  status: mysqlEnum("status", ["pending", "paid", "overdue", "cancelled"]).default("pending"),
  categoryId: int("categoryId"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Payable = typeof payables.$inferSelect;
export type InsertPayable = typeof payables.$inferInsert;

/**
 * Contas a receber
 */
export const receivables = mysqlTable("receivables", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  contactId: int("contactId"),
  description: varchar("description", { length: 255 }).notNull(),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  currency: mysqlEnum("currency", ["BRL", "USD", "EUR"]).default("BRL").notNull(),
  dueDate: date("dueDate").notNull(),
  receivedDate: date("receivedDate"),
  status: mysqlEnum("status", ["pending", "received", "overdue", "cancelled"]).default("pending"),
  categoryId: int("categoryId"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Receivable = typeof receivables.$inferSelect;
export type InsertReceivable = typeof receivables.$inferInsert;

/**
 * Ativos (imóveis, veículos, etc)
 */
export const assets = mysqlTable("assets", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  type: mysqlEnum("type", ["real_estate", "vehicle", "jewelry", "art", "other"]).notNull(),
  description: text("description"),
  purchaseDate: date("purchaseDate"),
  purchasePrice: decimal("purchasePrice", { precision: 15, scale: 2 }),
  currentValue: decimal("currentValue", { precision: 15, scale: 2 }),
  currency: mysqlEnum("currency", ["BRL", "USD", "EUR"]).default("BRL").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Asset = typeof assets.$inferSelect;
export type InsertAsset = typeof assets.$inferInsert;

/**
 * Passivos (empréstimos, financiamentos, dívidas)
 */
export const liabilities = mysqlTable("liabilities", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  type: mysqlEnum("type", ["loan", "mortgage", "credit_card", "other"]).notNull(),
  description: text("description"),
  originalAmount: decimal("originalAmount", { precision: 15, scale: 2 }).notNull(),
  currentAmount: decimal("currentAmount", { precision: 15, scale: 2 }).notNull(),
  interestRate: decimal("interestRate", { precision: 5, scale: 2 }),
  startDate: date("startDate"),
  endDate: date("endDate"),
  currency: mysqlEnum("currency", ["BRL", "USD", "EUR"]).default("BRL").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Liability = typeof liabilities.$inferSelect;
export type InsertLiability = typeof liabilities.$inferInsert;

/**
 * Índices de mercado para comparação (CDI, IPCA, IBOVESPA, etc)
 */
export const marketIndices = mysqlTable("marketIndices", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 20 }).unique().notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  value: decimal("value", { precision: 15, scale: 4 }),
  date: date("date").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type MarketIndex = typeof marketIndices.$inferSelect;
export type InsertMarketIndex = typeof marketIndices.$inferInsert;

/**
 * Histórico de patrimônio para gráficos de evolução
 */
export const netWorthHistory = mysqlTable("netWorthHistory", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  totalAssets: decimal("totalAssets", { precision: 15, scale: 2 }).notNull(),
  totalLiabilities: decimal("totalLiabilities", { precision: 15, scale: 2 }).notNull(),
  netWorth: decimal("netWorth", { precision: 15, scale: 2 }).notNull(),
  currency: mysqlEnum("currency", ["BRL", "USD", "EUR"]).default("BRL").notNull(),
  date: date("date").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type NetWorthHistory = typeof netWorthHistory.$inferSelect;
export type InsertNetWorthHistory = typeof netWorthHistory.$inferInsert;