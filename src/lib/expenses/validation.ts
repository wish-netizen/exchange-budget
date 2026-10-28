import { CURRENCY_CODES } from "@/lib/currencies";
import { EXPENSE_CATEGORIES, isExpenseSection, type ExpenseSection } from "@/lib/expenses/categories";

export type ExpenseInput = {
  date: string;
  category: string;
  description: string;
  amount: string;
  currency: string;
  memo: string;
  manualRate?: string;
};

export function validateExpenseInput(value: unknown, sectionValue: string): ExpenseInput | null {
  if (!isExpenseSection(sectionValue) || typeof value !== "object" || value === null) return null;

  const input = value as Record<string, unknown>;
  const date = typeof input.date === "string" ? input.date : "";
  const parsedDate = new Date(`${date}T00:00:00.000Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(parsedDate.valueOf()) || parsedDate.toISOString().slice(0, 10) !== date) return null;

  const category = typeof input.category === "string" ? input.category.trim() : "";
  if (!(EXPENSE_CATEGORIES[sectionValue] as readonly string[]).includes(category)) return null;

  const description = typeof input.description === "string" ? input.description.trim() : "";
  if (Array.from(description).length > 120) return null;

  const amountValue = typeof input.amount === "string" || typeof input.amount === "number" ? String(input.amount).trim() : "";
  if (!/^\d{1,14}(\.\d{1,6})?$/.test(amountValue) || Number(amountValue) <= 0) return null;

  const currency = typeof input.currency === "string" ? input.currency.trim().toUpperCase() : "";
  if (!CURRENCY_CODES.has(currency as never)) return null;

  const memo = typeof input.memo === "string" ? input.memo.trim() : "";
  if (Array.from(memo).length > 500) return null;

  const manualRate = typeof input.manualRate === "string" || typeof input.manualRate === "number"
    ? String(input.manualRate).trim()
    : undefined;

  return { date, category, description, amount: amountValue, currency, memo, manualRate };
}

export function getExpenseSection(value: string): ExpenseSection | null {
  return isExpenseSection(value) ? value : null;
}

export function parseManualRate(value: string | undefined) {
  if (!value || !/^\d{1,10}(\.\d{1,8})?$/.test(value)) return null;
  const rate = Number(value);
  return Number.isFinite(rate) && rate > 0 ? value : null;
}