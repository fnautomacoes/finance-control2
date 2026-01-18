import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import {
  getUserAccounts,
  createAccount,
  updateAccount,
  deleteAccount,
  getAccountById,
  getUserCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getUserTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getUserInvestments,
  createInvestment,
  updateInvestment,
  deleteInvestment,
  getUserGoals,
  createGoal,
  updateGoal,
  deleteGoal,
  getUserContacts,
  createContact,
  updateContact,
  deleteContact,
  getUserPayables,
  createPayable,
  updatePayable,
  deletePayable,
  getUserReceivables,
  createReceivable,
  updateReceivable,
  deleteReceivable,
  getUserAssets,
  createAsset,
  updateAsset,
  deleteAsset,
  getUserLiabilities,
  createLiability,
  updateLiability,
  deleteLiability,
  getDashboardSummary,
  getExistingFitIds,
  bulkInsertTransactions,
  updateAccountBalance,
  createOFXImport,
  getUserOFXImports,
  getUserCategoryMappings,
  createCategoryMapping,
  updateCategoryMapping,
  deleteCategoryMapping,
} from "./db";
import {
  parseOFX,
  validateOFX,
  prepareTransactionsForImport,
  suggestCategory,
  type ParsedOFXData,
} from "./lib/ofx-parser";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Dashboard
  dashboard: router({
    summary: protectedProcedure
      .input(
        z.object({
          startDate: z.string().optional(),
          endDate: z.string().optional(),
        }).optional()
      )
      .query(({ ctx, input }) =>
        getDashboardSummary(ctx.user.id, input?.startDate, input?.endDate)
      ),
  }),

  // Contas Bancárias
  accounts: router({
    list: protectedProcedure.query(({ ctx }) =>
      getUserAccounts(ctx.user.id)
    ),
    create: protectedProcedure
      .input(
        z.object({
          name: z.string().min(1),
          type: z.enum(["checking", "savings", "investment", "credit_card", "other"]),
          currency: z.enum(["BRL", "USD", "EUR"]).default("BRL"),
          initialBalance: z.string().default("0"),
          balance: z.string().default("0"),
          bankName: z.string().optional(),
          creditLimit: z.string().optional(),
        })
      )
      .mutation(({ ctx, input }) =>
        createAccount({
          userId: ctx.user.id,
          name: input.name,
          type: input.type,
          currency: input.currency,
          initialBalance: input.initialBalance,
          balance: input.balance || input.initialBalance,
          bankName: input.bankName,
          creditLimit: input.creditLimit,
        })
      ),
    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          name: z.string().min(1).optional(),
          type: z.enum(["checking", "savings", "investment", "credit_card", "other"]).optional(),
          bankName: z.string().optional(),
          creditLimit: z.string().optional(),
          balance: z.string().optional(),
        })
      )
      .mutation(({ ctx, input }) =>
        updateAccount(input.id, ctx.user.id, {
          name: input.name,
          type: input.type,
          bankName: input.bankName,
          creditLimit: input.creditLimit,
          balance: input.balance,
        })
      ),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ ctx, input }) =>
        deleteAccount(input.id, ctx.user.id)
      ),
  }),

  // Categorias
  categories: router({
    list: protectedProcedure.query(({ ctx }) =>
      getUserCategories(ctx.user.id)
    ),
    create: protectedProcedure
      .input(
        z.object({
          name: z.string().min(1),
          type: z.enum(["income", "expense"]),
          description: z.string().optional(),
          color: z.string().default("#3b82f6"),
        })
      )
      .mutation(({ ctx, input }) =>
        createCategory({
          userId: ctx.user.id,
          name: input.name,
          type: input.type,
          description: input.description,
          color: input.color,
        })
      ),
    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          name: z.string().min(1).optional(),
          type: z.enum(["income", "expense"]).optional(),
          description: z.string().optional(),
          color: z.string().optional(),
        })
      )
      .mutation(({ ctx, input }) =>
        updateCategory(input.id, ctx.user.id, {
          name: input.name,
          type: input.type,
          description: input.description,
          color: input.color,
        })
      ),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ ctx, input }) =>
        deleteCategory(input.id, ctx.user.id)
      ),
  }),

  // Transações
  transactions: router({
    list: protectedProcedure.query(({ ctx }) =>
      getUserTransactions(ctx.user.id)
    ),
    create: protectedProcedure
      .input(
        z.object({
          accountId: z.number(),
          description: z.string().min(1),
          amount: z.string(),
          type: z.enum(["income", "expense"]),
          date: z.string(),
          categoryId: z.number().optional(),
          notes: z.string().optional(),
        })
      )
      .mutation(({ ctx, input }) =>
        createTransaction({
          userId: ctx.user.id,
          accountId: input.accountId,
          description: input.description,
          amount: input.amount,
          type: input.type,
          date: input.date,
          categoryId: input.categoryId,
          notes: input.notes,
        })
      ),
    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          accountId: z.number().optional(),
          description: z.string().min(1).optional(),
          amount: z.string().optional(),
          type: z.enum(["income", "expense"]).optional(),
          date: z.string().optional(),
          categoryId: z.number().optional(),
          notes: z.string().optional(),
        })
      )
      .mutation(({ ctx, input }) =>
        updateTransaction(input.id, ctx.user.id, {
          accountId: input.accountId,
          description: input.description,
          amount: input.amount,
          type: input.type,
          date: input.date,
          categoryId: input.categoryId,
          notes: input.notes,
        })
      ),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ ctx, input }) =>
        deleteTransaction(input.id, ctx.user.id)
      ),
  }),

  // Investimentos
  investments: router({
    list: protectedProcedure.query(({ ctx }) =>
      getUserInvestments(ctx.user.id)
    ),
    create: protectedProcedure
      .input(
        z.object({
          accountId: z.number(),
          name: z.string().min(1),
          type: z.enum(["stock", "etf", "fund", "fii", "bond", "cdb", "lci_lca", "crypto", "real_estate", "other"]),
          quantity: z.string(),
          averagePrice: z.string(),
          purchaseDate: z.string(),
          ticker: z.string().optional(),
          maturityDate: z.string().optional(),
          cdiPercentage: z.string().optional(),
          fixedRate: z.string().optional(),
          institution: z.string().optional(),
        })
      )
      .mutation(({ ctx, input }) => {
        const totalCost = (parseFloat(input.quantity) * parseFloat(input.averagePrice)).toString();
        return createInvestment({
          userId: ctx.user.id,
          accountId: input.accountId,
          name: input.name,
          type: input.type,
          quantity: input.quantity,
          averagePrice: input.averagePrice,
          totalCost,
          purchaseDate: input.purchaseDate,
          ticker: input.ticker,
          maturityDate: input.maturityDate,
          cdiPercentage: input.cdiPercentage,
          fixedRate: input.fixedRate,
          institution: input.institution,
        });
      }),
    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          name: z.string().min(1).optional(),
          type: z.enum(["stock", "etf", "fund", "fii", "bond", "cdb", "lci_lca", "crypto", "real_estate", "other"]).optional(),
          quantity: z.string().optional(),
          averagePrice: z.string().optional(),
          currentPrice: z.string().optional(),
          ticker: z.string().optional(),
          maturityDate: z.string().optional(),
          cdiPercentage: z.string().optional(),
          fixedRate: z.string().optional(),
          institution: z.string().optional(),
        })
      )
      .mutation(({ ctx, input }) => {
        const updateData: any = { ...input };
        delete updateData.id;
        if (input.quantity && input.averagePrice) {
          updateData.totalCost = (parseFloat(input.quantity) * parseFloat(input.averagePrice)).toString();
        }
        return updateInvestment(input.id, ctx.user.id, updateData);
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ ctx, input }) =>
        deleteInvestment(input.id, ctx.user.id)
      ),
  }),

  // Metas
  goals: router({
    list: protectedProcedure.query(({ ctx }) =>
      getUserGoals(ctx.user.id)
    ),
    create: protectedProcedure
      .input(
        z.object({
          name: z.string().min(1),
          type: z.enum(["budget", "savings", "investment"]),
          targetAmount: z.string(),
          startDate: z.string(),
          endDate: z.string().optional(),
          categoryId: z.number().optional(),
        })
      )
      .mutation(({ ctx, input }) =>
        createGoal({
          userId: ctx.user.id,
          name: input.name,
          type: input.type,
          targetAmount: input.targetAmount,
          startDate: input.startDate,
          endDate: input.endDate,
          categoryId: input.categoryId,
        })
      ),
    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          name: z.string().min(1).optional(),
          type: z.enum(["budget", "savings", "investment"]).optional(),
          targetAmount: z.string().optional(),
          currentAmount: z.string().optional(),
          startDate: z.string().optional(),
          endDate: z.string().optional(),
          categoryId: z.number().optional(),
          isActive: z.boolean().optional(),
        })
      )
      .mutation(({ ctx, input }) =>
        updateGoal(input.id, ctx.user.id, {
          name: input.name,
          type: input.type,
          targetAmount: input.targetAmount,
          currentAmount: input.currentAmount,
          startDate: input.startDate,
          endDate: input.endDate,
          categoryId: input.categoryId,
          isActive: input.isActive,
        })
      ),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ ctx, input }) =>
        deleteGoal(input.id, ctx.user.id)
      ),
  }),

  // Contatos
  contacts: router({
    list: protectedProcedure.query(({ ctx }) =>
      getUserContacts(ctx.user.id)
    ),
    create: protectedProcedure
      .input(
        z.object({
          name: z.string().min(1),
          type: z.enum(["person", "company"]),
          email: z.string().email().optional(),
          phone: z.string().optional(),
        })
      )
      .mutation(({ ctx, input }) =>
        createContact({
          userId: ctx.user.id,
          name: input.name,
          type: input.type,
          email: input.email,
          phone: input.phone,
        })
      ),
    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          name: z.string().min(1).optional(),
          type: z.enum(["person", "company"]).optional(),
          email: z.string().email().optional(),
          phone: z.string().optional(),
          category: z.string().optional(),
          notes: z.string().optional(),
          isActive: z.boolean().optional(),
        })
      )
      .mutation(({ ctx, input }) =>
        updateContact(input.id, ctx.user.id, {
          name: input.name,
          type: input.type,
          email: input.email,
          phone: input.phone,
          category: input.category,
          notes: input.notes,
          isActive: input.isActive,
        })
      ),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ ctx, input }) =>
        deleteContact(input.id, ctx.user.id)
      ),
  }),

  // Contas a Pagar
  payables: router({
    list: protectedProcedure.query(({ ctx }) =>
      getUserPayables(ctx.user.id)
    ),
    create: protectedProcedure
      .input(
        z.object({
          description: z.string().min(1),
          amount: z.string(),
          dueDate: z.string(),
          contactId: z.number().optional(),
          categoryId: z.number().optional(),
          status: z.enum(["pending", "paid", "overdue", "cancelled"]).optional(),
          paidDate: z.string().optional(),
        })
      )
      .mutation(({ ctx, input }) =>
        createPayable({
          userId: ctx.user.id,
          description: input.description,
          amount: input.amount,
          dueDate: input.dueDate,
          contactId: input.contactId,
          categoryId: input.categoryId,
          status: input.status,
          paidDate: input.paidDate,
        })
      ),
    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          description: z.string().min(1).optional(),
          amount: z.string().optional(),
          dueDate: z.string().optional(),
          contactId: z.number().optional(),
          categoryId: z.number().optional(),
          status: z.enum(["pending", "paid", "overdue", "cancelled"]).optional(),
          paidDate: z.string().optional(),
          notes: z.string().optional(),
        })
      )
      .mutation(({ ctx, input }) =>
        updatePayable(input.id, ctx.user.id, {
          description: input.description,
          amount: input.amount,
          dueDate: input.dueDate,
          contactId: input.contactId,
          categoryId: input.categoryId,
          status: input.status,
          paidDate: input.paidDate,
          notes: input.notes,
        })
      ),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ ctx, input }) =>
        deletePayable(input.id, ctx.user.id)
      ),
  }),

  // Contas a Receber
  receivables: router({
    list: protectedProcedure.query(({ ctx }) =>
      getUserReceivables(ctx.user.id)
    ),
    create: protectedProcedure
      .input(
        z.object({
          description: z.string().min(1),
          amount: z.string(),
          dueDate: z.string(),
          contactId: z.number().optional(),
          categoryId: z.number().optional(),
          status: z.enum(["pending", "received", "overdue", "cancelled"]).optional(),
          receivedDate: z.string().optional(),
        })
      )
      .mutation(({ ctx, input }) =>
        createReceivable({
          userId: ctx.user.id,
          description: input.description,
          amount: input.amount,
          dueDate: input.dueDate,
          contactId: input.contactId,
          categoryId: input.categoryId,
          status: input.status,
          receivedDate: input.receivedDate,
        })
      ),
    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          description: z.string().min(1).optional(),
          amount: z.string().optional(),
          dueDate: z.string().optional(),
          contactId: z.number().optional(),
          categoryId: z.number().optional(),
          status: z.enum(["pending", "received", "overdue", "cancelled"]).optional(),
          receivedDate: z.string().optional(),
          notes: z.string().optional(),
        })
      )
      .mutation(({ ctx, input }) =>
        updateReceivable(input.id, ctx.user.id, {
          description: input.description,
          amount: input.amount,
          dueDate: input.dueDate,
          contactId: input.contactId,
          categoryId: input.categoryId,
          status: input.status,
          receivedDate: input.receivedDate,
          notes: input.notes,
        })
      ),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ ctx, input }) =>
        deleteReceivable(input.id, ctx.user.id)
      ),
  }),

  // Ativos
  assets: router({
    list: protectedProcedure.query(({ ctx }) =>
      getUserAssets(ctx.user.id)
    ),
    create: protectedProcedure
      .input(
        z.object({
          name: z.string().min(1),
          type: z.enum(["real_estate", "vehicle", "jewelry", "art", "other"]),
          purchasePrice: z.string().optional(),
          purchaseDate: z.string().optional(),
        })
      )
      .mutation(({ ctx, input }) =>
        createAsset({
          userId: ctx.user.id,
          name: input.name,
          type: input.type,
          purchasePrice: input.purchasePrice,
          purchaseDate: input.purchaseDate,
        })
      ),
    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          name: z.string().min(1).optional(),
          type: z.enum(["real_estate", "vehicle", "jewelry", "art", "other"]).optional(),
          description: z.string().optional(),
          purchasePrice: z.string().optional(),
          currentValue: z.string().optional(),
          purchaseDate: z.string().optional(),
          notes: z.string().optional(),
        })
      )
      .mutation(({ ctx, input }) =>
        updateAsset(input.id, ctx.user.id, {
          name: input.name,
          type: input.type,
          description: input.description,
          purchasePrice: input.purchasePrice,
          currentValue: input.currentValue,
          purchaseDate: input.purchaseDate,
          notes: input.notes,
        })
      ),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ ctx, input }) =>
        deleteAsset(input.id, ctx.user.id)
      ),
  }),

  // Passivos
  liabilities: router({
    list: protectedProcedure.query(({ ctx }) =>
      getUserLiabilities(ctx.user.id)
    ),
    create: protectedProcedure
      .input(
        z.object({
          name: z.string().min(1),
          type: z.enum(["loan", "mortgage", "credit_card", "other"]),
          originalAmount: z.string(),
          currentAmount: z.string(),
          interestRate: z.string().optional(),
          startDate: z.string().optional(),
          endDate: z.string().optional(),
        })
      )
      .mutation(({ ctx, input }) =>
        createLiability({
          userId: ctx.user.id,
          name: input.name,
          type: input.type,
          originalAmount: input.originalAmount,
          currentAmount: input.currentAmount,
          interestRate: input.interestRate,
          startDate: input.startDate,
          endDate: input.endDate,
        })
      ),
    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          name: z.string().min(1).optional(),
          type: z.enum(["loan", "mortgage", "credit_card", "other"]).optional(),
          description: z.string().optional(),
          originalAmount: z.string().optional(),
          currentAmount: z.string().optional(),
          interestRate: z.string().optional(),
          startDate: z.string().optional(),
          endDate: z.string().optional(),
          notes: z.string().optional(),
        })
      )
      .mutation(({ ctx, input }) =>
        updateLiability(input.id, ctx.user.id, {
          name: input.name,
          type: input.type,
          description: input.description,
          originalAmount: input.originalAmount,
          currentAmount: input.currentAmount,
          interestRate: input.interestRate,
          startDate: input.startDate,
          endDate: input.endDate,
          notes: input.notes,
        })
      ),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ ctx, input }) =>
        deleteLiability(input.id, ctx.user.id)
      ),
  }),

  // OFX Import
  ofx: router({
    // Parse OFX file and return preview
    parse: protectedProcedure
      .input(
        z.object({
          fileContent: z.string().min(1),
          accountId: z.number(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        // Validate the account belongs to the user
        const account = await getAccountById(input.accountId, ctx.user.id);
        if (!account) {
          throw new Error("Conta não encontrada");
        }

        // Validate OFX content
        const validation = validateOFX(input.fileContent);
        if (!validation.valid) {
          throw new Error(validation.error || "Arquivo OFX inválido");
        }

        // Parse OFX
        const parsedData = parseOFX(input.fileContent);

        // Get existing fitIds for duplicate detection
        const existingFitIds = await getExistingFitIds(input.accountId, ctx.user.id);

        // Get category mappings for suggestions
        const categoryMappings = await getUserCategoryMappings(ctx.user.id);

        // Prepare transactions for import
        const transactions = prepareTransactionsForImport(parsedData, existingFitIds);

        // Add category suggestions
        const transactionsWithCategories = transactions.map((tx) => ({
          ...tx,
          suggestedCategoryId: suggestCategory(
            tx.description,
            categoryMappings.map((m) => ({ pattern: m.pattern, categoryId: m.categoryId }))
          ),
        }));

        return {
          bankId: parsedData.bankId,
          bankAccountId: parsedData.accountId,
          accountType: parsedData.accountType,
          currency: parsedData.currency,
          balance: parsedData.balance,
          startDate: parsedData.startDate,
          endDate: parsedData.endDate,
          transactions: transactionsWithCategories,
          summary: {
            total: transactions.length,
            new: transactions.filter((t) => !t.isDuplicate).length,
            duplicates: transactions.filter((t) => t.isDuplicate).length,
          },
        };
      }),

    // Import selected transactions
    import: protectedProcedure
      .input(
        z.object({
          accountId: z.number(),
          fileName: z.string().optional(),
          bankId: z.string().optional(),
          bankAccountId: z.string().optional(),
          startDate: z.string().optional(),
          endDate: z.string().optional(),
          transactions: z.array(
            z.object({
              fitId: z.string(),
              date: z.string(),
              amount: z.string(),
              type: z.enum(["income", "expense"]),
              description: z.string(),
              categoryId: z.number().optional(),
            })
          ),
          updateBalance: z.boolean().default(true),
        })
      )
      .mutation(async ({ ctx, input }) => {
        // Validate the account belongs to the user
        const account = await getAccountById(input.accountId, ctx.user.id);
        if (!account) {
          throw new Error("Conta não encontrada");
        }

        if (input.transactions.length === 0) {
          return { imported: 0, duplicatesSkipped: 0, balanceChange: 0 };
        }

        // Get existing fitIds to avoid duplicates
        const existingFitIds = await getExistingFitIds(input.accountId, ctx.user.id);

        // Filter out duplicates and prepare for insertion
        const transactionsToInsert = input.transactions
          .filter((tx) => !existingFitIds.has(tx.fitId))
          .map((tx) => ({
            userId: ctx.user.id,
            accountId: input.accountId,
            fitId: tx.fitId,
            description: tx.description,
            amount: tx.amount,
            type: tx.type as "income" | "expense",
            date: tx.date,
            categoryId: tx.categoryId,
            status: "completed" as const,
          }));

        // Bulk insert transactions
        const { inserted } = await bulkInsertTransactions(transactionsToInsert);

        // Calculate balance change if needed
        let balanceChange = 0;
        if (input.updateBalance && inserted > 0) {
          balanceChange = transactionsToInsert.reduce((sum, tx) => {
            const amount = parseFloat(tx.amount);
            return sum + (tx.type === "income" ? amount : -amount);
          }, 0);

          await updateAccountBalance(input.accountId, ctx.user.id, balanceChange);
        }

        // Record import history
        await createOFXImport({
          userId: ctx.user.id,
          accountId: input.accountId,
          fileName: input.fileName,
          bankId: input.bankId,
          bankAccountId: input.bankAccountId,
          transactionCount: inserted,
          duplicateCount: input.transactions.length - inserted,
          startDate: input.startDate,
          endDate: input.endDate,
        });

        return {
          imported: inserted,
          duplicatesSkipped: input.transactions.length - inserted,
          balanceChange,
        };
      }),

    // Get import history
    history: protectedProcedure.query(({ ctx }) =>
      getUserOFXImports(ctx.user.id)
    ),
  }),

  // Category Mappings for OFX auto-categorization
  categoryMappings: router({
    list: protectedProcedure.query(({ ctx }) =>
      getUserCategoryMappings(ctx.user.id)
    ),
    create: protectedProcedure
      .input(
        z.object({
          pattern: z.string().min(1),
          categoryId: z.number(),
        })
      )
      .mutation(({ ctx, input }) =>
        createCategoryMapping({
          userId: ctx.user.id,
          pattern: input.pattern,
          categoryId: input.categoryId,
        })
      ),
    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          pattern: z.string().min(1).optional(),
          categoryId: z.number().optional(),
          isActive: z.boolean().optional(),
        })
      )
      .mutation(({ ctx, input }) =>
        updateCategoryMapping(input.id, ctx.user.id, {
          pattern: input.pattern,
          categoryId: input.categoryId,
          isActive: input.isActive,
        })
      ),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ ctx, input }) =>
        deleteCategoryMapping(input.id, ctx.user.id)
      ),
  }),
});

export type AppRouter = typeof appRouter;
