import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { ExpenseSectionPage } from "@/components/expense/expense-section-page";
import type { ExpenseRecord } from "@/components/expense/expense-form";
import { ACCESS_COOKIE_NAME, getLedgerByAccessCode } from "@/lib/auth/ledger-access";
import { isExpenseSection } from "@/lib/expenses/categories";
import { getExpenseSectionData } from "@/lib/expenses/queries";

export default function ExpensesPage({ params }: PageProps<"/expenses/[section]">) {
  return (
    <Suspense fallback={<main className="app-shell"><p role="status">지출 화면을 여는 중...</p></main>}>
      <ExpensePageContent params={params} />
    </Suspense>
  );
}

async function ExpensePageContent({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  if (!isExpenseSection(section)) notFound();

  const accessCode = (await cookies()).get(ACCESS_COOKIE_NAME)?.value;
  let ledger;
  try {
    ledger = await getLedgerByAccessCode(accessCode);
  } catch {
    redirect("/");
  }

  if (!ledger?.nickname) redirect(ledger ? "/setup" : "/");

  let initialExpenses: ExpenseRecord[] = [];
  let initialTotal = "0";
  let initialError: string | undefined;
  try {
    const data = await getExpenseSectionData(String(ledger.id), section);
    initialExpenses = data.expenses as unknown as ExpenseRecord[];
    initialTotal = data.sectionTotalKrw;
  } catch {
    initialError = "지출 목록을 불러오지 못했습니다.";
  }

  return <ExpenseSectionPage initialError={initialError} initialExpenses={initialExpenses} initialTotal={initialTotal} section={section} />;
}