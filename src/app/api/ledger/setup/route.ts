import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ACCESS_COOKIE_NAME, getLedgerByAccessCode } from "@/lib/auth/ledger-access";
import { getDatabase } from "@/lib/db";
import { getInitialFundRate } from "@/lib/ledger/initial-fund-rate";

type SetupPayload = {
  nickname?: unknown;
  initialFundAmount?: unknown;
  initialFundCurrency?: unknown;
  manualRate?: unknown;
};

function parseAmount(value: unknown) {
  if (typeof value !== "string" && typeof value !== "number") return null;
  const amountText = String(value).trim();
  if (!/^\d{1,14}(\.\d{1,6})?$/.test(amountText)) return null;

  const amount = Number(amountText);
  return Number.isFinite(amount) ? amountText : null;
}

function parseManualRate(value: unknown) {
  if (typeof value !== "string" && typeof value !== "number") return null;
  const rateText = String(value).trim();
  if (!/^\d{1,10}(\.\d{1,8})?$/.test(rateText)) return null;

  const rate = Number(rateText);
  return Number.isFinite(rate) && rate > 0 ? rateText : null;
}

async function saveSetup(request: Request, mode: "create" | "update") {
  const accessCode = (await cookies()).get(ACCESS_COOKIE_NAME)?.value;
  let ledger;

  try {
    ledger = await getLedgerByAccessCode(accessCode);
  } catch {
    return NextResponse.json({ error: "가계부를 확인하지 못했습니다." }, { status: 503 });
  }

  if (!ledger) {
    return NextResponse.json({ error: "가계부 코드로 다시 접속해 주세요." }, { status: 401 });
  }

  if (mode === "create" && ledger.nickname) {
    return NextResponse.json({ error: "첫 설정이 이미 완료된 가계부입니다." }, { status: 409 });
  }

  if (mode === "update" && !ledger.nickname) {
    return NextResponse.json({ error: "먼저 첫 설정을 완료해 주세요." }, { status: 409 });
  }

  let payload: SetupPayload;
  try {
    payload = (await request.json()) as SetupPayload;
  } catch {
    return NextResponse.json({ error: "입력 내용을 확인해 주세요." }, { status: 400 });
  }

  const nickname = typeof payload.nickname === "string" ? payload.nickname.trim() : "";
  const nicknameLength = Array.from(nickname).length;
  if (nicknameLength < 1 || nicknameLength > 8) {
    return NextResponse.json({ error: "닉네임은 1~8자로 입력해 주세요." }, { status: 400 });
  }

  const today = new Date().toISOString().slice(0, 10);

  const initialFundAmount = parseAmount(payload.initialFundAmount);
  if (initialFundAmount === null) {
    return NextResponse.json({ error: "시작 자금은 0 이상의 금액으로 입력해 주세요." }, { status: 400 });
  }

  const initialFundCurrency = typeof payload.initialFundCurrency === "string"
    ? payload.initialFundCurrency.trim().toUpperCase()
    : "";
  if (!/^[A-Z]{3}$/.test(initialFundCurrency)) {
    return NextResponse.json({ error: "통화를 선택해 주세요." }, { status: 400 });
  }

  const oldCurrency = String(ledger.initial_fund_currency ?? "").trim();
  const rateIsUnchanged = Boolean(ledger.nickname) && oldCurrency === initialFundCurrency;
  let rateToKrw: string;
  let rateSource: "frankfurter" | "manual" | "krw";
  let rateDate: string;

  if (rateIsUnchanged) {
    rateToKrw = String(ledger.initial_fund_rate_to_krw);
    rateSource = ledger.initial_fund_rate_source;
    rateDate = ledger.initial_fund_rate_date;
  } else if (initialFundCurrency === "KRW") {
    rateToKrw = "1";
    rateSource = "krw";
    rateDate = today;
  } else {
    try {
      const rate = await getInitialFundRate(today, initialFundCurrency);
      rateToKrw = String(rate.rate);
      rateSource = "frankfurter";
      rateDate = rate.date;
    } catch {
      const manualRate = parseManualRate(payload.manualRate);
      if (!manualRate) {
        return NextResponse.json({
          error: "환율 자동 조회에 실패했습니다. 직접 입력한 뒤 다시 저장해 주세요.",
          requiresManualRate: true,
        }, { status: 422 });
      }

      rateToKrw = manualRate;
      rateSource = "manual";
      rateDate = today;
    }
  }

  try {
    const sql = getDatabase();
    await sql`
      UPDATE ledgers
      SET
        nickname = ${nickname},
        start_date = CASE WHEN ${mode} = 'create' THEN CURRENT_DATE ELSE start_date END,
        initial_fund_amount = ${initialFundAmount},
        initial_fund_currency = ${initialFundCurrency},
        initial_fund_rate_to_krw = ${rateToKrw},
        initial_fund_rate_source = ${rateSource},
        initial_fund_rate_date = ${rateDate},
        updated_at = now()
      WHERE id = ${ledger.id}
    `;

    return NextResponse.json({ ok: true, nickname });
  } catch {
    return NextResponse.json({ error: "설정을 저장하지 못했습니다. 다시 시도해 주세요." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  return saveSetup(request, "create");
}

export async function PATCH(request: Request) {
  return saveSetup(request, "update");
}