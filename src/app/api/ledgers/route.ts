import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { ACCESS_COOKIE_NAME, hashAccessCode } from "@/lib/auth/ledger-access";
import { getDatabase } from "@/lib/db";

const cookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: "strict" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 365,
};

export async function POST() {
  const accessCode = randomBytes(32).toString("base64url");

  try {
    const sql = getDatabase();
    await sql`
      INSERT INTO ledgers (
        access_code_hash,
        start_date,
        initial_fund_amount,
        initial_fund_currency,
        initial_fund_rate_to_krw,
        initial_fund_rate_source,
        initial_fund_rate_date
      )
      VALUES (
        ${hashAccessCode(accessCode)},
        CURRENT_DATE,
        0,
        'KRW',
        1,
        'krw',
        CURRENT_DATE
      )
    `;

    const response = NextResponse.json({ accessCode }, { status: 201 });
    response.cookies.set(ACCESS_COOKIE_NAME, accessCode, cookieOptions);
    return response;
  } catch {
    return NextResponse.json(
      { error: "가계부를 만들지 못했습니다. 데이터베이스 설정을 확인해 주세요." },
      { status: 503 },
    );
  }
}