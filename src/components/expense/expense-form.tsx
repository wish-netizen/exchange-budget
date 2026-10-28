"use client";

import { CalendarDays, Check, X } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { CURRENCIES } from "@/lib/currencies";
import { EXPENSE_CATEGORIES, type ExpenseSection } from "@/lib/expenses/categories";

export type ExpenseRecord = {
  id: string;
  section: ExpenseSection;
  date: string;
  category: string;
  description: string;
  amount: string;
  currency: string;
  rate_to_krw: string;
  rate_source: "frankfurter" | "manual" | "krw";
  rate_date: string;
  converted_amount_krw: string;
  memo: string;
  is_planned: boolean;
};

type ExpenseFormProps = {
  section: ExpenseSection;
  expense?: ExpenseRecord;
  onCancel: () => void;
  onSaved: () => void;
};

type RatePreview = {
  rate: number;
  rateDate: string;
  convertedAmountKrw: number;
  isPlanned: boolean;
  source: string;
};

type ApiError = {
  error?: string;
  requiresManualRate?: boolean;
};

function localDateValue() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatKrw(value: number) {
  return `₩${new Intl.NumberFormat("ko-KR", { maximumFractionDigits: 0 }).format(Math.round(value))}`;
}

export function ExpenseForm({ section, expense, onCancel, onSaved }: ExpenseFormProps) {
  const [date, setDate] = useState(expense?.date ?? localDateValue());
  const [category, setCategory] = useState(expense?.category ?? EXPENSE_CATEGORIES[section][0]);
  const [description, setDescription] = useState(expense?.description ?? "");
  const [amount, setAmount] = useState(expense?.amount ?? "");
  const [currency, setCurrency] = useState(expense?.currency ?? "KRW");
  const [memo, setMemo] = useState(expense?.memo ?? "");
  const [manualRate, setManualRate] = useState("");
  const [ratePreview, setRatePreview] = useState<RatePreview | null>(null);
  const [rateError, setRateError] = useState<string | null>(null);
  const [requiresManualRate, setRequiresManualRate] = useState(false);
  const [isLoadingRate, setIsLoadingRate] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!date || !currency || !amount || Number(amount) <= 0) return;

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setIsLoadingRate(true);
      setRateError(null);

      if (expense && date === expense.date && currency === expense.currency) {
        const savedRate = Number(expense.rate_to_krw);
        setRatePreview({
          rate: savedRate,
          rateDate: expense.rate_date,
          convertedAmountKrw: Math.round(Number(amount) * savedRate * 100) / 100,
          isPlanned: date > localDateValue(),
          source: expense.rate_source,
        });
        setIsLoadingRate(false);
        return;
      }

      try {
        const query = new URLSearchParams({ date, currency, amount });
        const response = await fetch(`/api/exchange-rate?${query}`, { signal: controller.signal });
        const result = await response.json() as RatePreview & ApiError;
        if (!response.ok) {
          setRatePreview(null);
          setRequiresManualRate(Boolean(result.requiresManualRate));
          setRateError(result.error ?? "환율을 불러오지 못했습니다.");
          return;
        }
        setRatePreview(result);
        setRequiresManualRate(false);
        setManualRate("");
      } catch (requestError) {
        if (requestError instanceof DOMException && requestError.name === "AbortError") return;
        setRatePreview(null);
        setRequiresManualRate(currency !== "KRW");
        setRateError("환율 자동 조회에 실패했습니다. 직접 입력해 주세요.");
      } finally {
        setIsLoadingRate(false);
      }
    }, 250);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [amount, currency, date, expense]);

  async function submitExpense(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch(expense ? `/api/expenses/${expense.id}` : "/api/expenses", {
        method: expense ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section, date, category, description, amount, currency, memo, ...(requiresManualRate ? { manualRate } : {}) }),
      });
      const result = await response.json() as ApiError;
      if (!response.ok) {
        if (result.requiresManualRate) setRequiresManualRate(true);
        setError(result.error ?? "지출을 저장하지 못했습니다.");
        return;
      }
      onSaved();
    } catch {
      setError("서버에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setIsSaving(false);
    }
  }

  function updateDate(value: string) {
    setDate(value);
    setRatePreview(null);
    setRateError(null);
    setRequiresManualRate(false);
    setManualRate("");
  }

  function updateAmount(value: string) {
    setAmount(value);
    setRatePreview(null);
    setRateError(null);
  }

  function updateCurrency(value: string) {
    setCurrency(value);
    setRatePreview(null);
    setRateError(null);
    setRequiresManualRate(false);
    setManualRate("");
  }

  return (
    <form className="expense-form" onSubmit={submitExpense}>
      <div className="expense-form-heading">
        <h2>{expense ? "지출 수정" : "지출 등록"}</h2>
        <button aria-label="닫기" className="icon-button" onClick={onCancel} type="button"><X size={19} /></button>
      </div>

      <div className="expense-form-grid">
        <label className="expense-field" htmlFor="expense-date">
          <span><CalendarDays size={15} /> 날짜</span>
          <input id="expense-date" onChange={(event) => updateDate(event.target.value)} required type="date" value={date} />
        </label>
        <label className="expense-field" htmlFor="expense-category">
          <span>카테고리</span>
          <select id="expense-category" onChange={(event) => setCategory(event.target.value)} value={category}>
            {EXPENSE_CATEGORIES[section].map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="expense-field expense-field-wide" htmlFor="expense-description">
          <span>내용 <small>선택</small></span>
          <input id="expense-description" maxLength={120} onChange={(event) => setDescription(event.target.value)} placeholder="예: 왕복 항공권" value={description} />
        </label>
        <label className="expense-field" htmlFor="expense-amount">
          <span>금액</span>
          <input id="expense-amount" inputMode="decimal" min="0.000001" onChange={(event) => updateAmount(event.target.value)} placeholder="0" required step="0.000001" type="number" value={amount} />
        </label>
        <label className="expense-field" htmlFor="expense-currency">
          <span>통화</span>
          <select id="expense-currency" onChange={(event) => updateCurrency(event.target.value)} value={currency}>
            {CURRENCIES.map(([code, name]) => <option key={code} value={code}>{code} · {name}</option>)}
          </select>
        </label>
        <label className="expense-field expense-field-wide" htmlFor="expense-memo">
          <span>메모 <small>선택</small></span>
          <textarea id="expense-memo" maxLength={500} onChange={(event) => setMemo(event.target.value)} placeholder="필요한 내용을 적어두세요" rows={2} value={memo} />
        </label>
      </div>

      <div aria-live="polite" className={`rate-preview${ratePreview?.isPlanned ? " rate-preview-planned" : ""}`}>
        {!amount || Number(amount) <= 0 ? (
          <span>금액과 통화를 입력하면 원화 환산액을 보여드려요.</span>
        ) : requiresManualRate && Number(manualRate) > 0 ? (
          <>
            <strong>≈ {formatKrw(Number(amount) * Number(manualRate))}</strong>
            <span>(1 {currency} = {new Intl.NumberFormat("ko-KR", { maximumFractionDigits: 4 }).format(Number(manualRate))}원, 기준일 {date})</span>
          </>
        ) : isLoadingRate ? (
          <span>환율 확인 중...</span>
        ) : ratePreview ? (
          <>
            {ratePreview.isPlanned && <strong className="planned-badge">예정</strong>}
            <strong>≈ {formatKrw(ratePreview.convertedAmountKrw)}</strong>
            <span>(1 {currency} = {new Intl.NumberFormat("ko-KR", { maximumFractionDigits: 4 }).format(ratePreview.rate)}원, 기준일 {ratePreview.rateDate})</span>
          </>
        ) : rateError ? (
          <span>{rateError}</span>
        ) : (
          <span>금액과 통화를 입력하면 원화 환산액을 보여드려요.</span>
        )}
      </div>

      {requiresManualRate && currency !== "KRW" && (
        <label className="expense-field manual-expense-rate" htmlFor="expense-manual-rate">
          <span>직접 입력 환율</span>
          <div className="manual-rate-row">
            <span>1 {currency} =</span>
            <input id="expense-manual-rate" inputMode="decimal" min="0.00000001" onChange={(event) => setManualRate(event.target.value)} placeholder="원화 환율" required step="any" type="number" value={manualRate} />
            <span>KRW</span>
          </div>
        </label>
      )}

      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="expense-form-actions">
        <button className="button-secondary" onClick={onCancel} type="button">취소</button>
        <button className="button-primary" disabled={isSaving || isLoadingRate || (requiresManualRate && currency !== "KRW" && !manualRate)} type="submit">
          <Check size={17} /> {isSaving ? "저장 중..." : "저장"}
        </button>
      </div>
    </form>
  );
}