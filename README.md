# Fieldnote

교환학생의 출국 전 준비, 현지 생활, 여행 지출과 수입을 여러 통화로 기록하는 가계부입니다.

## 1단계: 프로젝트 기반

현재 프로젝트는 Next.js App Router, TypeScript, Tailwind CSS, ESLint와 Neon 서버리스 드라이버로 구성되어 있습니다. 거래 기능은 다음 단계에서 구현합니다.

### 로컬 실행

```bash
npm install
npm run dev
```

브라우저에서 `http://localhost:3000`을 엽니다.

### Neon 데이터베이스 준비

1. Neon 프로젝트를 생성하고 연결 문자열을 확인합니다.
2. Neon SQL Editor에서 `database/schema.sql`의 내용을 실행합니다.
3. `.env.example`을 참고해 루트에 `.env.local`을 만들고 `DATABASE_URL`에 Neon 연결 문자열을 설정합니다.

가계부 코드는 충분히 긴 무작위 문자열로 발급하고, DB에는 해시만 저장합니다. 브라우저 접근은 `HttpOnly`, `Secure`, `SameSite` 쿠키로 보호합니다. SQL 파일에는 `ledgers`, `expenses`, `incomes` 테이블과 인덱스가 포함됩니다.

## 개발 순서

1. 프로젝트 기반 및 Neon 스키마 준비
2. 가계부 코드 발급, 코드 표시·복사, 접근 쿠키와 가계부 격리
3. 시작일 및 통화가 있는 시작 자금 설정
4. Frankfurter 환율 조회 기반 준비
5. 준비·생활·여행 지출 CRUD 구현
6. 첫 배포: 지출 기능까지 사용자 테스트
7. 장학금·용돈·아르바이트·기타 수입 CRUD 구현
8. 시작일부터 현재까지 연도를 넘겨 이어지는 월별 요약 구현
9. 재배포

## 거래 날짜와 환율 규칙

- 외화 거래는 거래일 기준 Frankfurter 환율을 서버에서 조회하고 적용 환율·출처·환율일을 거래에 저장합니다. KRW 거래는 환율 1로 처리합니다.
- Frankfurter 조회가 실패한 경우에만 수동 환율을 입력할 수 있습니다.
- 미래 날짜 거래는 가장 최근 환율을 사용하고 목록에서 `예정`으로 표시합니다.
- 시작일 이전 거래는 저장을 거부하고 `시작일을 이 날짜 이전으로 바꿔주세요` 안내를 표시합니다.
- 수정 시 날짜나 통화가 바뀌면 환율을 다시 조회하고, 금액·내용·메모만 바뀌면 기존 환율 스냅샷을 유지합니다.
- 월별 요약은 시작일부터 현재까지 월 단위로 연속 계산합니다. 월말 잔액은 다음 달 이월 잔액이 됩니다.This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
