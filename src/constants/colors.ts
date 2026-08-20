import colors from './colors.json';

/**
 * 색상 단일 소스는 colors.json.
 * tailwind.config.js도 같은 파일을 읽으므로 className(bg-card 등)과 값이 항상 일치한다.
 *
 * 브랜드 투명도는 4단계(5/10/30/90)로 수렴시켰다. 새 단계를 늘리지 말 것.
 */

/** 브랜드/액센트 핑크. CTA·활성 상태 등 "화면을 전환하는" 요소 */
export const BRAND = colors.brand;

// 브랜드 투명도 4단계. hex에서 파생시켜 brand 값이 바뀌면 같이 따라온다.
// className은 bg-brand/5 · bg-brand/10 · bg-brand/30 · bg-brand/90 으로 동일하게 쓸 것.
const rgb = (hex: string) =>
  `${parseInt(hex.slice(1, 3), 16)},${parseInt(hex.slice(3, 5), 16)},${parseInt(hex.slice(5, 7), 16)}`;
const BR = rgb(colors.brand);

/** 깔린 배경·아이콘 타일 */
export const BRAND_TINT = `rgba(${BR},0.05)`;
/** 선택·활성 상태 배경 */
export const BRAND_TINT_ACTIVE = `rgba(${BR},0.1)`;
/** 테두리·중간 강조 */
export const BRAND_MUTED = `rgba(${BR},0.3)`;
/** 사진 위 오버레이 배지 등 거의 불투명 */
export const BRAND_STRONG = `rgba(${BR},0.9)`;
/** 카드·인풋 배경 */
export const CARD = colors.card;
/** 보조 텍스트·아이콘 회색. iOS secondaryLabel의 라이트모드 합성값 */
export const TEXT_SUB = colors.sub;
/** 구분선(hairline). 굵기는 layout.ts의 HAIRLINE_WIDTH */
export const HAIRLINE = colors.hairline;

/** 모달 딤·사진 위 반투명 배지 배경 */
export const SCRIM = colors.scrim;
