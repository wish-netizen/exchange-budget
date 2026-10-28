"use client";

import { ArrowRight, KeyRound, ShieldCheck } from "lucide-react";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

type AccessResponse = {
  error?: string;
};

export function AccessLedgerForm() {
  const router = useRouter();
  const [accessCode, setAccessCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  async function submitAccessCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsChecking(true);
    setError(null);

    try {
      const response = await fetch("/api/access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessCode: accessCode.trim() }),
      });
      const result = (await response.json()) as AccessResponse;

      if (!response.ok) {
        setError(result.error ?? "가계부 코드를 확인해 주세요.");
        return;
      }

      router.replace("/");
      router.refresh();
    } catch {
      setError("서버에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setIsChecking(false);
    }
  }

  return (
    <form className="entry-panel" onSubmit={submitAccessCode}>
      <label className="field-label" htmlFor="access-code">가계부 코드</label>
      <div className="code-input-wrap">
        <KeyRound aria-hidden="true" size={19} />
        <input
          autoComplete="off"
          autoCapitalize="none"
          id="access-code"
          maxLength={9}
          onChange={(event) => {
            const characters = event.target.value.replace(/-/g, "").toUpperCase().slice(0, 8);
            setAccessCode(characters.length > 4 ? `${characters.slice(0, 4)}-${characters.slice(4)}` : characters);
          }}
          placeholder="예: K7MP-Q4XR"
          required
          spellCheck={false}
          value={accessCode}
        />
      </div>
      {error && <p className="form-error" role="alert">{error}</p>}
      <button className="button-primary button-wide" disabled={isChecking || !accessCode.trim()} type="submit">
        {isChecking ? "가계부 확인 중..." : "가계부 열기"}
        <ArrowRight size={18} />
      </button>
      <p className="secure-note"><ShieldCheck size={15} /> 코드는 안전한 쿠키로 보관됩니다.</p>
    </form>
  );
}