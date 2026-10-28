"use client";

import { Check, Copy, KeyRound, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

type CreateLedgerResponse = {
  accessCode?: string;
  error?: string;
};

export function CreateLedgerPanel() {
  const router = useRouter();
  const [accessCode, setAccessCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function createLedger() {
    setIsCreating(true);
    setError(null);

    try {
      const response = await fetch("/api/ledgers", { method: "POST" });
      const result = (await response.json()) as CreateLedgerResponse;

      if (!response.ok || !result.accessCode) {
        setError(result.error ?? "가계부를 만들지 못했습니다. 다시 시도해 주세요.");
        return;
      }

      setAccessCode(result.accessCode);
    } catch {
      setError("서버에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setIsCreating(false);
    }
  }

  async function copyCode() {
    if (!accessCode) return;

    try {
      await navigator.clipboard.writeText(accessCode);
      setCopied(true);
      setError(null);
    } catch {
      setError("복사할 수 없습니다. 코드를 길게 눌러 직접 복사해 주세요.");
    }
  }

  if (accessCode) {
    return (
      <div className="entry-panel">
        <div className="code-heading">
          <span className="entry-icon entry-icon--success" aria-hidden="true"><KeyRound size={24} /></span>
          <div>
            <h2>가계부 코드가 발급됐어요</h2>
            <p>다음 접속 때 이 코드로 같은 가계부를 열 수 있습니다.</p>
          </div>
        </div>
        <div className="access-code" aria-label="발급된 가계부 코드">{accessCode}</div>
        <p className="code-warning">이 코드를 잃어버리면 데이터를 복구할 수 없으니 꼭 기록해두세요.</p>
        <button className="button-primary button-wide" onClick={copyCode} type="button">
          {copied ? <Check size={18} /> : <Copy size={18} />}
          {copied ? "복사 완료" : "코드 복사"}
        </button>
        <button
          className="button-secondary button-wide continue-button"
          onClick={() => router.replace("/setup")}
          type="button"
        >
          코드를 기록했어요, 첫 설정하기
        </button>
        <p className="secure-note"><ShieldCheck size={15} /> 코드는 서버에 해시로만 저장됩니다.</p>
        {error && <p className="form-error" role="alert">{error}</p>}
      </div>
    );
  }

  return (
    <div className="entry-panel">
      <div className="entry-icon" aria-hidden="true"><KeyRound size={25} /></div>
      <h2>나만의 가계부 코드를 만들어요</h2>
      <p>로그인 없이 사용할 수 있도록 무작위 코드를 발급합니다.</p>
      <button className="button-primary button-wide" disabled={isCreating} onClick={createLedger} type="button">
        <KeyRound size={18} />
        {isCreating ? "코드 만드는 중..." : "가계부 코드 발급하기"}
      </button>
      {error && <p className="form-error" role="alert">{error}</p>}
      <p className="secure-note"><ShieldCheck size={15} /> 코드는 서버에 해시로만 저장됩니다.</p>
    </div>
  );
}