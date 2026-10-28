import { NextResponse } from "next/server";
import {
  ACCESS_COOKIE_NAME,
  getLedgerByAccessCode,
} from "@/lib/auth/ledger-access";

const cookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: "strict" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 365,
};

export async function POST(request: Request) {
  let accessCode: unknown;

  try {
    ({ accessCode } = await request.json());
  } catch {
    return NextResponse.json({ error: "가계부 코드를 입력해 주세요." }, { status: 400 });
  }

  if (typeof accessCode !== "string" || !/^[A-Za-z0-9_-]{43}$/.test(accessCode.trim())) {
    return NextResponse.json({ error: "가계부 코드 형식을 확인해 주세요." }, { status: 400 });
  }

  try {
    const ledger = await getLedgerByAccessCode(accessCode.trim());

    if (!ledger) {
      return NextResponse.json({ error: "일치하는 가계부 코드가 없습니다." }, { status: 401 });
    }

    const response = NextResponse.json({ ok: true });
    response.cookies.set(ACCESS_COOKIE_NAME, accessCode.trim(), cookieOptions);
    return response;
  } catch {
    return NextResponse.json(
      { error: "가계부를 확인하지 못했습니다. 데이터베이스 설정을 확인해 주세요." },
      { status: 503 },
    );
  }
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(ACCESS_COOKIE_NAME, "", {
    ...cookieOptions,
    maxAge: 0,
  });
  return response;
}