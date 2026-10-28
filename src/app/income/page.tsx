import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { IncomePage } from "@/components/income/income-page";
import type { IncomeRecord } from "@/components/income/income-form";
import { ACCESS_COOKIE_NAME, getLedgerByAccessCode } from "@/lib/auth/ledger-access";
import { getIncomePageData } from "@/lib/incomes/queries";

export default function IncomeRoute() {
  return <Suspense fallback={<main className="app-shell"><p role="status">수입 화면을 여는 중...</p></main>}><IncomeRouteContent /></Suspense>;
}

async function IncomeRouteContent() {
  const accessCode = (await cookies()).get(ACCESS_COOKIE_NAME)?.value;
  let ledger;
  try { ledger = await getLedgerByAccessCode(accessCode); } catch { redirect("/"); }
  if (!ledger?.nickname) redirect(ledger ? "/setup" : "/");

  let initialIncomes: IncomeRecord[] = [];
  let initialTotal = "0";
  let initialError: string | undefined;
  try {
    const data = await getIncomePageData(String(ledger.id));
    initialIncomes = data.incomes as unknown as IncomeRecord[];
    initialTotal = data.totalIncomeKrw;
  } catch {
    initialError = "수입 목록을 불러오지 못했습니다.";
  }
  return <IncomePage initialError={initialError} initialIncomes={initialIncomes} initialTotal={initialTotal} />;
}
