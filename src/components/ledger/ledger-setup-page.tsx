import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { LedgerEntryShell } from "@/components/ledger/ledger-entry-shell";
import { LedgerSetupForm } from "@/components/ledger/ledger-setup-form";
import { ACCESS_COOKIE_NAME, getLedgerByAccessCode } from "@/lib/auth/ledger-access";

type LedgerSetupPageProps = {
  mode: "create" | "update";
};

export function LedgerSetupPage({ mode }: LedgerSetupPageProps) {
  return (
    <Suspense fallback={<SetupLoading />}>
      <LedgerSetupContent mode={mode} />
    </Suspense>
  );
}

async function LedgerSetupContent({ mode }: LedgerSetupPageProps) {
  const accessCode = (await cookies()).get(ACCESS_COOKIE_NAME)?.value;
  let ledger = null;

  try {
    ledger = await getLedgerByAccessCode(accessCode);
  } catch {
    redirect("/");
  }

  if (!ledger) redirect("/");
  if (mode === "create" && ledger.nickname) redirect("/");
  if (mode === "update" && !ledger.nickname) redirect("/setup");

  const initialValues = mode === "update" ? {
    nickname: String(ledger.nickname),
    initialFundAmount: String(ledger.initial_fund_amount),
    initialFundCurrency: String(ledger.initial_fund_currency).trim(),
  } : undefined;

  return (
    <LedgerEntryShell
      eyebrow={mode === "create" ? "첫 설정" : "가계부 설정"}
      heading={mode === "create" ? "나에게 맞게 준비해요" : "가계부 정보를 수정해요"}
    >
      <LedgerSetupForm initialValues={initialValues} mode={mode} />
    </LedgerEntryShell>
  );
}

function SetupLoading() {
  return (
    <LedgerEntryShell eyebrow="가계부 설정" heading="설정을 불러오고 있어요">
      <div aria-busy="true" className="entry-panel setup-loading" />
    </LedgerEntryShell>
  );
}