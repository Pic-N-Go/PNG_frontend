// 스팟 상세 북마크(BookmarkSheet.tsx COLLECTION_COLOR_PALETTE)와 동일한 5색.
// bg는 스와치에 실제로 보이는 연한 톤, text는 선택 시 테두리/체크에 쓰이는 진한 톤.
// 6일째부터는 다시 1번 색상부터 순환한다.
export const DAY_COLOR_PALETTE = [
  { bg: "#FFF0F3", text: "#E31B59" },
  { bg: "#E8F3FF", text: "#0071E3" },
  { bg: "#F3F0FF", text: "#7C3AED" },
  { bg: "#E8F5EB", text: "#34C759" },
  { bg: "#FFF3E0", text: "#FF9F0A" },
];

export const getDayColor = (day: string) =>
  DAY_COLOR_PALETTE[(parseInt(day, 10) - 1) % DAY_COLOR_PALETTE.length];
