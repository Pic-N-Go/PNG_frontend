import { normalize, normalizeFontSize } from "@/utils/normalize";

// ── 버튼 / 인풋 / 컨트롤 ──────────────────────
export const BUTTON_HEIGHT = normalize(52);
export const INPUT_HEIGHT = normalize(52);
export const CONTROL_SIZE = normalize(40);
export const BUTTON_RADIUS = normalize(26);   // pill shape (height / 2)
export const INPUT_RADIUS = normalize(12);
export const COMPACT_CONTROL_HEIGHT = normalize(44);
export const COMPACT_CONTROL_RADIUS = normalize(22);

// ── 카드 / 배지 ───────────────────────────────
export const CARD_RADIUS = normalize(16);
export const BADGE_RADIUS = normalize(6);

// ── 레이아웃 패딩 ─────────────────────────────
export const CONTENT_PADDING = normalize(28); // 페이지 콘텐츠 좌우
export const GRID_PADDING = normalize(20);    // 카드 그리드 좌우

// ── 스페이싱 ─────────────────────────────────
export const SPACING_XS = normalize(4);
export const SPACING_SM = normalize(8);
export const SPACING_MD = normalize(16);
export const SPACING_LG = normalize(24);
export const SPACING_XL = normalize(32);

// ── 아이콘 ───────────────────────────────────
export const ICON_SM = normalize(18);
export const ICON_MD = normalize(22);
export const ICON_LG = normalize(28);

// ── 폰트 크기 ────────────────────────────────
export const FONT_2XS = normalizeFontSize(10); // 배지·태그 전용
export const FONT_XS = normalizeFontSize(11);
export const FONT_SM = normalizeFontSize(13);
export const FONT_MD = normalizeFontSize(15);
export const FONT_LG = normalizeFontSize(17);
export const FONT_XL = normalizeFontSize(22);
export const FONT_2XL = normalizeFontSize(28);

// ── 탭바 / 네비게이션 ─────────────────────────
export const TAB_BAR_HEIGHT = normalize(80);
export const HEADER_HEIGHT = normalize(52);

// ── 소셜 버튼 ─────────────────────────────────
export const SOCIAL_BUTTON_HEIGHT = normalize(48);
export const SOCIAL_BUTTON_RADIUS = normalize(24);

// ── 바텀시트 ──────────────────────────────────
export const BOTTOM_SHEET_RADIUS = normalize(24);

// ── 피커 / 휠 ─────────────────────────────────
export const WHEEL_WIDTH = normalize(56);
export const WHEEL_ITEM_HEIGHT = normalize(40);
export const WHEEL_VISIBLE_HEIGHT = WHEEL_ITEM_HEIGHT * 3;
export const WHEEL_SELECTION_RADIUS = normalize(8);

/** 구분선 굵기. 색은 constants/colors의 HAIRLINE */
export const HAIRLINE_WIDTH = 0.5;

/** 폼 컨트롤 테두리 굵기 — 입력 포커스, 선택 상태 칩/체크박스, 아웃라인 버튼 */
export const BORDER_CONTROL = 1.5;

/** 빈 상태 카드 기본 높이 (MY 탭 섹션 등) */
export const EMPTY_CARD_HEIGHT = normalize(120);
