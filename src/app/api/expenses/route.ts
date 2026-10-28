import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ACCESS_COOKIE_NAME, getLedgerByAccessCode } from "@/lib/auth/ledger-access";
import { getDatabase } from "@/lib/db";
import { getExpenseSection } from "@/lib/expenses/validation";
import { getExchangeRate } from "@/lib/ledger/initial-fund-rate";
import { parseManualRate, validateExpenseInput } from "@/lib/expenses/validation";

async function getCurrentLedger() {
  const accessCode = (await cookies()).get(ACCESS_COOKIE_NAME)?.value;
  return getLedgerByAccessCode(accessCode);
}

export async function GET(request: Request) {
  let ledger;
  try {
    ledger = await getCurrentLedger();
  } catch {
    return NextResponse.json({ error: "가계부를 불러오지 못했습니다." }, { status: 503 });
  }

  if (!ledger?.nickname) return NextResponse.json({ error: "가계부 코드로 접속해 주세요." }, { status: 401 });

  const sectionParam = new URL(request.url).searchParams.get("section") ?? "";
  const section = getExpenseSection(sectionParam);
  if (!section) return NextResponse.json({ error: "지출 구분이 올바르지 않습니다." }, { status: 400 });

  try {
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
      WHERE ledger_id = ${ledger.id} AND section = ${section}
      ORDER BY date DESC, created_at DESC
    `;
    const totals = await sql`
      SELECT
        COALESCE(SUM(converted_amount_krw), 0)::text AS section_total_krw,
        COALESCE((
          SELECT SUM(converted_amount_krw)
          FROM expenses
          WHERE ledger_id = ${ledger.id}
        ), 0)::text AS total_expense_krw,
        round(${ledger.initial_fund_amount}::numeric * ${ledger.initial_fund_rate_to_krw}::numeric, 2)::text AS initial_fund_krw
      FROM expenses
      WHERE ledger_id = ${ledger.id} AND section = ${section}
    `;

    return NextResponse.json({ expenses, ...totals[0] });
  } catch {
    return NextResponse.json({ error: "지출 목록을 불러오지 못했습니다." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  let ledger;
  try {
    ledger = await getCurrentLedger();
  } catch {
    return NextResponse.json({ error: "가계부를 확인하지 못했습니다." }, { status: 503 });
  }

  if (!ledger?.nickname) return NextResponse.json({ error: "가계부 코드로 접속해 주세요." }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "입력 내용을 확인해 주세요." }, { status: 400 });
  }

  const sectionParam = typeof body === "object" && body !== null && "section" in body
    ? String((body as Record<string, unknown>).section)
    : "";
  const input = validateExpenseInput(body, sectionParam);
  if (!input) return NextResponse.json({ error: "날짜, 카테고리, 내용, 금액 또는 통화를 확인해 주세요." }, { status: 400 });

  let rateToKrw: string;
  let rateSource: "frankfurter" | "manual" | "krw";
  let rateDate: string;
  try {
    const result = await getExchangeRate(input.date, input.currency);
    rateToKrw = String(result.rate);
    rateSource = input.currency === "KRW" ? "krw" : "frankfurter";
    rateDate = result.date;
  } catch {
    if (input.currency === "KRW") {
      rateToKrw = "1";
      rateSource = "krw";
      rateDate = input.date;
    } else {
      const manualRate = parseManualRate(input.manualRate);
      if (!manualRate) {
        return NextResponse.json({
          error: "환율 자동 조회에 실패했습니다. 직접 환율을 입력해 주세요.",
          requiresManualRate: true,
        }, { status: 422 });
      }
      rateToKrw = manualRate;
      rateSource = "manual";
      rateDate = input.date;
    }
  }

  try {
    const sql = getDatabase();
    const rows = await sql`
      INSERT INTO expenses (
        ledger_id, section, date, category, description, amount, currency,
        rate_to_krw, rate_source, rate_date, converted_amount_krw, memo
      )
      VALUES (
        ${ledger.id}, ${sectionParam}, ${input.date}, ${input.category}, ${input.description},
        ${input.amount}, ${input.currency}, ${rateToKrw}, ${rateSource}, ${rateDate},
        round(${input.amount}::numeric * ${rateToKrw}::numeric, 2), ${input.memo}
      )
      RETURNING id
    `;

    return NextResponse.json({ ok: true, id: rows[0].id }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "지출을 저장하지 못했습니다." }, { status: 503 });
  }
}