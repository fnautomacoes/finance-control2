/**
 * REST API para Finance Control
 *
 * Autenticação via Bearer Token
 *
 * Endpoints:
 * - POST /api/v1/transactions - Criar transação (receita ou despesa)
 * - GET /api/v1/transactions - Listar transações
 * - GET /api/v1/transactions/:id - Obter transação por ID
 * - PUT /api/v1/transactions/:id - Atualizar transação
 * - DELETE /api/v1/transactions/:id - Excluir transação
 * - POST /api/v1/tokens - Criar token de API (requer autenticação de sessão)
 * - GET /api/v1/tokens - Listar tokens do usuário
 * - DELETE /api/v1/tokens/:id - Revogar token
 */

import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import crypto from "crypto";
import { getDb } from "../db";
import { transactions, apiTokens, users, accounts, categories } from "../../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";

const router = Router();

// ==================== TIPOS ====================

interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    email: string;
  };
  tokenId?: number;
}

// ==================== SCHEMAS DE VALIDAÇÃO ====================

// Schema para criação de transação
const createTransactionSchema = z.object({
  // Campos obrigatórios
  description: z.string().min(1, "Descrição é obrigatória").max(255),
  amount: z.union([z.string(), z.number()]).transform((val) =>
    typeof val === "number" ? val.toString() : val
  ),
  type: z.enum(["income", "expense"], {
    errorMap: () => ({ message: "Tipo deve ser 'income' (receita) ou 'expense' (despesa)" }),
  }),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data deve estar no formato YYYY-MM-DD"),
  accountId: z.number().int().positive("ID da conta é obrigatório"),

  // Campos opcionais
  categoryId: z.number().int().positive().optional().nullable(),
  projectId: z.number().int().positive().optional().nullable(),
  contactId: z.number().int().positive().optional().nullable(),
  status: z.enum(["pending", "completed", "cancelled"]).default("completed"),
  notes: z.string().max(1000).optional().nullable(),
  attachments: z.any().optional().nullable(),
});

// Schema para atualização de transação
const updateTransactionSchema = createTransactionSchema.partial();

// Schema para criação de token
const createTokenSchema = z.object({
  name: z.string().min(1, "Nome do token é obrigatório").max(100),
  expiresInDays: z.number().int().positive().optional(), // Se não informado, não expira
});

// Schema para query de listagem
const listTransactionsQuerySchema = z.object({
  page: z.string().optional().transform((val) => (val ? parseInt(val) : 1)),
  limit: z.string().optional().transform((val) => (val ? Math.min(parseInt(val), 100) : 20)),
  type: z.enum(["income", "expense"]).optional(),
  status: z.enum(["pending", "completed", "cancelled"]).optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  accountId: z.string().optional().transform((val) => (val ? parseInt(val) : undefined)),
  categoryId: z.string().optional().transform((val) => (val ? parseInt(val) : undefined)),
});

// ==================== MIDDLEWARE DE AUTENTICAÇÃO ====================

async function bearerAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "Token de autenticação não fornecido. Use o header 'Authorization: Bearer <token>'",
      });
    }

    const token = authHeader.substring(7); // Remove "Bearer "

    if (!token || token.length < 32) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "Token de autenticação inválido",
      });
    }

    const db = await getDb();
    if (!db) {
      return res.status(503).json({
        error: "Service Unavailable",
        message: "Banco de dados não disponível",
      });
    }

    // Buscar token no banco
    const [apiToken] = await db
      .select()
      .from(apiTokens)
      .where(and(eq(apiTokens.token, token), eq(apiTokens.isActive, true)))
      .limit(1);

    if (!apiToken) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "Token de autenticação inválido ou revogado",
      });
    }

    // Verificar se o token expirou
    if (apiToken.expiresAt && new Date(apiToken.expiresAt) < new Date()) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "Token de autenticação expirado",
      });
    }

    // Buscar usuário
    const [user] = await db
      .select({ id: users.id, email: users.email })
      .from(users)
      .where(eq(users.id, apiToken.userId))
      .limit(1);

    if (!user) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "Usuário não encontrado",
      });
    }

    // Atualizar lastUsedAt do token
    await db
      .update(apiTokens)
      .set({ lastUsedAt: new Date() })
      .where(eq(apiTokens.id, apiToken.id));

    // Anexar usuário à requisição
    req.user = user;
    req.tokenId = apiToken.id;

    next();
  } catch (error) {
    console.error("[API] Auth error:", error);
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Erro interno de autenticação",
    });
  }
}

// Middleware que aceita Bearer token OU sessão (para UI de gerenciamento de tokens)
async function bearerOrSessionAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const sessionUser = (req as any).sessionUser;

  // Se tem sessão, usa ela
  if (sessionUser) {
    req.user = sessionUser;
    return next();
  }

  // Se tem Bearer token, valida ele
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return bearerAuth(req, res, next);
  }

  // Nenhuma autenticação válida
  return res.status(401).json({
    error: "Unauthorized",
    message: "Autenticação necessária. Faça login ou use um Bearer token.",
  });
}

// ==================== HELPERS ====================

function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

function handleValidationError(res: Response, error: z.ZodError) {
  return res.status(400).json({
    error: "Validation Error",
    message: "Dados inválidos",
    details: error.errors.map((e) => ({
      field: e.path.join("."),
      message: e.message,
    })),
  });
}

// ==================== ROTAS DE TOKENS ====================

/**
 * POST /api/v1/tokens
 * Criar novo token de API
 * Requer autenticação de sessão (cookie)
 */
router.post("/tokens", async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Verificar autenticação de sessão
    const sessionUser = (req as any).sessionUser;
    if (!sessionUser) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "Faça login para criar um token de API",
      });
    }

    const validation = createTokenSchema.safeParse(req.body);
    if (!validation.success) {
      return handleValidationError(res, validation.error);
    }

    const { name, expiresInDays } = validation.data;
    const token = generateToken();

    const db = await getDb();
    if (!db) {
      return res.status(503).json({
        error: "Service Unavailable",
        message: "Banco de dados não disponível",
      });
    }

    const expiresAt = expiresInDays
      ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
      : null;

    const [newToken] = await db
      .insert(apiTokens)
      .values({
        userId: sessionUser.id,
        name,
        token,
        expiresAt,
      })
      .returning();

    return res.status(201).json({
      success: true,
      data: {
        id: newToken.id,
        name: newToken.name,
        token: token, // Retorna o token apenas na criação
        expiresAt: newToken.expiresAt,
        createdAt: newToken.createdAt,
      },
      message: "Token criado com sucesso. Guarde-o em local seguro, pois não será exibido novamente.",
    });
  } catch (error: any) {
    console.error("[API] Create token error:", error);
    // Check if it's a table not found error
    if (error?.message?.includes("relation") && error?.message?.includes("does not exist")) {
      return res.status(500).json({
        error: "Database Error",
        message: "Tabela de tokens não encontrada. Execute a migração do banco de dados.",
      });
    }
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Erro ao criar token: " + (error?.message || "erro desconhecido"),
    });
  }
});

/**
 * GET /api/v1/tokens
 * Listar tokens do usuário
 * Aceita autenticação via sessão (UI) ou Bearer token
 */
router.get("/tokens", bearerOrSessionAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const db = await getDb();
    if (!db) {
      return res.status(503).json({ error: "Service Unavailable" });
    }

    const tokens = await db
      .select({
        id: apiTokens.id,
        name: apiTokens.name,
        lastUsedAt: apiTokens.lastUsedAt,
        expiresAt: apiTokens.expiresAt,
        isActive: apiTokens.isActive,
        createdAt: apiTokens.createdAt,
      })
      .from(apiTokens)
      .where(eq(apiTokens.userId, req.user!.id))
      .orderBy(desc(apiTokens.createdAt));

    return res.json({
      success: true,
      data: tokens,
    });
  } catch (error: any) {
    console.error("[API] List tokens error:", error);
    if (error?.message?.includes("relation") && error?.message?.includes("does not exist")) {
      return res.status(500).json({
        error: "Database Error",
        message: "Tabela de tokens não encontrada. Execute a migração do banco de dados.",
      });
    }
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Erro ao listar tokens: " + (error?.message || "erro desconhecido"),
    });
  }
});

/**
 * DELETE /api/v1/tokens/:id
 * Revogar token
 * Aceita autenticação via sessão (UI) ou Bearer token
 */
router.delete("/tokens/:id", bearerOrSessionAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tokenId = parseInt(req.params.id);
    if (isNaN(tokenId)) {
      return res.status(400).json({
        error: "Bad Request",
        message: "ID do token inválido",
      });
    }

    const db = await getDb();
    if (!db) {
      return res.status(503).json({ error: "Service Unavailable" });
    }

    const [token] = await db
      .select()
      .from(apiTokens)
      .where(and(eq(apiTokens.id, tokenId), eq(apiTokens.userId, req.user!.id)))
      .limit(1);

    if (!token) {
      return res.status(404).json({
        error: "Not Found",
        message: "Token não encontrado",
      });
    }

    await db
      .update(apiTokens)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(apiTokens.id, tokenId));

    return res.json({
      success: true,
      message: "Token revogado com sucesso",
    });
  } catch (error) {
    console.error("[API] Delete token error:", error);
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Erro ao revogar token",
    });
  }
});

// ==================== ROTAS DE TRANSAÇÕES ====================

/**
 * POST /api/v1/transactions
 * Criar nova transação (receita ou despesa)
 */
router.post("/transactions", bearerAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const validation = createTransactionSchema.safeParse(req.body);
    if (!validation.success) {
      return handleValidationError(res, validation.error);
    }

    const data = validation.data;
    const db = await getDb();
    if (!db) {
      return res.status(503).json({ error: "Service Unavailable" });
    }

    // Verificar se a conta existe e pertence ao usuário
    const [account] = await db
      .select()
      .from(accounts)
      .where(and(eq(accounts.id, data.accountId), eq(accounts.userId, req.user!.id)))
      .limit(1);

    if (!account) {
      return res.status(400).json({
        error: "Validation Error",
        message: "Conta não encontrada ou não pertence ao usuário",
        details: [{ field: "accountId", message: "Conta inválida" }],
      });
    }

    // Verificar categoria se fornecida
    if (data.categoryId) {
      const [category] = await db
        .select()
        .from(categories)
        .where(and(eq(categories.id, data.categoryId), eq(categories.userId, req.user!.id)))
        .limit(1);

      if (!category) {
        return res.status(400).json({
          error: "Validation Error",
          message: "Categoria não encontrada ou não pertence ao usuário",
          details: [{ field: "categoryId", message: "Categoria inválida" }],
        });
      }
    }

    // Criar transação
    const [newTransaction] = await db
      .insert(transactions)
      .values({
        userId: req.user!.id,
        accountId: data.accountId,
        categoryId: data.categoryId || null,
        projectId: data.projectId || null,
        contactId: data.contactId || null,
        description: data.description,
        amount: data.amount,
        type: data.type,
        date: data.date,
        status: data.status,
        notes: data.notes || null,
        attachments: data.attachments || null,
      })
      .returning();

    // Atualizar saldo da conta
    const currentBalance = parseFloat(account.balance as string || "0");
    const transactionAmount = parseFloat(data.amount);
    const newBalance =
      data.type === "income"
        ? currentBalance + transactionAmount
        : currentBalance - transactionAmount;

    await db
      .update(accounts)
      .set({ balance: newBalance.toString(), updatedAt: new Date() })
      .where(eq(accounts.id, data.accountId));

    return res.status(201).json({
      success: true,
      data: {
        id: newTransaction.id,
        description: newTransaction.description,
        amount: newTransaction.amount,
        type: newTransaction.type,
        date: newTransaction.date,
        status: newTransaction.status,
        accountId: newTransaction.accountId,
        categoryId: newTransaction.categoryId,
        projectId: newTransaction.projectId,
        contactId: newTransaction.contactId,
        notes: newTransaction.notes,
        createdAt: newTransaction.createdAt,
      },
      message: `${data.type === "income" ? "Receita" : "Despesa"} criada com sucesso`,
    });
  } catch (error) {
    console.error("[API] Create transaction error:", error);
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Erro ao criar transação",
    });
  }
});

/**
 * GET /api/v1/transactions
 * Listar transações com filtros e paginação
 */
router.get("/transactions", bearerAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const validation = listTransactionsQuerySchema.safeParse(req.query);
    if (!validation.success) {
      return handleValidationError(res, validation.error);
    }

    const { page, limit, type, status, startDate, endDate, accountId, categoryId } = validation.data;
    const offset = (page - 1) * limit;

    const db = await getDb();
    if (!db) {
      return res.status(503).json({ error: "Service Unavailable" });
    }

    // Construir condições de filtro
    const conditions = [eq(transactions.userId, req.user!.id)];

    if (type) {
      conditions.push(eq(transactions.type, type));
    }
    if (status) {
      conditions.push(eq(transactions.status, status));
    }
    if (accountId) {
      conditions.push(eq(transactions.accountId, accountId));
    }
    if (categoryId) {
      conditions.push(eq(transactions.categoryId, categoryId));
    }

    // Buscar transações
    const transactionList = await db
      .select({
        id: transactions.id,
        description: transactions.description,
        amount: transactions.amount,
        type: transactions.type,
        date: transactions.date,
        status: transactions.status,
        accountId: transactions.accountId,
        categoryId: transactions.categoryId,
        projectId: transactions.projectId,
        contactId: transactions.contactId,
        notes: transactions.notes,
        createdAt: transactions.createdAt,
        updatedAt: transactions.updatedAt,
      })
      .from(transactions)
      .where(and(...conditions))
      .orderBy(desc(transactions.date), desc(transactions.createdAt))
      .limit(limit)
      .offset(offset);

    // Filtrar por data (manualmente pois date é string)
    let filteredTransactions = transactionList;
    if (startDate) {
      filteredTransactions = filteredTransactions.filter((t) => t.date >= startDate);
    }
    if (endDate) {
      filteredTransactions = filteredTransactions.filter((t) => t.date <= endDate);
    }

    return res.json({
      success: true,
      data: filteredTransactions,
      pagination: {
        page,
        limit,
        total: filteredTransactions.length,
      },
    });
  } catch (error) {
    console.error("[API] List transactions error:", error);
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Erro ao listar transações",
    });
  }
});

/**
 * GET /api/v1/transactions/:id
 * Obter transação por ID
 */
router.get("/transactions/:id", bearerAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const transactionId = parseInt(req.params.id);
    if (isNaN(transactionId)) {
      return res.status(400).json({
        error: "Bad Request",
        message: "ID da transação inválido",
      });
    }

    const db = await getDb();
    if (!db) {
      return res.status(503).json({ error: "Service Unavailable" });
    }

    const [transaction] = await db
      .select()
      .from(transactions)
      .where(and(eq(transactions.id, transactionId), eq(transactions.userId, req.user!.id)))
      .limit(1);

    if (!transaction) {
      return res.status(404).json({
        error: "Not Found",
        message: "Transação não encontrada",
      });
    }

    return res.json({
      success: true,
      data: transaction,
    });
  } catch (error) {
    console.error("[API] Get transaction error:", error);
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Erro ao buscar transação",
    });
  }
});

/**
 * PUT /api/v1/transactions/:id
 * Atualizar transação
 */
router.put("/transactions/:id", bearerAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const transactionId = parseInt(req.params.id);
    if (isNaN(transactionId)) {
      return res.status(400).json({
        error: "Bad Request",
        message: "ID da transação inválido",
      });
    }

    const validation = updateTransactionSchema.safeParse(req.body);
    if (!validation.success) {
      return handleValidationError(res, validation.error);
    }

    const data = validation.data;
    const db = await getDb();
    if (!db) {
      return res.status(503).json({ error: "Service Unavailable" });
    }

    // Buscar transação existente
    const [existingTransaction] = await db
      .select()
      .from(transactions)
      .where(and(eq(transactions.id, transactionId), eq(transactions.userId, req.user!.id)))
      .limit(1);

    if (!existingTransaction) {
      return res.status(404).json({
        error: "Not Found",
        message: "Transação não encontrada",
      });
    }

    // Verificar nova conta se fornecida
    if (data.accountId && data.accountId !== existingTransaction.accountId) {
      const [account] = await db
        .select()
        .from(accounts)
        .where(and(eq(accounts.id, data.accountId), eq(accounts.userId, req.user!.id)))
        .limit(1);

      if (!account) {
        return res.status(400).json({
          error: "Validation Error",
          details: [{ field: "accountId", message: "Conta inválida" }],
        });
      }
    }

    // Atualizar transação
    const [updatedTransaction] = await db
      .update(transactions)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(transactions.id, transactionId))
      .returning();

    return res.json({
      success: true,
      data: updatedTransaction,
      message: "Transação atualizada com sucesso",
    });
  } catch (error) {
    console.error("[API] Update transaction error:", error);
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Erro ao atualizar transação",
    });
  }
});

/**
 * DELETE /api/v1/transactions/:id
 * Excluir transação
 */
router.delete("/transactions/:id", bearerAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const transactionId = parseInt(req.params.id);
    if (isNaN(transactionId)) {
      return res.status(400).json({
        error: "Bad Request",
        message: "ID da transação inválido",
      });
    }

    const db = await getDb();
    if (!db) {
      return res.status(503).json({ error: "Service Unavailable" });
    }

    // Buscar transação
    const [transaction] = await db
      .select()
      .from(transactions)
      .where(and(eq(transactions.id, transactionId), eq(transactions.userId, req.user!.id)))
      .limit(1);

    if (!transaction) {
      return res.status(404).json({
        error: "Not Found",
        message: "Transação não encontrada",
      });
    }

    // Reverter saldo da conta
    const [account] = await db
      .select()
      .from(accounts)
      .where(eq(accounts.id, transaction.accountId))
      .limit(1);

    if (account) {
      const currentBalance = parseFloat(account.balance as string || "0");
      const transactionAmount = parseFloat(transaction.amount as string);
      const newBalance =
        transaction.type === "income"
          ? currentBalance - transactionAmount
          : currentBalance + transactionAmount;

      await db
        .update(accounts)
        .set({ balance: newBalance.toString(), updatedAt: new Date() })
        .where(eq(accounts.id, transaction.accountId));
    }

    // Excluir transação
    await db.delete(transactions).where(eq(transactions.id, transactionId));

    return res.json({
      success: true,
      message: "Transação excluída com sucesso",
    });
  } catch (error) {
    console.error("[API] Delete transaction error:", error);
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Erro ao excluir transação",
    });
  }
});

// ==================== ROTAS AUXILIARES ====================

/**
 * GET /api/v1/accounts
 * Listar contas do usuário (para referência ao criar transações)
 */
router.get("/accounts", bearerAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const db = await getDb();
    if (!db) {
      return res.status(503).json({ error: "Service Unavailable" });
    }

    const accountList = await db
      .select({
        id: accounts.id,
        name: accounts.name,
        type: accounts.type,
        currency: accounts.currency,
        balance: accounts.balance,
      })
      .from(accounts)
      .where(and(eq(accounts.userId, req.user!.id), eq(accounts.isActive, true)))
      .orderBy(accounts.name);

    return res.json({
      success: true,
      data: accountList,
    });
  } catch (error) {
    console.error("[API] List accounts error:", error);
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Erro ao listar contas",
    });
  }
});

/**
 * GET /api/v1/categories
 * Listar categorias do usuário
 */
router.get("/categories", bearerAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const db = await getDb();
    if (!db) {
      return res.status(503).json({ error: "Service Unavailable" });
    }

    const categoryList = await db
      .select({
        id: categories.id,
        name: categories.name,
        type: categories.type,
        color: categories.color,
        icon: categories.icon,
      })
      .from(categories)
      .where(and(eq(categories.userId, req.user!.id), eq(categories.isActive, true)))
      .orderBy(categories.name);

    return res.json({
      success: true,
      data: categoryList,
    });
  } catch (error) {
    console.error("[API] List categories error:", error);
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Erro ao listar categorias",
    });
  }
});

export default router;
