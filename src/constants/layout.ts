import { normalize, normalizeFontSize } from "@/utils/normalize";

// ── 버튼 / 인풋 ──────────────────────────────
export const BUTTON_HEIGHT = normalize(52);
export const INPUT_HEIGHT = normalize(52);
export const BUTTON_RADIUS = normalize(26);   // pill shape (height / 2)
export const INPUT_RADIUS = normalize(12);

// ── 카드 ─────────────────────────────────────
export const CARD_RADIUS = normalize(16);

// ── 레이아웃 패딩 ─────────────────────────────
export const CONTENT_PADDING = normalize(28); // 페이지 콘텐츠 좌우
export const GRID_PADDING = normalize(20);    // 카드 그리드 좌우

// ── 스페이싱 ─────────────────────────────────
export const SPACING_XS = normalize(4);
export const SPACING_SM = normalize(8);
export const SPACING_MD = normalize(16);
export const SPACING_LG = normalize(24);

// ── 아이콘 ───────────────────────────────────
export const ICON_SM = normalize(18);
export const ICON_MD = normalize(22);
export const ICON_LG = normalize(28);

// ── 폰트 크기 ────────────────────────────────
export const FONT_XS = normalizeFontSize(11);
export const FONT_SM = normalizeFontSize(13);
export const FONT_MD = normalizeFontSize(15);
export const FONT_LG = normalizeFontSize(17);
export const FONT_XL = normalizeFontSize(22);
export const FONT_2XL = normalizeFontSize(28);

// ── 탭바 ─────────────────────────────────────
export const TAB_BAR_HEIGHT = normalize(80);
