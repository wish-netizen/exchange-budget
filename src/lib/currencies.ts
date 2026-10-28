export const CURRENCIES = [
  ["KRW", "대한민국 원"],
  ["USD", "미국 달러"],
  ["EUR", "유로"],
  ["JPY", "일본 엔"],
  ["GBP", "영국 파운드"],
  ["CAD", "캐나다 달러"],
  ["AUD", "호주 달러"],
  ["NZD", "뉴질랜드 달러"],
  ["CHF", "스위스 프랑"],
  ["CNY", "중국 위안"],
  ["HKD", "홍콩 달러"],
  ["SGD", "싱가포르 달러"],
  ["SEK", "스웨덴 크로나"],
  ["NOK", "노르웨이 크로네"],
  ["DKK", "덴마크 크로네"],
  ["PLN", "폴란드 즈워티"],
  ["CZK", "체코 코루나"],
  ["HUF", "헝가리 포린트"],
] as const;

export const CURRENCY_CODES = new Set(CURRENCIES.map(([code]) => code));