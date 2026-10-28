import { neon } from "@neondatabase/serverless";

export function getDatabase() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL 환경 변수가 설정되지 않았습니다.");
  }

  return neon(connectionString);
}