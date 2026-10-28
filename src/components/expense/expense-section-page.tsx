"use client";

import { useState } from "react";
import Link from "next/link";
import { CalendarDays, Pencil, Plus, Trash2 } from "lucide-react";
import { ExpenseForm, type ExpenseRecord } from "@/components/expense/expense-form";
import { EXPENSE_CATEGORIES, type ExpenseSection } from "@/lib/expenses/categories";

type ExpenseListResponse = {
  expenses: ExpenseRecord[];
  section_total_krw: string;
  error?: string;
};

const sectionTitles: Record<ExpenseSection, string> = {
  preparation: "출국 준비",
  living: "현지 생활",
  travel: "여행",
};

function formatKrw(value: string | number) {
  return `₩${new Intl.NumberFormat("ko-KR", { maximumFractionDigits: 0 }).format(Math.round(Number(value) || 0))}`;
}

function formatAmount(amount: string, currency: string) {
  return `${new Intl.NumberFormat("ko-KR", { maximumFractionDigits: 2 }).format(Number(amount))} ${currency}`;
}

function monthLabel(month: string) {
  return new Intl.DateTimeFormat("ko-KR", { year: "numeric", month: "long", timeZone: "UTC" })
    .format(new Date(`${month}-01T00:00:00.000Z`));
}

type ExpenseSectionPageProps = {
  section: ExpenseSection;
  initialExpenses: ExpenseRecord[];
  initialTotal: string;
  initialError?: string;
};

export function ExpenseSectionPage({ section, initialExpenses, initialTotal, initialError }: ExpenseSectionPageProps) {
  const [expenses, setExpenses] = useState<ExpenseRecord[]>(initialExpenses);
  const [sectionTotal, setSectionTotal] = useState(initialTotal);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(initialError ?? null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseRecord | undefined>();
  const groupedExpenses = expenses.reduce<Record<string, ExpenseRecord[]>>((groups, expense) => {
    const month = expense.date.slice(0, 7);
    (groups[month] ??= []).push(expense);
    return groups;
  }, {});

  async function loadExpenses() {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/expenses?section=${section}`, { cache: "no-store" });
      const result = await response.json() as ExpenseListResponse;
      if (!response.ok) throw new Error(result.error ?? "지출을 불러오지 못했습니다.");
      setExpenses(result.expenses);
      setSectionTotal(result.section_total_krw);
      setError(null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "지출을 불러오지 못했습니다.");
    } finally {
      setIsLoading(false);
    }
  }

  function startCreate() {
    setEditingExpense(undefined);
    setIsFormOpen(true);
  }

  function startEdit(expense: ExpenseRecord) {
    setEditingExpense(expense);
    setIsFormOpen(true);
  }

  async function deleteExpense(expense: ExpenseRecord) {
    const confirmed = window.confirm(`“${expense.description}” 지출을 삭제할까요?`);
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/expenses/${expense.id}`, { method: "DELETE" });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "삭제하지 못했습니다.");
      await loadExpenses();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "삭제하지 못했습니다.");
    }
  }

  return (
    <main className="app-shell expense-shell">
      <header className="app-header">
        <Link className="brand-link" href="/">
          <span className="brand-mark" aria-hidden="true">₩</span>
          <span>내 교환 가계부</span>
        </Link>
        <Link className="back-link" href="/">가계부 홈</Link>
      </header>

      <section className="expense-dashboard" aria-labelledby="expense-page-title">
        <div className="expense-page-heading">
          <div>
            <p className="eyebrow"><CalendarDays size={15} /> 지출 기록</p>
            <h1 className="page-title" id="expense-page-title">{sectionTitles[section]}</h1>
            <p className="welcome-description">{EXPENSE_CATEGORIES[section].join(" · ")}</p>
          </div>
          <button className="button-primary add-expense-button" onClick={startCreate} type="button">
            <Plus size={18} /> 지출 등록
          </button>
        </div>

        <section className="summary-card expense-total-card" aria-label={`${sectionTitles[section]} 합계`}>
          <span>탭 합계</span>
          <strong>{formatKrw(sectionTotal)}</strong>
          <small>원화 환산 기준</small>
        </section>

        {isFormOpen && (
          <section aria-label={editingExpense ? "지출 수정" : "지출 등록"} className="summary-card expense-form-card">
            <ExpenseForm
              expense={editingExpense}
              key={editingExpense?.id ?? "new-expense"}
              onCancel={() => setIsFormOpen(false)}
              onSaved={async () => { setIsFormOpen(false); setEditingExpense(undefined); await loadExpenses(); }}
              section={section}
            />
          </section>
        )}

        {error && <p className="form-error" role="alert">{error}</p>}
        {isLoading ? (
          <p className="expense-list-status" role="status">지출 내역을 불러오는 중...</p>
        ) : expenses.length === 0 ? (
          <section className="empty-ledger-card expense-empty-state">
            <span className="empty-icon" aria-hidden="true"><Plus size={21} /></span>
            <div>
              <strong>아직 기록된 지출이 없어요</strong>
              <p>첫 지출을 등록해 보세요.</p>
            </div>
          </section>
        ) : (
          <section aria-label={`${sectionTitles[section]} 지출 목록`} className="expense-list">
            {Object.entries(groupedExpenses).map(([month, monthExpenses]) => {
              const monthTotal = monthExpenses.reduce((sum, expense) => sum + Number(expense.converted_amount_krw), 0);
              return (
                <section aria-labelledby={`month-${month}`} className="expense-month-group" key={month}>
                  <h2 className="expense-month-heading" id={`month-${month}`}>
                    <span>{monthLabel(month)}</span>
                    <span>합계 {formatKrw(monthTotal)}</span>
                  </h2>
                  {monthExpenses.map((expense) => (
                    <article className="summary-card expense-row" key={expense.id}>
                      <div className="expense-row-main">
                        <div className="expense-row-title">
                          <span className="expense-category-tag">{expense.category}</span>
                          {expense.is_planned && <span className="planned-badge">예정</span>}
                          <time dateTime={expense.date}>{expense.date}</time>
                        </div>
                        <h2>{expense.description || expense.category}</h2>
                        {expense.memo && <p className="expense-memo">{expense.memo}</p>}
                        <p className="expense-rate-note">1 {expense.currency} = {new Intl.NumberFormat("ko-KR", { maximumFractionDigits: 4 }).format(Number(expense.rate_to_krw))}원 · 기준일 {expense.rate_date}</p>
                      </div>
                      <div className="expense-row-amounts">
                        <strong>{formatKrw(expense.converted_amount_krw)}</strong>
                        <span>{formatAmount(expense.amount, expense.currency)}</span>
                        <div className="expense-row-actions">
                          <button aria-label={`${expense.description || expense.category} 수정`} className="icon-button" onClick={() => startEdit(expense)} type="button"><Pencil size={16} /></button>
                          <button aria-label={`${expense.description || expense.category} 삭제`} className="icon-button danger-icon" onClick={() => void deleteExpense(expense)} type="button"><Trash2 size={16} /></button>
                        </div>
                      </div>
                    </article>
                  ))}
                </section>
              );
            })}
          </section>
        )}
      </section>
    </main>
  );
}