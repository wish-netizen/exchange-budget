import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ACCESS_COOKIE_NAME, getLedgerByAccessCode } from "@/lib/auth/ledger-access";
import { getDatabase } from "@/lib/db";

function isValidMonth(value: string) {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(value)) return false;
  const [year, month] = value.split("-").map(Number);
  return year >= 1900 && year <= 9999 && month >= 1 && month <= 12;
}

export async function GET(request: Request) {
  const accessCode = (await cookies()).get(ACCESS_COOKIE_NAME)?.value;
  let ledger;
  try {
    ledger = await getLedgerByAccessCode(accessCode);
  } catch {
    return NextResponse.json({ error: "가계부를 확인하지 못했습니다." }, { status: 503 });
  }
  if (!ledger?.nickname) {
    return NextResponse.json({ error: "가계부 코드로 접속해 주세요." }, { status: 401 });
  }

  const month = new URL(request.url).searchParams.get("month") ?? "";
  if (month !== "all" && !isValidMonth(month)) {
    return NextResponse.json({ error: "월을 YYYY-MM 형식으로 선택해 주세요." }, { status: 400 });
  }

  try {
    const sql = getDatabase();
    const rows = month === "all"
      ? await sql`
          SELECT section, category, SUM(converted_amount_krw)::text AS amount_krw
          FROM expenses
          WHERE ledger_id = ${ledger.id}
          GROUP BY section, category
          ORDER BY section, category
        `
      : await sql`
          SELECT section, category, SUM(converted_amount_krw)::text AS amount_krw
          FROM expenses
          WHERE ledger_id = ${ledger.id}
            AND date >= ${`${month}-01`}::date
            AND date < (${`${month}-01`}::date + INTERVAL '1 month')
          GROUP BY section, category
          ORDER BY section, category
        `;

    const categories = rows.map((row) => ({
      section: String(row.section),
      category: String(row.category),
      amountKrw: String(row.amount_krw),
    }));
    const totalKrw = categories.reduce((total, item) => total + Number(item.amountKrw), 0);

    return NextResponse.json({ month, categories, totalKrw: totalKrw.toFixed(2) });
  } catch {
    return NextResponse.json({ error: "지출 분석을 불러오지 못했습니다." }, { status: 503 });
  }
}
