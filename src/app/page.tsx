import Link from "next/link";
import { cookies } from "next/headers";
import { Suspense } from "react";
import { ArrowUpRight, KeyRound, Plane, PiggyBank, Plus } from "lucide-react";
import { BalanceSummaryCard } from "@/components/ledger/balance-summary-card";
import { SectionTabs } from "@/components/ledger/section-tabs";
import { LeaveLedgerButton } from "@/components/ledger/leave-ledger-button";
import { ACCESS_COOKIE_NAME, getLedgerByAccessCode } from "@/lib/auth/ledger-access";

export default function Home() {
  return (
    <Suspense fallback={<HomeLoading />}>
      <HomeContent />
    </Suspense>
  );
}

async function HomeContent() {
  const accessCode = (await cookies()).get(ACCESS_COOKIE_NAME)?.value;
  let ledger = null;

  try {
    ledger = await getLedgerByAccessCode(accessCode);
  } catch {
    ledger = null;
  }

  return (
    <main className="app-shell">
      <header className="app-header">
        <Link className="brand-link" href="/">
          <span className="brand-mark" aria-hidden="true"><PiggyBank size={21} /></span>
          <span>내 교환 가계부</span>
        </Link>
        {ledger ? (
          <LeaveLedgerButton />
        ) : (
          <span className="header-note"><Plane aria-hidden="true" size={16} /> 교환학생 지출 기록</span>
        )}
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

        {ledger ? (
          <>
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
                <p><ArrowUpRight aria-hidden="true" size={13} /> 다음 단계에서 첫 지출을 기록할 수 있어요.</p>
              </div>
            </section>
          </>
        ) : (
          <section className="entry-card" aria-labelledby="entry-title">
            <span className="entry-icon" aria-hidden="true"><KeyRound size={25} /></span>
            <h2 id="entry-title">가계부를 시작해볼까요?</h2>
            <p>새 코드를 발급받거나, 기존 가계부 코드로 이어서 기록하세요.</p>
            <div className="entry-actions">
              <Link className="button-primary" href="/new">새 가계부 만들기 <ArrowUpRight size={17} /></Link>
              <Link className="button-secondary" href="/access">가계부 코드 입력</Link>
            </div>
            <p className="entry-footnote">코드는 데이터를 여는 열쇠예요. 분실하면 복구할 수 없습니다.</p>
          </section>
        )}
      </div>

      <footer className="app-footer">준비 · 생활 · 여행, 흩어진 지출을 한곳에</footer>
    </main>
  );
}

function HomeLoading() {
  return (
    <main className="app-shell">
      <header className="app-header">
        <span className="brand-link">
          <span className="brand-mark" aria-hidden="true"><PiggyBank size={21} /></span>
          <span>내 교환 가계부</span>
        </span>
      </header>
      <section className="entry-card" role="status">
        <span className="entry-icon" aria-hidden="true"><KeyRound size={25} /></span>
        <h2>가계부를 확인하고 있어요</h2>
      </section>
    </main>
  );
}
