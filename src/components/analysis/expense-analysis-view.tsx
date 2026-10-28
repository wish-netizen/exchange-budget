"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ChartPie, ChevronDown } from "lucide-react";

type AnalysisCategory = {
  section: "preparation" | "living" | "travel";
  category: string;
  amountKrw: string;
};

type AnalysisResult = {
  month: string;
  categories: AnalysisCategory[];
  totalKrw: string;
};

type AnalysisResponse = AnalysisResult & { error?: string };

const sectionNames = {
  preparation: "출국 준비",
  living: "현지 생활",
  travel: "여행",
} as const;

const chartColors = [
  "#2879c7",
  "#62a9df",
  "#a5d5f2",
  "#48a2b8",
  "#76c5cb",
  "#b3e1df",
  "#f27b55",
  "#f5ae81",
  "#d8a84e",
  "#7b9f82",
  "#99b8a0",
  "#c2d9c8",
] as const;

function localMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function monthTitle(value: string) {
  if (value === "all") return "전체 기간";
  const [year, month] = value.split("-").map(Number);
  return `${year}년 ${month}월`;
}

function money(value: number | string) {
  return `₩${new Intl.NumberFormat("ko-KR", { maximumFractionDigits: 0 }).format(Math.round(Number(value) || 0))}`;
}

export function ExpenseAnalysisView() {
  const [month, setMonth] = useState(localMonth);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const query = new URLSearchParams({ month });
    fetch(`/api/expense-analysis?${query}`, { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        const body = await response.json() as AnalysisResponse;
        if (!response.ok) throw new Error(body.error ?? "지출 분석을 불러오지 못했습니다.");
        setResult(body);
        setError(null);
      })
      .catch((fetchError: unknown) => {
        if (fetchError instanceof DOMException && fetchError.name === "AbortError") return;
        setError(fetchError instanceof Error ? fetchError.message : "지출 분석을 불러오지 못했습니다.");
        setResult(null);
      });

    return () => controller.abort();
  }, [month]);

  const currentResult = result?.month === month ? result : null;
  const categories = currentResult?.categories ?? [];
  const total = Number(currentResult?.totalKrw ?? 0);
  const gradientStops = categories.reduce<{ position: number; stops: string[] }>((accumulator, item, index) => {
    const percentage = total > 0 ? (Number(item.amountKrw) / total) * 100 : 0;
    const end = accumulator.position + percentage;
    return {
      position: end,
      stops: [...accumulator.stops, `${chartColors[index % chartColors.length]} ${accumulator.position}% ${end}%`],
    };
  }, { position: 0, stops: [] }).stops;
  const chartStyle = gradientStops.length > 0
    ? { background: `conic-gradient(${gradientStops.join(", ")})` }
    : undefined;

  return (
    <main className="app-shell analysis-shell">
      <header className="app-header">
        <Link className="brand-link" href="/"><span className="brand-mark" aria-hidden="true"><ChartPie size={20} /></span><span>내 교환 가계부</span></Link>
        <Link className="back-link" href="/"><ArrowLeft size={16} /> 가계부 홈</Link>
      </header>

      <section className="analysis-dashboard" aria-labelledby="analysis-title">
        <div className="analysis-page-heading">
          <div>
            <p className="eyebrow"><ChartPie size={15} /> 지출 흐름</p>
            <h1 className="page-title" id="analysis-title">지출 분석</h1>
            <p className="welcome-description">카테고리별 지출을 원화로 살펴보세요.</p>
          </div>
          <label className="analysis-period" htmlFor="analysis-month">
            <span>분석 기간</span>
            <span className="analysis-period-control">
              <select id="analysis-month" onChange={(event) => setMonth(event.target.value)} value={month}>
                <option value="all">전체 기간</option>
                {month !== "all" && <option value={month}>{monthTitle(month)}</option>}
              </select>
              <ChevronDown aria-hidden="true" size={15} />
            </span>
          </label>
        </div>

        <div className="analysis-month-input-wrap">
          <label className="analysis-period analysis-custom-period" htmlFor="custom-analysis-month">
            <span>월 선택</span>
            <input id="custom-analysis-month" max={localMonth()} onChange={(event) => { if (event.target.value) setMonth(event.target.value); }} type="month" value={month === "all" ? "" : month} />
          </label>
        </div>

        {error ? (
          <p className="form-error" role="alert">{error}</p>
        ) : !currentResult ? (
          <p className="analysis-loading" role="status">지출 분석을 불러오는 중...</p>
        ) : categories.length === 0 || total === 0 ? (
          <section className="analysis-empty summary-card" role="status">
            <span className="analysis-empty-icon"><ChartPie size={25} /></span>
            <h2>{month === "all" ? "전체 기간에 지출이 없어요" : "이 달에는 지출이 없어요"}</h2>
            <p>지출을 기록하면 카테고리별 비율을 여기에서 확인할 수 있습니다.</p>
          </section>
        ) : (
          <>
            <section aria-label={`${monthTitle(month)} 전체 지출`} className="analysis-total summary-card">
              <span>{monthTitle(month)} 지출 합계</span>
              <strong>{money(total)}</strong>
            </section>
            <div className="analysis-content">
              <section aria-label="카테고리별 지출 원그래프" className="analysis-chart-panel summary-card">
                <div aria-label={`${monthTitle(month)} 지출 카테고리 원그래프`} className="expense-pie-chart" role="img" style={chartStyle}>
                  <div className="expense-pie-center"><span>합계</span><strong>{money(total)}</strong></div>
                </div>
                <p className="chart-caption">원화 환산 기준</p>
              </section>
              <section aria-labelledby="analysis-table-title" className="analysis-table-panel summary-card">
                <h2 id="analysis-table-title">카테고리별 지출</h2>
                <div className="analysis-table-wrap">
                  <table className="analysis-table">
                    <thead><tr><th scope="col">카테고리</th><th scope="col">금액</th><th scope="col">비율</th></tr></thead>
                    <tbody>
                      {categories.map((item, index) => {
                        const amount = Number(item.amountKrw);
                        const percentage = (amount / total) * 100;
                        return (
                          <tr key={`${item.section}-${item.category}`}>
                            <th scope="row">
                              <span className="analysis-category-cell">
                                <span aria-hidden="true" className="analysis-swatch" style={{ backgroundColor: chartColors[index % chartColors.length] }} />
                                <span><strong>{item.category}</strong><small>{sectionNames[item.section]}</small></span>
                              </span>
                            </th>
                            <td>{money(amount)}</td>
                            <td>{percentage.toFixed(1)}%</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          </>
        )}
      </section>
    </main>
  );
}
