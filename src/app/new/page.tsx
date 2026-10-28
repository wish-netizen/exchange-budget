import { CreateLedgerPanel } from "@/components/ledger/create-ledger-panel";
import { LedgerEntryShell } from "@/components/ledger/ledger-entry-shell";

export default function NewLedgerPage() {
  return (
    <LedgerEntryShell eyebrow="새 가계부" heading="새 기록을 시작해요">
      <CreateLedgerPanel />
    </LedgerEntryShell>
  );
}