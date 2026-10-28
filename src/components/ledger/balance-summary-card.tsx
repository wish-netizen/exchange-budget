import { Banknote, CircleDollarSign, Wallet } from "lucide-react";

export function BalanceSummaryCard({ remainingAmount }: { remainingAmount: string }) {
  const formattedAmount = `₩${new Intl.NumberFormat("ko-KR", { maximumFractionDigits: 0 }).format(Math.round(Number(remainingAmount) || 0))}`;

  return (
    <section aria-label="현재 남은 금액" className="summary-card balance-card">
      <div>
        <p className="balance-label">
          <Wallet aria-hidden="true" size={17} />
          현재 남은 금액
        </p>
        <p className="balance-amount">{formattedAmount}</p>
        <p className="balance-caption">시작 자금에서 지출을 뺀 금액</p>
      </div>
      <div className="wallet-art" aria-hidden="true">
        <Wallet size={48} strokeWidth={1.7} />
        <span className="wallet-coin">
          <CircleDollarSign size={23} strokeWidth={1.8} />
        </span>
        <Banknote className="wallet-note-icon" size={32} strokeWidth={1.6} />
      </div>
    </section>
  );
}