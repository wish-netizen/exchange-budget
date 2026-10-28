type FrankfurterRateResponse = {
  date: string;
  rates: Record<string, number>;
};

export type InitialFundRate = {
  rate: number;
  date: string;
};

export async function getExchangeRate(date: string, currency: string): Promise<InitialFundRate> {
  if (currency === "KRW") {
    return { rate: 1, date };
  }

  const today = new Date().toISOString().slice(0, 10);
  const isFutureDate = date > today;
  const endpoint = isFutureDate ? "latest" : date;
  const url = new URL(`https://api.frankfurter.app/${endpoint}`);
  url.searchParams.set("from", currency);
  url.searchParams.set("to", "KRW");

  const response = await fetch(url, {
    cache: "no-store",
    signal: AbortSignal.timeout(8000),
  });

  if (!response.ok) {
    throw new Error("Frankfurter 환율 조회에 실패했습니다.");
  }

  const result = (await response.json()) as FrankfurterRateResponse;
  const rate = result.rates.KRW;

  if (!Number.isFinite(rate) || rate <= 0 || !result.date) {
    throw new Error("응답에 유효한 KRW 환율이 없습니다.");
  }

  return { rate, date: result.date };
}

export const getInitialFundRate = getExchangeRate;