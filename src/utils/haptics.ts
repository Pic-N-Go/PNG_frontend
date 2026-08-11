import * as Haptics from 'expo-haptics';

/**
 * 투표처럼 "소비되는" 동작의 촉각 피드백.
 * 웹에는 Taptic Engine이 없고 expo-haptics가 no-op이라 호출만 하고 결과는 무시한다.
 * 실패해도 기능에는 영향이 없으므로 예외를 삼킨다(진동이 꺼진 기기·시뮬레이터 포함).
 */
export function voteHaptic() {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}

/** 수상(1~3위) 결과 진입 축하. voteHaptic과 같은 이유로 실패를 삼킨다. */
export function awardHaptic() {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
}
