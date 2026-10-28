import { AccessLedgerForm } from "@/components/ledger/access-ledger-form";
import { LedgerEntryShell } from "@/components/ledger/ledger-entry-shell";

export default function AccessLedgerPage() {
  return (
    <LedgerEntryShell eyebrow="기존 가계부" heading="코드로 이어서 기록해요">
      <AccessLedgerForm />
    </LedgerEntryShell>
  );
}