import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import {
  getUserAccounts,
  createAccount,
  getUserCategories,
  createCategory,
  getUserTransactions,
  createTransaction,
  getUserInvestments,
  createInvestment,
  getUserGoals,
  createGoal,
  getUserContacts,
  createContact,
  getUserPayables,
  createPayable,
  getUserReceivables,
  createReceivable,
  getUserAssets,
  createAsset,
  getUserLiabilities,
  createLiability,
} from "./db";

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
          bankName: z.string().optional(),
        })
      )
      .mutation(({ ctx, input }) =>
        createAccount({
          userId: ctx.user.id,
          name: input.name,
          type: input.type,
          currency: input.currency,
          initialBalance: input.initialBalance,
          balance: input.initialBalance,
          bankName: input.bankName,
        })
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
          type: z.enum(["stock", "etf", "fund", "fii", "bond", "crypto", "real_estate", "other"]),
          quantity: z.string(),
          averagePrice: z.string(),
          purchaseDate: z.string(),
          ticker: z.string().optional(),
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
        });
      }),
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
        })
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
        })
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
  }),
});

export type AppRouter = typeof appRouter;
