export const EXPENSE_CATEGORIES = {
  preparation: ["항공권", "비자", "보험", "거주", "물품 구매", "통신비"],
  living: ["식비", "교통", "생활용품", "학업", "여가", "쇼핑"],
  travel: ["교통", "숙소", "식비", "관광", "쇼핑"],
} as const;

export type ExpenseSection = keyof typeof EXPENSE_CATEGORIES;

export function isExpenseSection(value: string): value is ExpenseSection {
  return value in EXPENSE_CATEGORIES;
}