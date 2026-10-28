import { CURRENCY_CODES } from "@/lib/currencies";

export const INCOME_CATEGORIES = ["scholarship", "allowance", "part_time", "other"] as const;
export type IncomeCategory = (typeof INCOME_CATEGORIES)[number];

export function isIncomeCategory(value: string): value is IncomeCategory {
  return INCOME_CATEGORIES.includes(value as IncomeCategory);
}

export type IncomeInput = {
  date: string;
  category: IncomeCategory;
  description: string;
  amount: string;
  currency: string;
  memo: string;
  manualRate?: string;
};

export function validateIncomeInput(value: unknown): IncomeInput | null {
  if (typeof value !== "object" || value === null) return null;
  const input = value as Record<string, unknown>;

  const date = typeof input.date === "string" ? input.date : "";
  const parsedDate = new Date(`${date}T00:00:00.000Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(parsedDate.valueOf()) || parsedDate.toISOString().slice(0, 10) !== date) return null;

  const category = typeof input.category === "string" ? input.category.trim() : "";
  if (!isIncomeCategory(category)) return null;

  const description = typeof input.description === "string" ? input.description.trim() : "";
  if (Array.from(description).length > 120) return null;

  const amount = typeof input.amount === "string" || typeof input.amount === "number" ? String(input.amount).trim() : "";
  if (!/^\d{1,14}(\.\d{1,6})?$/.test(amount) || Number(amount) <= 0) return null;

  const currency = typeof input.currency === "string" ? input.currency.trim().toUpperCase() : "";
  if (!CURRENCY_CODES.has(currency as never)) return null;

  const memo = typeof input.memo === "string" ? input.memo.trim() : "";
  if (Array.from(memo).length > 500) return null;

  const manualRate = typeof input.manualRate === "string" || typeof input.manualRate === "number"
    ? String(input.manualRate).trim()
    : undefined;

  return { date, category, description, amount, currency, memo, manualRate };
}
