import { NextResponse } from "next/server";
import { CURRENCY_CODES } from "@/lib/currencies";
import { getExchangeRate } from "@/lib/ledger/initial-fund-rate";

function isDate(value: string | null): value is string {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");
  const currency = searchParams.get("currency")?.toUpperCase() ?? "";
  const amount = Number(searchParams.get("amount") ?? "0");

  if (!isDate(date) || !CURRENCY_CODES.has(currency as never) || !Number.isFinite(amount) || amount < 0) {
    return NextResponse.json({ error: "날짜, 통화 또는 금액을 확인해 주세요." }, { status: 400 });
  }

  try {
    const result = await getExchangeRate(date, currency);
    const future = date > new Date().toISOString().slice(0, 10);
    return NextResponse.json({
      rate: result.rate,
      rateDate: result.date,
      convertedAmountKrw: Math.round(amount * result.rate * 100) / 100,
      isPlanned: future,
      source: currency === "KRW" ? "krw" : "frankfurter",
    });
  } catch {
    return NextResponse.json({
      error: "환율 자동 조회에 실패했습니다. 직접 환율을 입력해 주세요.",
      requiresManualRate: true,
    }, { status: 503 });
  }
}