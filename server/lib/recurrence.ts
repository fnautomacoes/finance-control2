// server/lib/recurrence.ts
// Library for generating recurring transactions

import { addDays, addWeeks, addMonths, addYears, format } from "date-fns";

interface RecurrenceConfig {
  type: "single" | "installment" | "fixed";
  frequency?: "daily" | "weekly" | "monthly" | "yearly";
  interval?: number; // Repeat every N periods
  totalInstallments?: number;
  startInstallment?: number;
  installmentValue?: string;
  startDate: string;
}

interface TransactionBase {
  userId: number;
  accountId: number;
  description: string;
  amount: string;
  type: "income" | "expense";
  categoryId?: number | null;
  notes?: string | null;
  contactId?: number | null;
  documentNumber?: string | null;
  observations?: string | null;
  tags?: string | null;
}

export interface GeneratedTransaction extends TransactionBase {
  date: string;
  status: "pending" | "scheduled" | "confirmed" | "reconciled";
  isRecurring: boolean;
  recurrenceType: "single" | "installment" | "fixed";
  recurrenceFrequency?: "daily" | "weekly" | "monthly" | "yearly";
  recurrenceInterval?: number;
  installmentNumber?: number;
  totalInstallments?: number;
}

function advanceDate(
  currentDate: Date,
  frequency: "daily" | "weekly" | "monthly" | "yearly",
  interval: number
): Date {
  switch (frequency) {
    case "daily":
      return addDays(currentDate, interval);
    case "weekly":
      return addWeeks(currentDate, interval);
    case "monthly":
      return addMonths(currentDate, interval);
    case "yearly":
      return addYears(currentDate, interval);
    default:
      return addMonths(currentDate, interval);
  }
}

export function generateRecurringTransactions(
  baseTransaction: TransactionBase,
  config: RecurrenceConfig
): GeneratedTransaction[] {
  const transactions: GeneratedTransaction[] = [];

  // Single transaction
  if (config.type === "single") {
    return [
      {
        ...baseTransaction,
        date: config.startDate,
        status: "pending",
        isRecurring: false,
        recurrenceType: "single",
      },
    ];
  }

  // Installment transaction (parcelada)
  if (config.type === "installment") {
    const frequency = config.frequency || "monthly";
    const interval = config.interval || 1;
    const total = config.totalInstallments || 1;
    const startNum = config.startInstallment || 1;
    const installmentValue = config.installmentValue || baseTransaction.amount;

    let currentDate = new Date(config.startDate);

    for (let i = startNum; i <= total; i++) {
      const description = `${baseTransaction.description} (${i}/${total})`;

      transactions.push({
        ...baseTransaction,
        description,
        amount: installmentValue,
        date: format(currentDate, "yyyy-MM-dd"),
        status: i === startNum ? "pending" : "scheduled",
        isRecurring: true,
        recurrenceType: "installment",
        recurrenceFrequency: frequency,
        recurrenceInterval: interval,
        installmentNumber: i,
        totalInstallments: total,
      });

      // Advance date
      currentDate = advanceDate(currentDate, frequency, interval);
    }
  }

  // Fixed recurring transaction (sem fim definido)
  if (config.type === "fixed") {
    const frequency = config.frequency || "monthly";
    const interval = config.interval || 1;
    const monthsAhead = 12; // Generate 12 future occurrences

    let currentDate = new Date(config.startDate);

    for (let i = 0; i < monthsAhead; i++) {
      transactions.push({
        ...baseTransaction,
        date: format(currentDate, "yyyy-MM-dd"),
        status: i === 0 ? "pending" : "scheduled",
        isRecurring: true,
        recurrenceType: "fixed",
        recurrenceFrequency: frequency,
        recurrenceInterval: interval,
      });

      // Advance date
      currentDate = advanceDate(currentDate, frequency, interval);
    }
  }

  return transactions;
}

export function getFrequencyLabel(frequency: string): string {
  const labels: Record<string, string> = {
    daily: "Diária",
    weekly: "Semanal",
    monthly: "Mensal",
    yearly: "Anual",
  };
  return labels[frequency] || frequency;
}

export function getRecurrenceTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    single: "Única",
    installment: "Parcelada",
    fixed: "Fixa",
  };
  return labels[type] || type;
}
