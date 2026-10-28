import { getDatabase } from "@/lib/db";

export async function getIncomePageData(ledgerId: string) {
  const sql = getDatabase();
  const incomes = await sql`
    SELECT
      id,
      to_char(date, 'YYYY-MM-DD') AS date,
      category,
      description,
      amount::text AS amount,
      currency,
      rate_to_krw::text AS rate_to_krw,
      rate_source,
      to_char(rate_date, 'YYYY-MM-DD') AS rate_date,
      round(amount * rate_to_krw, 2)::text AS converted_amount_krw,
      memo,
      (date > CURRENT_DATE) AS is_planned
    FROM incomes
    WHERE ledger_id = ${ledgerId}
    ORDER BY date DESC, created_at DESC
  `;
  const totals = await sql`
    SELECT COALESCE(SUM(round(amount * rate_to_krw, 2)), 0)::text AS total_income_krw
    FROM incomes
    WHERE ledger_id = ${ledgerId}
  `;

  return {
    incomes,
    totalIncomeKrw: String(totals[0]?.total_income_krw ?? "0"),
  };
}
