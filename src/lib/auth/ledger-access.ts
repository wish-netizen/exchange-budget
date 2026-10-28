import { createHash, randomBytes } from "node:crypto";
import { getDatabase } from "@/lib/db";

export const ACCESS_COOKIE_NAME = "ledger_access";
const ACCESS_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function createAccessCode() {
  const characters = Array.from(randomBytes(8), (byte) => ACCESS_CODE_ALPHABET[byte & 31]).join("");

  return {
    normalized: characters,
    formatted: `${characters.slice(0, 4)}-${characters.slice(4)}`,
  };
}

export function normalizeAccessCode(accessCode: string) {
  const normalized = accessCode.replace(/-/g, "").toUpperCase();
  return /^[A-HJ-NP-Z2-9]{8}$/.test(normalized) ? normalized : null;
}

export function hashAccessCode(accessCode: string) {
  const normalized = normalizeAccessCode(accessCode);
  if (!normalized) throw new Error("가계부 코드 형식이 올바르지 않습니다.");
  return createHash("sha256").update(normalized).digest("hex");
}

export async function getLedgerByAccessCode(accessCode: string | undefined) {
  if (!accessCode || !normalizeAccessCode(accessCode)) {
    return null;
  }

  const sql = getDatabase();
  const rows = await sql`
    SELECT
      id,
      nickname,
      start_date,
      initial_fund_amount::text AS initial_fund_amount,
      initial_fund_currency,
      initial_fund_rate_to_krw::text AS initial_fund_rate_to_krw,
      initial_fund_rate_source,
      initial_fund_rate_date
    FROM ledgers
    WHERE access_code_hash = ${hashAccessCode(accessCode)}
    LIMIT 1
  `;

  return rows[0] ?? null;
}