import { Banknote, CircleDollarSign, Wallet } from "lucide-react";

export function BalanceSummaryCard() {
  return (
    <section aria-label="현재 남은 금액" className="summary-card balance-card">
      <div>
        <p className="balance-label">
          <Wallet aria-hidden="true" size={17} />
          현재 남은 금액
        </p>
        <p className="balance-amount">₩0</p>
        <p className="balance-caption">가계부를 만들면 내역이 여기에 모여요</p>
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