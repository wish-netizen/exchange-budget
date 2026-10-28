import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ACCESS_COOKIE_NAME, getLedgerByAccessCode } from "@/lib/auth/ledger-access";
import { getDatabase } from "@/lib/db";
import { parseManualRate } from "@/lib/expenses/validation";
import { getExchangeRate } from "@/lib/ledger/initial-fund-rate";
import { validateIncomeInput } from "@/lib/incomes/validation";

async function currentLedger() {
  const code = (await cookies()).get(ACCESS_COOKIE_NAME)?.value;
  return getLedgerByAccessCode(code);
}

export async function GET() {
  let ledger;
  try { ledger = await currentLedger(); } catch {
    return NextResponse.json({ error: "가계부를 불러오지 못했습니다." }, { status: 503 });
  }
  if (!ledger?.nickname) return NextResponse.json({ error: "가계부 코드로 접속해 주세요." }, { status: 401 });

  try {
    const sql = getDatabase();
    const incomes = await sql`
      SELECT id, to_char(date, 'YYYY-MM-DD') AS date, category, description,
        amount::text AS amount, currency, rate_to_krw::text AS rate_to_krw,
        rate_source, to_char(rate_date, 'YYYY-MM-DD') AS rate_date,
        round(amount * rate_to_krw, 2)::text AS converted_amount_krw,
        memo, (date > CURRENT_DATE) AS is_planned
      FROM incomes WHERE ledger_id = ${ledger.id}
      ORDER BY date DESC, created_at DESC
    `;
    const totals = await sql`
      SELECT COALESCE(SUM(round(amount * rate_to_krw, 2)), 0)::text AS total_income_krw
      FROM incomes WHERE ledger_id = ${ledger.id}
    `;
    return NextResponse.json({ incomes, total_income_krw: totals[0]?.total_income_krw ?? "0" });
  } catch {
    return NextResponse.json({ error: "수입 목록을 불러오지 못했습니다." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  let ledger;
  try { ledger = await currentLedger(); } catch {
    return NextResponse.json({ error: "가계부를 확인하지 못했습니다." }, { status: 503 });
  }
  if (!ledger?.nickname) return NextResponse.json({ error: "가계부 코드로 접속해 주세요." }, { status: 401 });

  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "입력 내용을 확인해 주세요." }, { status: 400 });
  }
  const input = validateIncomeInput(body);
  if (!input) return NextResponse.json({ error: "날짜, 종류, 금액 또는 통화를 확인해 주세요." }, { status: 400 });

  let rate: string;
  let source: "frankfurter" | "manual" | "krw";
  let rateDate: string;
  try {
    const result = await getExchangeRate(input.date, input.currency);
    rate = String(result.rate);
    source = input.currency === "KRW" ? "krw" : "frankfurter";
    rateDate = result.date;
  } catch {
    if (input.currency === "KRW") {
      rate = "1";
      source = "krw";
      rateDate = input.date;
    } else {
      const manualRate = parseManualRate(input.manualRate);
      if (!manualRate) return NextResponse.json({ error: "환율 자동 조회에 실패했습니다. 직접 환율을 입력해 주세요.", requiresManualRate: true }, { status: 422 });
      rate = manualRate;
      source = "manual";
      rateDate = input.date;
    }
  }

  try {
    const sql = getDatabase();
    const rows = await sql`
      INSERT INTO incomes (ledger_id, date, category, description, amount, currency, rate_to_krw, rate_source, rate_date, memo)
      VALUES (${ledger.id}, ${input.date}, ${input.category}, ${input.description}, ${input.amount}, ${input.currency}, ${rate}, ${source}, ${rateDate}, ${input.memo})
      RETURNING id
    `;
    return NextResponse.json({ ok: true, id: rows[0].id }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "수입을 저장하지 못했습니다." }, { status: 503 });
  }
}
