import { Dimensions } from "react-native";

export const BASE_WIDTH = 390; // 디자인 기준 (iPhone 15 Pro)
const MIN_WIDTH = 360;         // 안드로이드 보급형 최소
const MAX_WIDTH = 430;         // iPhone 15 Plus/Pro Max 최대

// 앱이 세로 고정(portrait-only)이고 폴더블 미지원이므로
// 모듈 로드 시점에 1회 캡처해도 실용적 문제 없음.
// 화면 회전·폴더블 지원이 필요해지면 useWindowDimensions 훅으로 전환할 것.
const { width } = Dimensions.get("window");
const clampedWidth = Math.min(Math.max(width, MIN_WIDTH), MAX_WIDTH);
export const scale = clampedWidth / BASE_WIDTH;

/**
 * 디자인 기준값(390px)을 현재 기기 화면 너비에 맞게 스케일링합니다.
 * 지원 범위: 360dp(안드로이드 보급형) ~ 430dp(iPhone 15 Pro Max)
 *
 * NativeWind className으로 표현할 수 없는 고정값(버튼 높이, 아이콘 크기 등)에만 사용하세요.
 *
 * @example
 * style={{ height: normalize(52) }}
 */
export function normalize(size: number): number {
  return Math.round(size * scale);
}

/**
 * 폰트 크기 전용 스케일링. normalize보다 변화폭을 줄여 가독성을 유지합니다.
 *
 * 주의: Text 컴포넌트의 allowFontScaling(기본값 true)이 활성화된 경우,
 * OS의 큰 글씨 설정이 이 값 위에 중첩 적용됩니다.
 * 팀 정책에 따라 allowFontScaling={false} 여부를 결정하세요.
 */
export function normalizeFontSize(size: number): number {
  const fontScale = (scale - 1) * 0.5 + 1;
  return Math.round(size * fontScale);
}
