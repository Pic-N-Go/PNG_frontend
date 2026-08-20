import { Platform, ViewStyle } from 'react-native';

/**
 * 그림자는 "스크롤 흐름 위에 떠 있는 것"에만 쓴다.
 * 콘텐츠 카드는 CLAUDE.md 규칙대로 배경색 대비로만 층을 나누고 그림자를 쓰지 않는다.
 *
 * iOS는 shadow* 4속성, Android는 elevation을 써야 해서 색과 달리 JSON이 아닌 스타일 객체로 둔다.
 */

const shadow = (opacity: number, radius: number, y: number, elevation: number): ViewStyle =>
  Platform.select({
    ios: { shadowColor: '#000', shadowOpacity: opacity, shadowRadius: radius, shadowOffset: { width: 0, height: y } },
    android: { elevation },
    default: {},
  }) as ViewStyle;

/** 콘텐츠 위에 떠 있는 컨트롤 — 검색바, 지도 위 버튼, 토글 손잡이 */
export const SHADOW_CONTROL = shadow(0.06, 12, 2, 3);

/** 화면을 덮는 오버레이 — 바텀시트, 팝업, 툴팁, FAB */
export const SHADOW_OVERLAY = shadow(0.12, 16, 4, 6);
