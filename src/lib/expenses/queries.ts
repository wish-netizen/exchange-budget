import { getDatabase } from "@/lib/db";
import type { ExpenseSection } from "@/lib/expenses/categories";

export async function getExpenseSectionData(ledgerId: string, section: ExpenseSection) {
  const sql = getDatabase();
  const expenses = await sql`
    SELECT
      id,
      section,
      to_char(date, 'YYYY-MM-DD') AS date,
      category,
      description,
      amount::text AS amount,
      currency,
      rate_to_krw::text AS rate_to_krw,
      rate_source,
      to_char(rate_date, 'YYYY-MM-DD') AS rate_date,
      converted_amount_krw::text AS converted_amount_krw,
      memo,
      (date > CURRENT_DATE) AS is_planned
    FROM expenses
    WHERE ledger_id = ${ledgerId} AND section = ${section}
    ORDER BY date DESC, created_at DESC
  `;
  const totals = await sql`
    SELECT COALESCE(SUM(converted_amount_krw), 0)::text AS section_total_krw
    FROM expenses
    WHERE ledger_id = ${ledgerId} AND section = ${section}
  `;

  return {
    expenses,
    sectionTotalKrw: String(totals[0]?.section_total_krw ?? "0"),
  };
}

export async function getLedgerExpenseSummary(ledgerId: string) {
  const sql = getDatabase();
  const rows = await sql`
    SELECT round(
      initial_fund_amount * initial_fund_rate_to_krw
      + COALESCE((
        SELECT SUM(round(amount * rate_to_krw, 2))
        FROM incomes
        WHERE ledger_id = ledgers.id
      ), 0)
      - COALESCE((
        SELECT SUM(converted_amount_krw)
        FROM expenses
        WHERE ledger_id = ledgers.id
      ), 0),
      2
    )::text AS remaining_krw,
    (
      SELECT COUNT(*)
      FROM expenses
      WHERE ledger_id = ledgers.id
    )::text AS expense_count
    FROM ledgers
    WHERE id = ${ledgerId}
    LIMIT 1
  `;

  return {
    remainingKrw: String(rows[0]?.remaining_krw ?? "0"),
    expenseCount: Number(rows[0]?.expense_count ?? 0),
  };
}
