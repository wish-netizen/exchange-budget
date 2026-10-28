import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "교환학생 가계부 | 내 돈 기록하기",
  description: "교환학생의 준비 비용, 현지 생활비, 여행 지출을 기록하는 가계부",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
