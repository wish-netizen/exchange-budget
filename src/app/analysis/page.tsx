import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { ExpenseAnalysisView } from "@/components/analysis/expense-analysis-view";
import { ACCESS_COOKIE_NAME, getLedgerByAccessCode } from "@/lib/auth/ledger-access";

export default function ExpenseAnalysisPage() {
  return (
    <Suspense fallback={<main className="app-shell"><p role="status">분석 화면을 여는 중...</p></main>}>
      <ExpenseAnalysisContent />
    </Suspense>
  );
}

async function ExpenseAnalysisContent() {
  const accessCode = (await cookies()).get(ACCESS_COOKIE_NAME)?.value;
  let ledger;
  try {
    ledger = await getLedgerByAccessCode(accessCode);
  } catch {
    redirect("/");
  }
  if (!ledger?.nickname) redirect(ledger ? "/setup" : "/");
  return <ExpenseAnalysisView />;
}
