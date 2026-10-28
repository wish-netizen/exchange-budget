import { createHash } from "node:crypto";
import { getDatabase } from "@/lib/db";

export const ACCESS_COOKIE_NAME = "ledger_access";

export function hashAccessCode(accessCode: string) {
  return createHash("sha256").update(accessCode).digest("hex");
}

export async function getLedgerByAccessCode(accessCode: string | undefined) {
  if (!accessCode || !/^[A-Za-z0-9_-]{43}$/.test(accessCode)) {
    return null;
  }

  const sql = getDatabase();
  const rows = await sql`
    SELECT id
    FROM ledgers
    WHERE access_code_hash = ${hashAccessCode(accessCode)}
    LIMIT 1
  `;

  return rows[0] ?? null;
}