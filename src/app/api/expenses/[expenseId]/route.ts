import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ACCESS_COOKIE_NAME, getLedgerByAccessCode } from "@/lib/auth/ledger-access";
import { getDatabase } from "@/lib/db";
import { getExpenseSection, parseManualRate, validateExpenseInput } from "@/lib/expenses/validation";
import { getExchangeRate } from "@/lib/ledger/initial-fund-rate";

type ExpenseRouteContext = RouteContext<"/api/expenses/[expenseId]">;

export async function PATCH(request: Request, context: ExpenseRouteContext) {
  const { expenseId } = await context.params;
  const accessCode = (await cookies()).get(ACCESS_COOKIE_NAME)?.value;
  let ledger;

  try {
    ledger = await getLedgerByAccessCode(accessCode);
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
  const section = getExpenseSection(sectionParam);
  const input = validateExpenseInput(body, sectionParam);
  if (!section || !input) return NextResponse.json({ error: "지출 정보를 확인해 주세요." }, { status: 400 });

  const sql = getDatabase();
  let existing;
  try {
    const rows = await sql`
      SELECT date::text AS date, currency, rate_to_krw::text AS rate_to_krw,
        rate_source, rate_date::text AS rate_date
      FROM expenses
      WHERE id = ${expenseId} AND ledger_id = ${ledger.id}
      LIMIT 1
    `;
    existing = rows[0];
  } catch {
    return NextResponse.json({ error: "지출을 불러오지 못했습니다." }, { status: 503 });
  }
  if (!existing) return NextResponse.json({ error: "지출을 찾을 수 없습니다." }, { status: 404 });

  const rateChanged = String(existing.date).slice(0, 10) !== input.date
    || String(existing.currency).trim() !== input.currency;
  let rateToKrw = String(existing.rate_to_krw);
  let rateSource = existing.rate_source as "frankfurter" | "manual" | "krw";
  let rateDate = String(existing.rate_date).slice(0, 10);

  if (rateChanged) {
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
  }

  try {
    await sql`
      UPDATE expenses
      SET
        section = ${section},
        date = ${input.date},
        category = ${input.category},
        description = ${input.description},
        amount = ${input.amount},
        currency = ${input.currency},
        rate_to_krw = ${rateToKrw},
        rate_source = ${rateSource},
        rate_date = ${rateDate},
        converted_amount_krw = round(${input.amount}::numeric * ${rateToKrw}::numeric, 2),
        memo = ${input.memo},
        updated_at = now()
      WHERE id = ${expenseId} AND ledger_id = ${ledger.id}
    `;
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "지출을 수정하지 못했습니다." }, { status: 503 });
  }
}

export async function DELETE(_request: Request, context: ExpenseRouteContext) {
  const { expenseId } = await context.params;
  const accessCode = (await cookies()).get(ACCESS_COOKIE_NAME)?.value;
  let ledger;

  try {
    ledger = await getLedgerByAccessCode(accessCode);
  } catch {
    return NextResponse.json({ error: "가계부를 확인하지 못했습니다." }, { status: 503 });
  }
  if (!ledger?.nickname) return NextResponse.json({ error: "가계부 코드로 접속해 주세요." }, { status: 401 });

  try {
    const sql = getDatabase();
    const rows = await sql`
      DELETE FROM expenses
      WHERE id = ${expenseId} AND ledger_id = ${ledger.id}
      RETURNING id
    `;
    if (!rows.length) return NextResponse.json({ error: "지출을 찾을 수 없습니다." }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "지출을 삭제하지 못했습니다." }, { status: 503 });
  }
}