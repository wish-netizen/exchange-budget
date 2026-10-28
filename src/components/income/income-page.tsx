"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, CalendarDays, Pencil, Plus, Trash2 } from "lucide-react";
import { IncomeForm, type IncomeRecord } from "@/components/income/income-form";
import type { IncomeCategory } from "@/lib/incomes/validation";

const labels: Record<IncomeCategory, string> = { scholarship: "장학금", allowance: "용돈", part_time: "아르바이트", other: "기타" };
const formatKrw = (value: string | number) => `₩${new Intl.NumberFormat("ko-KR", { maximumFractionDigits: 0 }).format(Math.round(Number(value) || 0))}`;
const formatAmount = (amount: string, currency: string) => `${new Intl.NumberFormat("ko-KR", { maximumFractionDigits: 2 }).format(Number(amount))} ${currency}`;

type IncomePageProps = { initialIncomes: IncomeRecord[]; initialTotal: string; initialError?: string };
type IncomeResponse = { incomes: IncomeRecord[]; total_income_krw: string; error?: string };

export function IncomePage({ initialIncomes, initialTotal, initialError }: IncomePageProps) {
  const [incomes, setIncomes] = useState(initialIncomes);
  const [total, setTotal] = useState(initialTotal);
  const [error, setError] = useState(initialError ?? null);
  const [loading, setLoading] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<IncomeRecord | undefined>();

  async function reload() {
    setLoading(true);
    try {
      const response = await fetch("/api/incomes", { cache: "no-store" });
      const result = await response.json() as IncomeResponse;
      if (!response.ok) throw new Error(result.error ?? "수입 목록을 불러오지 못했습니다.");
      setIncomes(result.incomes);
      setTotal(result.total_income_krw);
      setError(null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "수입 목록을 불러오지 못했습니다.");
    } finally { setLoading(false); }
  }

  async function remove(income: IncomeRecord) {
    const title = income.description || labels[income.category];
    if (!window.confirm(`“${title}” 수입을 삭제할까요?`)) return;
    try {
      const response = await fetch(`/api/incomes/${income.id}`, { method: "DELETE" });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "삭제하지 못했습니다.");
      await reload();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "삭제하지 못했습니다.");
    }
  }

  return (
    <main className="app-shell expense-shell">
      <header className="app-header">
        <Link className="brand-link" href="/"><span className="brand-mark" aria-hidden="true">₩</span><span>내 교환 가계부</span></Link>
        <Link className="back-link" href="/"><ArrowLeft size={16} /> 가계부 홈</Link>
      </header>
      <section className="expense-dashboard" aria-labelledby="income-page-title">
        <div className="expense-page-heading">
          <div><p className="eyebrow"><CalendarDays size={15} /> 수입 기록</p><h1 className="page-title" id="income-page-title">수입</h1><p className="welcome-description">장학금 · 용돈 · 아르바이트 · 기타</p></div>
          <button className="button-primary add-expense-button" onClick={() => { setEditing(undefined); setFormOpen(true); }} type="button"><Plus size={18} /> 수입 등록</button>
        </div>
        <section aria-label="수입 합계" className="summary-card expense-total-card"><span>전체 수입</span><strong>{formatKrw(total)}</strong><small>원화 환산 기준</small></section>
        {formOpen && <section aria-label={editing ? "수입 수정" : "수입 등록"} className="summary-card expense-form-card"><IncomeForm income={editing} key={editing?.id ?? "new-income"} onCancel={() => setFormOpen(false)} onSaved={async () => { setFormOpen(false); setEditing(undefined); await reload(); }} /></section>}
        {error && <p className="form-error" role="alert">{error}</p>}
        {loading ? <p className="expense-list-status" role="status">수입 내역을 불러오는 중...</p> : incomes.length === 0 ? (
          <section className="empty-ledger-card expense-empty-state"><span className="empty-icon" aria-hidden="true"><Plus size={21} /></span><div><strong>아직 기록된 수입이 없어요</strong><p>첫 수입을 등록해 보세요.</p></div></section>
        ) : (
          <section aria-label="수입 목록" className="expense-list">
            {incomes.map((income) => (
              <article className="summary-card expense-row" key={income.id}>
                <div className="expense-row-main">
                  <div className="expense-row-title"><span className="expense-category-tag income-category-tag">{labels[income.category]}</span>{income.is_planned && <span className="planned-badge">예정</span>}<time dateTime={income.date}>{income.date}</time></div>
                  <h2>{income.description || labels[income.category]}</h2>
                  {income.memo && <p className="expense-memo">{income.memo}</p>}
                  <p className="expense-rate-note">1 {income.currency} = {new Intl.NumberFormat("ko-KR", { maximumFractionDigits: 4 }).format(Number(income.rate_to_krw))}원 · 기준일 {income.rate_date}</p>
                </div>
                <div className="expense-row-amounts"><strong>{formatKrw(income.converted_amount_krw)}</strong><span>{formatAmount(income.amount, income.currency)}</span><div className="expense-row-actions"><button aria-label={`${income.description || labels[income.category]} 수정`} className="icon-button" onClick={() => { setEditing(income); setFormOpen(true); }} type="button"><Pencil size={16} /></button><button aria-label={`${income.description || labels[income.category]} 삭제`} className="icon-button danger-icon" onClick={() => void remove(income)} type="button"><Trash2 size={16} /></button></div></div>
              </article>
            ))}
          </section>
        )}
      </section>
    </main>
  );
}
