"use client";

import { ArrowRight, Coins, Save, UserRound } from "lucide-react";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { CURRENCIES as currencies } from "@/lib/currencies";

type LedgerSetupFormProps = {
  mode: "create" | "update";
  initialValues?: {
    nickname: string;
    initialFundAmount: string;
    initialFundCurrency: string;
  };
};

type SetupResponse = {
  error?: string;
  requiresManualRate?: boolean;
};

export function LedgerSetupForm({ mode, initialValues }: LedgerSetupFormProps) {
  const router = useRouter();
  const [nickname, setNickname] = useState(initialValues?.nickname ?? "");
  const [amount, setAmount] = useState(initialValues?.initialFundAmount ?? "0");
  const [currency, setCurrency] = useState(initialValues?.initialFundCurrency ?? "KRW");
  const [manualRate, setManualRate] = useState("");
  const [requiresManualRate, setRequiresManualRate] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  async function submitSetup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/ledger/setup", {
        method: mode === "create" ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nickname,
          initialFundAmount: amount,
          initialFundCurrency: currency,
          ...(requiresManualRate ? { manualRate } : {}),
        }),
      });
      const result = (await response.json()) as SetupResponse;

      if (!response.ok) {
        if (result.requiresManualRate) setRequiresManualRate(true);
        setError(result.error ?? "설정을 저장하지 못했습니다.");
        return;
      }

      router.replace("/");
      router.refresh();
    } catch {
      setError("서버에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setIsSaving(false);
    }
  }

  function updateCurrency(value: string) {
    setCurrency(value);
    setRequiresManualRate(false);
    setManualRate("");
  }

  return (
    <form className="entry-panel setup-form" onSubmit={submitSetup}>
      <label className="setup-field" htmlFor="nickname">
        <span className="field-label"><UserRound aria-hidden="true" size={16} /> 닉네임 <span className="required-mark">필수</span></span>
        <input
          autoComplete="nickname"
          id="nickname"
          maxLength={16}
          onChange={(event) => setNickname(Array.from(event.target.value).slice(0, 8).join(""))}
          placeholder="예: 민지"
          required
          value={nickname}
        />
        <span className="field-hint">1~8자로 입력해 주세요. 설정에서 언제든 바꿀 수 있어요.</span>
      </label>

      <div className="setup-field">
        <span className="field-label"><Coins aria-hidden="true" size={16} /> 시작 자금</span>
        <div className="fund-input-row">
          <label className="sr-only" htmlFor="initial-fund-amount">시작 자금 금액</label>
          <input
            id="initial-fund-amount"
            inputMode="decimal"
            min="0"
            onChange={(event) => setAmount(event.target.value)}
            placeholder="0"
            required
            step="0.000001"
            type="number"
            value={amount}
          />
          <label className="sr-only" htmlFor="initial-fund-currency">시작 자금 통화</label>
          <select
            id="initial-fund-currency"
            onChange={(event) => updateCurrency(event.target.value)}
            value={currency}
          >
            {currencies.map(([code, name]) => (
              <option key={code} value={code}>{code} · {name}</option>
            ))}
          </select>
        </div>
        <span className="field-hint">금액이 아직 정해지지 않았다면 0으로 둘 수 있어요.</span>
      </div>

      {requiresManualRate && currency !== "KRW" && (
        <label className="setup-field manual-rate-field" htmlFor="manual-rate">
          <span className="field-label">직접 입력 환율</span>
          <div className="manual-rate-row">
            <span>1 {currency} =</span>
            <input
              id="manual-rate"
              inputMode="decimal"
              min="0.00000001"
              onChange={(event) => setManualRate(event.target.value)}
              placeholder="원화 환율"
              required
              step="any"
              type="number"
              value={manualRate}
            />
            <span>KRW</span>
          </div>
          <span className="field-hint">자동 조회가 되지 않아 직접 입력이 필요합니다.</span>
        </label>
      )}

      {error && <p className="form-error" role="alert">{error}</p>}
      <button className="button-primary button-wide setup-submit" disabled={isSaving} type="submit">
        {mode === "create" ? <ArrowRight size={18} /> : <Save size={18} />}
        {isSaving ? "저장 중..." : mode === "create" ? "첫 설정 완료" : "설정 저장"}
      </button>
    </form>
  );
}