import { House, Luggage, Plane } from "lucide-react";

const sections = [
  {
    id: "preparation",
    title: "출국 준비",
    detail: "항공권 · 비자 · 보험",
    icon: Luggage,
  },
  {
    id: "living",
    title: "현지 생활",
    detail: "식비 · 교통 · 학업",
    icon: House,
  },
  {
    id: "travel",
    title: "여행",
    detail: "이동 · 숙소 · 관광",
    icon: Plane,
  },
] as const;

export function SectionTabs() {
  return (
    <div aria-label="지출 구분" className="section-tabs" role="list">
      {sections.map(({ id, title, detail, icon: Icon }) => (
        <div className={`section-tab section-tab--${id}`} key={id} role="listitem">
          <span className="section-tab-icon" aria-hidden="true">
            <Icon size={24} strokeWidth={2} />
          </span>
          <span className="section-tab-copy">
            <span className="section-tab-title">{title}</span>
            <span className="section-tab-detail">{detail}</span>
          </span>
        </div>
      ))}
    </div>
  );
}