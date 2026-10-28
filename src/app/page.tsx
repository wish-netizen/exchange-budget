import Link from "next/link";
import { ArrowUpRight, Plane, PiggyBank, Plus } from "lucide-react";
import { BalanceSummaryCard } from "@/components/ledger/balance-summary-card";
import { SectionTabs } from "@/components/ledger/section-tabs";

export default function Home() {
  return (
    <main className="app-shell">
      <header className="app-header">
        <Link className="brand-link" href="/">
          <span className="brand-mark" aria-hidden="true"><PiggyBank size={21} /></span>
          <span>내 교환 가계부</span>
        </Link>
        <span className="header-note"><Plane aria-hidden="true" size={16} /> 교환학생 지출 기록</span>
      </header>

      <div className="dashboard">
        <section className="welcome-row" aria-labelledby="page-title">
          <div className="welcome-copy">
            <p className="eyebrow"><PiggyBank aria-hidden="true" size={16} /> 나의 교환학생 생활</p>
            <h1 className="page-title" id="page-title">교환학생 가계부</h1>
            <p className="welcome-description">출국 준비부터 여행까지, 내 돈이 어디로 가는지 한눈에</p>
          </div>
          <span className="flight-stamp" aria-hidden="true"><Plane size={30} /></span>
        </section>

        <BalanceSummaryCard />

        <section className="section-navigation" aria-labelledby="section-title">
          <div className="section-heading">
            <h2 id="section-title">지출 내역</h2>
            <span>기록을 시작할 항목을 골라보세요</span>
          </div>
          <SectionTabs />
        </section>

        <section className="empty-ledger-card" aria-label="가계부 시작 안내">
          <span className="empty-icon" aria-hidden="true"><Plus size={21} /></span>
          <div>
            <strong>아직 기록된 지출이 없어요</strong>
            <p><ArrowUpRight aria-hidden="true" size={13} /> 다음 단계에서 가계부 코드를 만들고 첫 지출을 기록할 수 있어요.</p>
          </div>
        </section>
      </div>

      <footer className="app-footer">준비 · 생활 · 여행, 흩어진 지출을 한곳에</footer>
    </main>
  );
}
