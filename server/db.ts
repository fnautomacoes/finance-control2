import { eq, and } from "drizzle-orm";
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
} from "../drizzle/schema";
let _db: ReturnType<typeof drizzle> | null = null;
let _pool: pg.Pool | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      console.log("[Database] Connecting to PostgreSQL...");
      _pool = new pg.Pool({
        connectionString: process.env.DATABASE_URL,
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
      });

      // Test the connection
      const client = await _pool.connect();
      console.log("[Database] Connection successful!");
      client.release();

      _db = drizzle(_pool);
    } catch (error) {
      console.error("[Database] Failed to connect:", error);
      _db = null;
      _pool = null;
    }
  }

  if (!_db) {
    console.warn("[Database] Database not available. DATABASE_URL:", process.env.DATABASE_URL ? "set" : "not set");
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
  return db.insert(categories).values(data);
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
  return db.insert(accounts).values(data);
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
export async function getUserTransactions(userId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(transactions)
    .where(eq(transactions.userId, userId))
    .limit(limit);
}

export async function createTransaction(data: InsertTransaction) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(transactions).values(data);
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
  return db.insert(investments).values(data);
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
  return db.insert(goals).values(data);
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
  return db.insert(contacts).values(data);
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
  return db.insert(payables).values(data);
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
  return db.insert(receivables).values(data);
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
  return db.insert(assets).values(data);
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
  return db.insert(liabilities).values(data);
}
