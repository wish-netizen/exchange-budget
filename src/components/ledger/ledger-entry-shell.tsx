import Link from "next/link";
import { ArrowLeft, PiggyBank } from "lucide-react";
import type { ReactNode } from "react";

type LedgerEntryShellProps = {
  children: ReactNode;
  heading: string;
  eyebrow: string;
};

export function LedgerEntryShell({ children, heading, eyebrow }: LedgerEntryShellProps) {
  return (
    <main className="app-shell">
      <header className="app-header">
        <Link className="brand-link" href="/">
          <span className="brand-mark" aria-hidden="true"><PiggyBank size={21} /></span>
          <span>내 교환 가계부</span>
        </Link>
        <Link className="back-link" href="/"><ArrowLeft size={16} /> 처음으로</Link>
      </header>
      <section className="entry-page" aria-labelledby="entry-page-title">
        <p className="eyebrow"><PiggyBank aria-hidden="true" size={16} /> {eyebrow}</p>
        <h1 className="page-title" id="entry-page-title">{heading}</h1>
        {children}
      </section>
      <footer className="app-footer">준비 · 생활 · 여행, 흩어진 지출을 한곳에</footer>
    </main>
  );
}