"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

export function LeaveLedgerButton() {
  const router = useRouter();

  async function leaveLedger() {
    await fetch("/api/access", { method: "DELETE" });
    router.replace("/");
    router.refresh();
  }

  return (
    <button className="back-link logout-button" onClick={leaveLedger} type="button">
      <LogOut size={16} /> 다른 가계부
    </button>
  );
}