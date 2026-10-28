import { Banknote, CircleDollarSign, Wallet } from "lucide-react";

export function TravelMoneyCard() {
  return (
    <section aria-label="여행 가계부 소개" className="summary-card balance-card travel-money-card">
      <div>
        <p className="balance-label"><Wallet aria-hidden="true" size={17} /> 교환학생의 돈 관리</p>
        <p className="travel-money-title">여러 나라의 지출도<br />한눈에 정리해요</p>
        <p className="balance-caption">준비 비용부터 현지 생활비까지, 원화 기준으로</p>
      </div>
      <div className="wallet-art" aria-hidden="true">
        <Wallet className="wallet-main-icon" size={48} strokeWidth={1.7} />
        <Banknote className="wallet-note-icon" size={36} strokeWidth={1.6} />
        <span className="wallet-coin">
          <CircleDollarSign size={23} strokeWidth={1.8} />
        </span>
      </div>
    </section>
  );
}