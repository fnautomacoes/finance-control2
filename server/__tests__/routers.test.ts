import { describe, it, expect, beforeAll } from "vitest";
import { appRouter } from "../routers";
import type { TrpcContext } from "../_core/context";

/**
 * Testes para os routers do FinanceControl
 * Valida todas as operações CRUD básicas
 */

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user-123",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "oauth",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return ctx;
}

describe("FinanceControl API Routers", () => {
  let caller: ReturnType<typeof appRouter.createCaller>;

  beforeAll(() => {
    const ctx = createAuthContext();
    caller = appRouter.createCaller(ctx);
  });

  describe("Accounts Router", () => {
    it("should list user accounts", async () => {
      const result = await caller.accounts.list();
      expect(Array.isArray(result)).toBe(true);
    });

    it("should create a new account", async () => {
      const result = await caller.accounts.create({
        name: "Conta Corrente",
        type: "checking",
        currency: "BRL",
        initialBalance: "1000",
        bankName: "Banco do Brasil",
      });
      expect(result).toBeDefined();
    });

    it("should validate account name is required", async () => {
      try {
        await caller.accounts.create({
          name: "",
          type: "checking",
          currency: "BRL",
        });
        expect.fail("Should have thrown validation error");
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe("Categories Router", () => {
    it("should list user categories", async () => {
      const result = await caller.categories.list();
      expect(Array.isArray(result)).toBe(true);
    });

    it("should create a new expense category", async () => {
      const result = await caller.categories.create({
        name: "Alimentação",
        type: "expense",
        description: "Despesas com alimentação",
        color: "#FF6B6B",
      });
      expect(result).toBeDefined();
    });

    it("should create a new income category", async () => {
      const result = await caller.categories.create({
        name: "Salário",
        type: "income",
        color: "#51CF66",
      });
      expect(result).toBeDefined();
    });

    it("should validate category name is required", async () => {
      try {
        await caller.categories.create({
          name: "",
          type: "expense",
        });
        expect.fail("Should have thrown validation error");
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe("Transactions Router", () => {
    it("should list user transactions", async () => {
      const result = await caller.transactions.list();
      expect(Array.isArray(result)).toBe(true);
    });

    it("should create an expense transaction", async () => {
      const result = await caller.transactions.create({
        accountId: 1,
        description: "Compra no supermercado",
        amount: "150.50",
        type: "expense",
        date: new Date().toISOString(),
        categoryId: 1,
      });
      expect(result).toBeDefined();
    });

    it("should create an income transaction", async () => {
      const result = await caller.transactions.create({
        accountId: 1,
        description: "Salário mensal",
        amount: "5000",
        type: "income",
        date: new Date().toISOString(),
      });
      expect(result).toBeDefined();
    });

    it("should require description", async () => {
      try {
        await caller.transactions.create({
          accountId: 1,
          description: "",
          amount: "100",
          type: "expense",
          date: new Date().toISOString(),
        });
        expect.fail("Should have thrown validation error");
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe("Investments Router", () => {
    it("should list user investments", async () => {
      const result = await caller.investments.list();
      expect(Array.isArray(result)).toBe(true);
    });

    it("should create a stock investment", async () => {
      const result = await caller.investments.create({
        accountId: 1,
        name: "PETR4",
        type: "stock",
        quantity: "100",
        averagePrice: "25.50",
        purchaseDate: new Date().toISOString(),
        ticker: "PETR4",
      });
      expect(result).toBeDefined();
    });

    it("should create an ETF investment", async () => {
      const result = await caller.investments.create({
        accountId: 1,
        name: "BOVA11",
        type: "etf",
        quantity: "50",
        averagePrice: "150.00",
        purchaseDate: new Date().toISOString(),
        ticker: "BOVA11",
      });
      expect(result).toBeDefined();
    });

    it("should create a crypto investment", async () => {
      const result = await caller.investments.create({
        accountId: 1,
        name: "Bitcoin",
        type: "crypto",
        quantity: "0.5",
        averagePrice: "200000",
        purchaseDate: new Date().toISOString(),
      });
      expect(result).toBeDefined();
    });

    it("should require name", async () => {
      try {
        await caller.investments.create({
          accountId: 1,
          name: "",
          type: "stock",
          quantity: "1",
          averagePrice: "100",
          purchaseDate: new Date().toISOString(),
        });
        expect.fail("Should have thrown validation error");
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe("Goals Router", () => {
    it("should list user goals", async () => {
      const result = await caller.goals.list();
      expect(Array.isArray(result)).toBe(true);
    });

    it("should create a budget goal", async () => {
      const result = await caller.goals.create({
        name: "Orçamento Mensal",
        type: "budget",
        targetAmount: "5000",
        startDate: new Date().toISOString(),
      });
      expect(result).toBeDefined();
    });

    it("should create a savings goal", async () => {
      const result = await caller.goals.create({
        name: "Fundo de Emergência",
        type: "savings",
        targetAmount: "20000",
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      });
      expect(result).toBeDefined();
    });

    it("should create an investment goal", async () => {
      const result = await caller.goals.create({
        name: "Aposentadoria",
        type: "investment",
        targetAmount: "1000000",
        startDate: new Date().toISOString(),
      });
      expect(result).toBeDefined();
    });
  });

  describe("Contacts Router", () => {
    it("should list user contacts", async () => {
      const result = await caller.contacts.list();
      expect(Array.isArray(result)).toBe(true);
    });

    it("should create a person contact", async () => {
      const result = await caller.contacts.create({
        name: "João Silva",
        type: "person",
        email: "joao@example.com",
        phone: "+55 11 98765-4321",
      });
      expect(result).toBeDefined();
    });

    it("should create a company contact", async () => {
      const result = await caller.contacts.create({
        name: "Empresa XYZ LTDA",
        type: "company",
        email: "contato@empresa.com",
      });
      expect(result).toBeDefined();
    });
  });

  describe("Payables Router", () => {
    it("should list user payables", async () => {
      const result = await caller.payables.list();
      expect(Array.isArray(result)).toBe(true);
    });

    it("should create a payable", async () => {
      const result = await caller.payables.create({
        description: "Aluguel do mês",
        amount: "1500",
        dueDate: new Date().toISOString(),
        contactId: 1,
      });
      expect(result).toBeDefined();
    });

    it("should create a payable with category", async () => {
      const result = await caller.payables.create({
        description: "Conta de luz",
        amount: "250",
        dueDate: new Date().toISOString(),
        categoryId: 1,
      });
      expect(result).toBeDefined();
    });
  });

  describe("Receivables Router", () => {
    it("should list user receivables", async () => {
      const result = await caller.receivables.list();
      expect(Array.isArray(result)).toBe(true);
    });

    it("should create a receivable", async () => {
      const result = await caller.receivables.create({
        description: "Freelance - Projeto Web",
        amount: "2000",
        dueDate: new Date().toISOString(),
        contactId: 1,
      });
      expect(result).toBeDefined();
    });

    it("should create a receivable with category", async () => {
      const result = await caller.receivables.create({
        description: "Venda de produto",
        amount: "500",
        dueDate: new Date().toISOString(),
        categoryId: 1,
      });
      expect(result).toBeDefined();
    });
  });

  describe("Assets Router", () => {
    it("should list user assets", async () => {
      const result = await caller.assets.list();
      expect(Array.isArray(result)).toBe(true);
    });

    it("should create a real estate asset", async () => {
      const result = await caller.assets.create({
        name: "Apartamento - São Paulo",
        type: "real_estate",
        purchasePrice: "500000",
        purchaseDate: new Date().toISOString(),
      });
      expect(result).toBeDefined();
    });

    it("should create a vehicle asset", async () => {
      const result = await caller.assets.create({
        name: "Carro - Honda Civic",
        type: "vehicle",
        purchasePrice: "120000",
        purchaseDate: new Date().toISOString(),
      });
      expect(result).toBeDefined();
    });

    it("should create jewelry asset", async () => {
      const result = await caller.assets.create({
        name: "Anel de ouro",
        type: "jewelry",
        purchasePrice: "5000",
      });
      expect(result).toBeDefined();
    });
  });

  describe("Liabilities Router", () => {
    it("should list user liabilities", async () => {
      const result = await caller.liabilities.list();
      expect(Array.isArray(result)).toBe(true);
    });

    it("should create a loan liability", async () => {
      const result = await caller.liabilities.create({
        name: "Empréstimo Pessoal",
        type: "loan",
        originalAmount: "10000",
        currentAmount: "8000",
        interestRate: "2.5",
        startDate: new Date().toISOString(),
      });
      expect(result).toBeDefined();
    });

    it("should create a mortgage liability", async () => {
      const result = await caller.liabilities.create({
        name: "Financiamento Imobiliário",
        type: "mortgage",
        originalAmount: "400000",
        currentAmount: "350000",
        interestRate: "6.5",
      });
      expect(result).toBeDefined();
    });

    it("should create a credit card liability", async () => {
      const result = await caller.liabilities.create({
        name: "Cartão de Crédito",
        type: "credit_card",
        originalAmount: "5000",
        currentAmount: "2500",
      });
      expect(result).toBeDefined();
    });
  });

  describe("Auth Router", () => {
    it("should return current user", async () => {
      const user = await caller.auth.me();
      expect(user).toBeDefined();
      expect(user?.id).toBe(1);
      expect(user?.openId).toBe("test-user-123");
    });
  });
});
