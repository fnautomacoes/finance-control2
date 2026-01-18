import { eq, and, sql, gte, lte, desc, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import {
  InsertUser,
  users,
  categories,
  InsertCategory,
  accounts,
  InsertAccount,
  transactions,
  InsertTransaction,
  investments,
  InsertInvestment,
  goals,
  InsertGoal,
  contacts,
  InsertContact,
  payables,
  InsertPayable,
  receivables,
  InsertReceivable,
  assets,
  InsertAsset,
  liabilities,
  InsertLiability,
  costCenters,
  categoryMappings,
  InsertCategoryMapping,
  ofxImports,
  InsertOFXImport,
} from "../drizzle/schema";
let _db: ReturnType<typeof drizzle> | null = null;
let _pool: pg.Pool | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      console.log("[Database] Connecting to PostgreSQL...");
      console.log("[Database] DATABASE_URL:", process.env.DATABASE_URL?.replace(/:[^:@]+@/, ":****@")); // Mask password
      _pool = new pg.Pool({
        connectionString: process.env.DATABASE_URL,
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
      });

      // Test the connection
      const client = await _pool.connect();
      const testResult = await client.query('SELECT NOW() as now, current_database() as db');
      console.log("[Database] ✅ Connection successful!");
      console.log("[Database] 📅 Server time:", testResult.rows[0].now);
      console.log("[Database] 🗄️  Database:", testResult.rows[0].db);
      client.release();

      _db = drizzle(_pool);
    } catch (error) {
      console.error("[Database] ❌ Failed to connect:", error);
      _db = null;
      _pool = null;
    }
  }

  if (!_db) {
    console.warn("[Database] ⚠️ Database not available. DATABASE_URL:", process.env.DATABASE_URL ? "set" : "not set");
  }

  return _db;
}

/**
 * User operations
 */
export async function createUser(data: InsertUser) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(users).values(data).returning();
  return result[0];
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateUserLastSignIn(userId: number) {
  const db = await getDb();
  if (!db) return;

  await db.update(users)
    .set({ lastSignedIn: new Date() })
    .where(eq(users.id, userId));
}

/**
 * Categorias
 */
export async function getUserCategories(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(categories).where(eq(categories.userId, userId));
}

export async function createCategory(data: InsertCategory) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(categories).values(data).returning();
  return result[0];
}

export async function updateCategory(id: number, userId: number, data: Partial<InsertCategory>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db
    .update(categories)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(categories.id, id), eq(categories.userId, userId)))
    .returning();
  return result[0];
}

export async function deleteCategory(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .delete(categories)
    .where(and(eq(categories.id, id), eq(categories.userId, userId)));
  return { success: true };
}

/**
 * Contas
 */
export async function getUserAccounts(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(accounts).where(eq(accounts.userId, userId));
}

export async function createAccount(data: InsertAccount) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(accounts).values(data).returning();
  return result[0];
}

export async function updateAccount(id: number, userId: number, data: Partial<InsertAccount>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db
    .update(accounts)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(accounts.id, id), eq(accounts.userId, userId)))
    .returning();
  return result[0];
}

export async function deleteAccount(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .delete(accounts)
    .where(and(eq(accounts.id, id), eq(accounts.userId, userId)));
  return { success: true };
}

export async function getAccountById(accountId: number, userId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db
    .select()
    .from(accounts)
    .where(and(eq(accounts.id, accountId), eq(accounts.userId, userId)))
    .limit(1);
  return result[0] || null;
}

/**
 * Transações
 */
export async function getUserTransactions(userId: number, limit = 500) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(transactions)
    .where(eq(transactions.userId, userId))
    .orderBy(desc(transactions.date), desc(transactions.id))
    .limit(limit);
}

export async function createTransaction(data: InsertTransaction) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(transactions).values(data).returning();
  return result[0];
}

export async function updateTransaction(id: number, userId: number, data: Partial<InsertTransaction>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db
    .update(transactions)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(transactions.id, id), eq(transactions.userId, userId)))
    .returning();
  return result[0];
}

export async function deleteTransaction(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .delete(transactions)
    .where(and(eq(transactions.id, id), eq(transactions.userId, userId)));
  return { success: true };
}

export async function getTransactionsByAccount(accountId: number, userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(transactions)
    .where(and(eq(transactions.accountId, accountId), eq(transactions.userId, userId)));
}

/**
 * Investimentos
 */
export async function getUserInvestments(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(investments).where(eq(investments.userId, userId));
}

export async function createInvestment(data: InsertInvestment) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(investments).values(data).returning();
  return result[0];
}

export async function updateInvestment(id: number, userId: number, data: Partial<InsertInvestment>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db
    .update(investments)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(investments.id, id), eq(investments.userId, userId)))
    .returning();
  return result[0];
}

export async function deleteInvestment(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .delete(investments)
    .where(and(eq(investments.id, id), eq(investments.userId, userId)));
  return { success: true };
}

/**
 * Metas
 */
export async function getUserGoals(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(goals).where(eq(goals.userId, userId));
}

export async function createGoal(data: InsertGoal) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(goals).values(data).returning();
  return result[0];
}

export async function updateGoal(id: number, userId: number, data: Partial<InsertGoal>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db
    .update(goals)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(goals.id, id), eq(goals.userId, userId)))
    .returning();
  return result[0];
}

export async function deleteGoal(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .delete(goals)
    .where(and(eq(goals.id, id), eq(goals.userId, userId)));
  return { success: true };
}

/**
 * Contatos
 */
export async function getUserContacts(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(contacts).where(eq(contacts.userId, userId));
}

export async function createContact(data: InsertContact) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(contacts).values(data).returning();
  return result[0];
}

export async function updateContact(id: number, userId: number, data: Partial<InsertContact>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db
    .update(contacts)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(contacts.id, id), eq(contacts.userId, userId)))
    .returning();
  return result[0];
}

export async function deleteContact(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .delete(contacts)
    .where(and(eq(contacts.id, id), eq(contacts.userId, userId)));
  return { success: true };
}

/**
 * Contas a Pagar
 */
export async function getUserPayables(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(payables).where(eq(payables.userId, userId));
}

export async function createPayable(data: InsertPayable) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(payables).values(data).returning();
  return result[0];
}

export async function updatePayable(id: number, userId: number, data: Partial<InsertPayable>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db
    .update(payables)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(payables.id, id), eq(payables.userId, userId)))
    .returning();
  return result[0];
}

export async function deletePayable(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .delete(payables)
    .where(and(eq(payables.id, id), eq(payables.userId, userId)));
  return { success: true };
}

/**
 * Contas a Receber
 */
export async function getUserReceivables(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(receivables).where(eq(receivables.userId, userId));
}

export async function createReceivable(data: InsertReceivable) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(receivables).values(data).returning();
  return result[0];
}

export async function updateReceivable(id: number, userId: number, data: Partial<InsertReceivable>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db
    .update(receivables)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(receivables.id, id), eq(receivables.userId, userId)))
    .returning();
  return result[0];
}

export async function deleteReceivable(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .delete(receivables)
    .where(and(eq(receivables.id, id), eq(receivables.userId, userId)));
  return { success: true };
}

/**
 * Ativos
 */
export async function getUserAssets(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(assets).where(eq(assets.userId, userId));
}

export async function createAsset(data: InsertAsset) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(assets).values(data).returning();
  return result[0];
}

export async function updateAsset(id: number, userId: number, data: Partial<InsertAsset>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db
    .update(assets)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(assets.id, id), eq(assets.userId, userId)))
    .returning();
  return result[0];
}

export async function deleteAsset(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .delete(assets)
    .where(and(eq(assets.id, id), eq(assets.userId, userId)));
  return { success: true };
}

/**
 * Passivos
 */
export async function getUserLiabilities(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(liabilities).where(eq(liabilities.userId, userId));
}

export async function createLiability(data: InsertLiability) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(liabilities).values(data).returning();
  return result[0];
}

export async function updateLiability(id: number, userId: number, data: Partial<InsertLiability>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db
    .update(liabilities)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(liabilities.id, id), eq(liabilities.userId, userId)))
    .returning();
  return result[0];
}

export async function deleteLiability(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .delete(liabilities)
    .where(and(eq(liabilities.id, id), eq(liabilities.userId, userId)));
  return { success: true };
}

/**
 * Cost Centers
 */
export async function getUserCostCenters(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(costCenters).where(eq(costCenters.userId, userId));
}

export async function createCostCenter(data: { userId: number; name: string; description?: string; code?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(costCenters).values(data).returning();
  return result[0];
}

export async function updateCostCenter(id: number, userId: number, data: Partial<{ name: string; description: string; code: string; isActive: boolean }>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db
    .update(costCenters)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(costCenters.id, id), eq(costCenters.userId, userId)))
    .returning();
  return result[0];
}

export async function deleteCostCenter(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .delete(costCenters)
    .where(and(eq(costCenters.id, id), eq(costCenters.userId, userId)));
  return { success: true };
}

/**
 * Dashboard aggregations
 */
export async function getDashboardSummary(userId: number, startDate?: string, endDate?: string) {
  const db = await getDb();
  if (!db) {
    return {
      totalBalance: 0,
      totalInvestments: 0,
      totalAssets: 0,
      totalLiabilities: 0,
      activeGoals: 0,
      expensesByCategory: [],
      incomeByCategory: [],
      transactionsByMonth: [],
      cashResultsByAccount: [],
      recentTransactions: [],
    };
  }

  // Get date range (default: last 30 days)
  const end = endDate || new Date().toISOString().split("T")[0];
  const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  // Total balance from accounts
  const accountsData = await db
    .select({
      totalBalance: sql<string>`COALESCE(SUM(CAST(${accounts.balance} AS DECIMAL)), 0)`,
    })
    .from(accounts)
    .where(eq(accounts.userId, userId));

  // Total investments value
  const investmentsData = await db
    .select({
      totalValue: sql<string>`COALESCE(SUM(CAST(${investments.totalCost} AS DECIMAL)), 0)`,
    })
    .from(investments)
    .where(eq(investments.userId, userId));

  // Total assets value
  const assetsData = await db
    .select({
      totalValue: sql<string>`COALESCE(SUM(CAST(${assets.currentValue} AS DECIMAL)), 0)`,
    })
    .from(assets)
    .where(eq(assets.userId, userId));

  // Total liabilities
  const liabilitiesData = await db
    .select({
      totalValue: sql<string>`COALESCE(SUM(CAST(${liabilities.currentAmount} AS DECIMAL)), 0)`,
    })
    .from(liabilities)
    .where(eq(liabilities.userId, userId));

  // Active goals count
  const goalsData = await db
    .select({
      count: sql<number>`COUNT(*)`,
    })
    .from(goals)
    .where(and(eq(goals.userId, userId), eq(goals.isActive, true)));

  // Expenses by category
  const expensesByCat = await db
    .select({
      categoryId: transactions.categoryId,
      categoryName: categories.name,
      categoryColor: categories.color,
      total: sql<string>`SUM(CAST(${transactions.amount} AS DECIMAL))`,
    })
    .from(transactions)
    .leftJoin(categories, eq(transactions.categoryId, categories.id))
    .where(
      and(
        eq(transactions.userId, userId),
        eq(transactions.type, "expense"),
        gte(transactions.date, start),
        lte(transactions.date, end)
      )
    )
    .groupBy(transactions.categoryId, categories.name, categories.color);

  // Income by category
  const incomeByCat = await db
    .select({
      categoryId: transactions.categoryId,
      categoryName: categories.name,
      categoryColor: categories.color,
      total: sql<string>`SUM(CAST(${transactions.amount} AS DECIMAL))`,
    })
    .from(transactions)
    .leftJoin(categories, eq(transactions.categoryId, categories.id))
    .where(
      and(
        eq(transactions.userId, userId),
        eq(transactions.type, "income"),
        gte(transactions.date, start),
        lte(transactions.date, end)
      )
    )
    .groupBy(transactions.categoryId, categories.name, categories.color);

  // Transactions by month (last 6 months)
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  const transactionsByMonth = await db
    .select({
      month: sql<string>`TO_CHAR(${transactions.date}::date, 'YYYY-MM')`,
      income: sql<string>`COALESCE(SUM(CASE WHEN ${transactions.type} = 'income' THEN CAST(${transactions.amount} AS DECIMAL) ELSE 0 END), 0)`,
      expense: sql<string>`COALESCE(SUM(CASE WHEN ${transactions.type} = 'expense' THEN CAST(${transactions.amount} AS DECIMAL) ELSE 0 END), 0)`,
    })
    .from(transactions)
    .where(
      and(
        eq(transactions.userId, userId),
        gte(transactions.date, sixMonthsAgo.toISOString().split("T")[0])
      )
    )
    .groupBy(sql`TO_CHAR(${transactions.date}::date, 'YYYY-MM')`)
    .orderBy(sql`TO_CHAR(${transactions.date}::date, 'YYYY-MM')`);

  // Cash results by account
  const cashResultsByAccount = await db
    .select({
      accountId: transactions.accountId,
      accountName: accounts.name,
      income: sql<string>`COALESCE(SUM(CASE WHEN ${transactions.type} = 'income' THEN CAST(${transactions.amount} AS DECIMAL) ELSE 0 END), 0)`,
      expense: sql<string>`COALESCE(SUM(CASE WHEN ${transactions.type} = 'expense' THEN CAST(${transactions.amount} AS DECIMAL) ELSE 0 END), 0)`,
    })
    .from(transactions)
    .innerJoin(accounts, eq(transactions.accountId, accounts.id))
    .where(
      and(
        eq(transactions.userId, userId),
        gte(transactions.date, start),
        lte(transactions.date, end)
      )
    )
    .groupBy(transactions.accountId, accounts.name);

  // Recent transactions (last 10)
  const recentTx = await db
    .select({
      id: transactions.id,
      description: transactions.description,
      amount: transactions.amount,
      type: transactions.type,
      date: transactions.date,
      categoryName: categories.name,
      accountName: accounts.name,
    })
    .from(transactions)
    .leftJoin(categories, eq(transactions.categoryId, categories.id))
    .innerJoin(accounts, eq(transactions.accountId, accounts.id))
    .where(eq(transactions.userId, userId))
    .orderBy(desc(transactions.date), desc(transactions.id))
    .limit(10);

  // Credit card accounts with their info
  const creditCards = await db
    .select()
    .from(accounts)
    .where(and(eq(accounts.userId, userId), eq(accounts.type, "credit_card")));

  // Goals with progress
  const goalsWithProgress = await db
    .select({
      id: goals.id,
      name: goals.name,
      type: goals.type,
      targetAmount: goals.targetAmount,
      currentAmount: goals.currentAmount,
      categoryId: goals.categoryId,
      categoryName: categories.name,
    })
    .from(goals)
    .leftJoin(categories, eq(goals.categoryId, categories.id))
    .where(and(eq(goals.userId, userId), eq(goals.isActive, true)));

  return {
    totalBalance: parseFloat(accountsData[0]?.totalBalance || "0"),
    totalInvestments: parseFloat(investmentsData[0]?.totalValue || "0"),
    totalAssets: parseFloat(assetsData[0]?.totalValue || "0"),
    totalLiabilities: parseFloat(liabilitiesData[0]?.totalValue || "0"),
    activeGoals: Number(goalsData[0]?.count || 0),
    expensesByCategory: expensesByCat.map((e) => ({
      categoryId: e.categoryId,
      name: e.categoryName || "Sem categoria",
      color: e.categoryColor || "#6b7280",
      value: parseFloat(e.total || "0"),
    })),
    incomeByCategory: incomeByCat.map((i) => ({
      categoryId: i.categoryId,
      name: i.categoryName || "Sem categoria",
      color: i.categoryColor || "#10b981",
      value: parseFloat(i.total || "0"),
    })),
    transactionsByMonth: transactionsByMonth.map((t) => ({
      month: t.month,
      income: parseFloat(t.income || "0"),
      expense: parseFloat(t.expense || "0"),
      balance: parseFloat(t.income || "0") - parseFloat(t.expense || "0"),
    })),
    cashResultsByAccount: cashResultsByAccount.map((c) => ({
      accountId: c.accountId,
      accountName: c.accountName,
      income: parseFloat(c.income || "0"),
      expense: parseFloat(c.expense || "0"),
      result: parseFloat(c.income || "0") - parseFloat(c.expense || "0"),
    })),
    recentTransactions: recentTx.map((t) => ({
      id: t.id,
      description: t.description,
      amount: parseFloat(t.amount as string),
      type: t.type,
      date: t.date,
      categoryName: t.categoryName,
      accountName: t.accountName,
    })),
    creditCards: creditCards.map((cc) => ({
      id: cc.id,
      name: cc.name,
      bankName: cc.bankName,
      balance: parseFloat(cc.balance as string || "0"),
    })),
    goalsWithProgress: goalsWithProgress.map((g) => ({
      id: g.id,
      name: g.name,
      type: g.type,
      targetAmount: parseFloat(g.targetAmount as string || "0"),
      currentAmount: parseFloat(g.currentAmount as string || "0"),
      categoryName: g.categoryName,
      percentage: g.targetAmount
        ? Math.min(100, (parseFloat(g.currentAmount as string || "0") / parseFloat(g.targetAmount as string)) * 100)
        : 0,
    })),
  };
}

/**
 * OFX Import Functions
 */

// Get existing fitIds for an account to detect duplicates
export async function getExistingFitIds(accountId: number, userId: number): Promise<Set<string>> {
  console.log(`📋 [getExistingFitIds] Buscando fitIds existentes - Account: ${accountId}, User: ${userId}`);

  const db = await getDb();
  if (!db) {
    console.warn("⚠️ [getExistingFitIds] Database não disponível, retornando Set vazio");
    return new Set();
  }

  const result = await db
    .select({ fitId: transactions.fitId })
    .from(transactions)
    .where(
      and(
        eq(transactions.userId, userId),
        eq(transactions.accountId, accountId),
        sql`${transactions.fitId} IS NOT NULL`
      )
    );

  const fitIdSet = new Set(result.map((r) => r.fitId).filter((id): id is string => id !== null));
  console.log(`✅ [getExistingFitIds] Encontrados ${fitIdSet.size} fitIds existentes`);

  return fitIdSet;
}

// Bulk insert transactions from OFX import
export async function bulkInsertTransactions(
  transactionsData: InsertTransaction[]
): Promise<{ inserted: number }> {
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("📥 [bulkInsertTransactions] Iniciando inserção em lote");
  console.log("📊 Quantidade de transações:", transactionsData.length);

  const db = await getDb();
  if (!db) {
    console.error("❌ [bulkInsertTransactions] Database não disponível!");
    throw new Error("Database not available");
  }

  if (transactionsData.length === 0) {
    console.log("⚠️ [bulkInsertTransactions] Nenhuma transação para inserir");
    return { inserted: 0 };
  }

  // Log first transaction as sample
  console.log("📝 [bulkInsertTransactions] Exemplo de transação:");
  console.log(JSON.stringify(transactionsData[0], null, 2));

  try {
    console.log("💾 [bulkInsertTransactions] Executando INSERT...");
    const result = await db.insert(transactions).values(transactionsData).returning();
    console.log("✅ [bulkInsertTransactions] INSERT bem-sucedido!");
    console.log("🔢 Registros inseridos:", result.length);

    if (result.length > 0) {
      console.log("🆔 IDs gerados:", result.map(r => r.id).join(", "));
    }

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    return { inserted: result.length };
  } catch (error: any) {
    console.error("❌ [bulkInsertTransactions] ERRO ao inserir:");
    console.error("   Mensagem:", error.message);
    console.error("   Código:", error.code);
    console.error("   Detalhe:", error.detail);
    console.error("   Stack:", error.stack);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    throw error;
  }
}

// Update account balance after import
export async function updateAccountBalance(
  accountId: number,
  userId: number,
  balanceChange: number
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(accounts)
    .set({
      balance: sql`CAST(${accounts.balance} AS DECIMAL) + ${balanceChange}`,
      updatedAt: new Date(),
    })
    .where(and(eq(accounts.id, accountId), eq(accounts.userId, userId)));
}

// Create OFX import record
export async function createOFXImport(data: InsertOFXImport) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(ofxImports).values(data).returning();
  return result[0];
}

// Get OFX import history
export async function getUserOFXImports(userId: number, limit = 20) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(ofxImports)
    .where(eq(ofxImports.userId, userId))
    .orderBy(desc(ofxImports.createdAt))
    .limit(limit);
}

/**
 * Category Mapping Functions
 */

// Get user's category mappings
export async function getUserCategoryMappings(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(categoryMappings)
    .where(and(eq(categoryMappings.userId, userId), eq(categoryMappings.isActive, true)));
}

// Create category mapping
export async function createCategoryMapping(data: InsertCategoryMapping) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(categoryMappings).values(data).returning();
  return result[0];
}

// Update category mapping
export async function updateCategoryMapping(
  id: number,
  userId: number,
  data: Partial<InsertCategoryMapping>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .update(categoryMappings)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(categoryMappings.id, id), eq(categoryMappings.userId, userId)))
    .returning();
  return result[0];
}

// Delete category mapping
export async function deleteCategoryMapping(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .delete(categoryMappings)
    .where(and(eq(categoryMappings.id, id), eq(categoryMappings.userId, userId)));
  return { success: true };
}
