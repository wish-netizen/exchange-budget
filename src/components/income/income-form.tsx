"use client";

import { CalendarDays, Check, X } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { CURRENCIES } from "@/lib/currencies";
import type { IncomeCategory } from "@/lib/incomes/validation";

export type IncomeRecord = {
  id: string;
  date: string;
  category: IncomeCategory;
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

type IncomeFormProps = {
  income?: IncomeRecord;
  onCancel: () => void;
  onSaved: () => void;
};

type RateResult = {
  rate: number;
  rateDate: string;
  convertedAmountKrw: number;
  isPlanned: boolean;
};

type ApiError = { error?: string; requiresManualRate?: boolean };

const incomeKinds: { value: IncomeCategory; label: string }[] = [
  { value: "scholarship", label: "장학금" },
  { value: "allowance", label: "용돈" },
  { value: "part_time", label: "아르바이트" },
  { value: "other", label: "기타" },
];

function localDateValue() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function formatKrw(value: number) {
  return `₩${new Intl.NumberFormat("ko-KR", { maximumFractionDigits: 0 }).format(Math.round(value))}`;
}

export function IncomeForm({ income, onCancel, onSaved }: IncomeFormProps) {
  const [date, setDate] = useState(income?.date ?? localDateValue());
  const [category, setCategory] = useState<IncomeCategory>(income?.category ?? "scholarship");
  const [description, setDescription] = useState(income?.description ?? "");
  const [amount, setAmount] = useState(income?.amount ?? "");
  const [currency, setCurrency] = useState(income?.currency ?? "KRW");
  const [memo, setMemo] = useState(income?.memo ?? "");
  const [manualRate, setManualRate] = useState("");
  const [preview, setPreview] = useState<RateResult | null>(null);
  const [requiresManualRate, setRequiresManualRate] = useState(false);
  const [rateError, setRateError] = useState<string | null>(null);
  const [isLoadingRate, setIsLoadingRate] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!date || !currency || !amount || Number(amount) <= 0) return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setIsLoadingRate(true);
      setRateError(null);
      if (income && date === income.date && currency === income.currency) {
        const rate = Number(income.rate_to_krw);
        setPreview({ rate, rateDate: income.rate_date, convertedAmountKrw: Math.round(Number(amount) * rate * 100) / 100, isPlanned: date > localDateValue() });
        setIsLoadingRate(false);
        return;
      }
      try {
        const query = new URLSearchParams({ date, currency, amount });
        const response = await fetch(`/api/exchange-rate?${query}`, { signal: controller.signal });
        const result = await response.json() as RateResult & ApiError;
        if (!response.ok) {
          setPreview(null);
          setRequiresManualRate(Boolean(result.requiresManualRate));
          setRateError(result.error ?? "환율을 불러오지 못했습니다.");
          return;
        }
        setPreview(result);
        setRequiresManualRate(false);
        setManualRate("");
      } catch (requestError) {
        if (requestError instanceof DOMException && requestError.name === "AbortError") return;
        setPreview(null);
        setRequiresManualRate(currency !== "KRW");
        setRateError("환율 자동 조회에 실패했습니다. 직접 입력해 주세요.");
      } finally {
        setIsLoadingRate(false);
      }
    }, 250);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [amount, currency, date, income]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setError(null);
    try {
      const response = await fetch(income ? `/api/incomes/${income.id}` : "/api/incomes", {
        method: income ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, category, description, amount, currency, memo, ...(requiresManualRate ? { manualRate } : {}) }),
      });
      const result = await response.json() as ApiError;
      if (!response.ok) {
        if (result.requiresManualRate) setRequiresManualRate(true);
        setError(result.error ?? "수입을 저장하지 못했습니다.");
        return;
      }
      onSaved();
    } catch {
      setError("서버에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setIsSaving(false);
    }
  }

  function changeDate(value: string) {
    setDate(value);
    setPreview(null);
    setRequiresManualRate(false);
    setManualRate("");
  }

  function changeCurrency(value: string) {
    setCurrency(value);
    setPreview(null);
    setRequiresManualRate(false);
    setManualRate("");
  }

  return (
    <form className="expense-form" onSubmit={submit}>
      <div className="expense-form-heading">
        <h2>{income ? "수입 수정" : "수입 등록"}</h2>
        <button aria-label="닫기" className="icon-button" onClick={onCancel} type="button"><X size={19} /></button>
      </div>
      <div className="expense-form-grid">
        <label className="expense-field" htmlFor="income-date">
          <span><CalendarDays size={15} /> 날짜</span>
          <input id="income-date" onChange={(event) => changeDate(event.target.value)} required type="date" value={date} />
        </label>
        <label className="expense-field" htmlFor="income-kind">
          <span>종류</span>
          <select id="income-kind" onChange={(event) => setCategory(event.target.value as IncomeCategory)} value={category}>
            {incomeKinds.map((kind) => <option key={kind.value} value={kind.value}>{kind.label}</option>)}
          </select>
        </label>
        <label className="expense-field expense-field-wide" htmlFor="income-description">
          <span>내용 <small>선택</small></span>
          <input id="income-description" maxLength={120} onChange={(event) => setDescription(event.target.value)} placeholder="예: 2학기 교환학생 장학금" value={description} />
        </label>
        <label className="expense-field" htmlFor="income-amount">
          <span>금액</span>
          <input id="income-amount" inputMode="decimal" min="0.000001" onChange={(event) => { setAmount(event.target.value); setPreview(null); }} placeholder="0" required step="0.000001" type="number" value={amount} />
        </label>
        <label className="expense-field" htmlFor="income-currency">
          <span>통화</span>
          <select id="income-currency" onChange={(event) => changeCurrency(event.target.value)} value={currency}>
            {CURRENCIES.map(([code, name]) => <option key={code} value={code}>{code} · {name}</option>)}
          </select>
        </label>
        <label className="expense-field expense-field-wide" htmlFor="income-memo">
          <span>메모 <small>선택</small></span>
          <textarea id="income-memo" maxLength={500} onChange={(event) => setMemo(event.target.value)} placeholder="필요한 내용을 적어두세요" rows={2} value={memo} />
        </label>
      </div>

      <div aria-live="polite" className={`rate-preview${preview?.isPlanned ? " rate-preview-planned" : ""}`}>
        {!amount || Number(amount) <= 0 ? <span>금액과 통화를 입력하면 원화 환산액을 보여드려요.</span>
          : requiresManualRate && Number(manualRate) > 0 ? <><strong>≈ {formatKrw(Number(amount) * Number(manualRate))}</strong><span>(1 {currency} = {new Intl.NumberFormat("ko-KR", { maximumFractionDigits: 4 }).format(Number(manualRate))}원, 기준일 {date})</span></>
            : isLoadingRate ? <span>환율 확인 중...</span>
              : preview ? <>{preview.isPlanned && <strong className="planned-badge">예정</strong>}<strong>≈ {formatKrw(preview.convertedAmountKrw)}</strong><span>(1 {currency} = {new Intl.NumberFormat("ko-KR", { maximumFractionDigits: 4 }).format(preview.rate)}원, 기준일 {preview.rateDate})</span></>
                : <span>{rateError ?? "금액과 통화를 입력하면 원화 환산액을 보여드려요."}</span>}
      </div>

      {requiresManualRate && currency !== "KRW" && (
        <label className="expense-field manual-expense-rate" htmlFor="income-manual-rate">
          <span>직접 입력 환율</span>
          <div className="manual-rate-row">
            <span>1 {currency} =</span>
            <input id="income-manual-rate" inputMode="decimal" min="0.00000001" onChange={(event) => setManualRate(event.target.value)} placeholder="원화 환율" required step="any" type="number" value={manualRate} />
            <span>KRW</span>
          </div>
        </label>
      )}
      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="expense-form-actions">
        <button className="button-secondary" onClick={onCancel} type="button">취소</button>
        <button className="button-primary" disabled={isSaving || isLoadingRate || (requiresManualRate && currency !== "KRW" && !manualRate)} type="submit"><Check size={17} /> {isSaving ? "저장 중..." : "저장"}</button>
      </div>
    </form>
  );
}
