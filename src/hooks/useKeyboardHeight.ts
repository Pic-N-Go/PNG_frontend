import { useEffect, useState } from 'react';
import { Dimensions, Keyboard } from 'react-native';

/**
 * 화면 하단부터 키보드 상단까지의 거리(dp). 키보드가 닫혀 있으면 0.
 * 하단에 고정된 요소를 키보드 위로 올리려면 이 값을 그대로 paddingBottom으로 주면 된다.
 *
 * `endCoordinates.height`를 쓰지 않는 이유: 그 값은 **창(window) 하단** 기준이고, 창 높이는
 * 내비게이션 바를 제외한 값이다. 그런데 이 앱은 엣지투엣지(app.config.js)라 뷰가 화면 전체를
 * 쓰므로, height를 그대로 쓰면 내비바 높이(약 48dp)만큼 부족해진다. 실측(갤럭시):
 *
 *   height=310.4  screenY=494.9  window=779.4  screen=853.3
 *   screenY + height = 805.3 = 상태바(26) + window(779.4)  ← height는 창 기준
 *   screen - screenY = 358.4                                ← 화면 기준으로 실제 필요한 값
 *
 * screenY로 직접 재면 height의 기준을 알 필요가 없다.
 *
 * 이 값을 쓸 때는 insets.bottom을 **더하지 않는다** — 내비바 자리는 키보드가 이미 덮고 있고,
 * 이 계산에 그 구간이 포함돼 있다.
 */
export function useKeyboardOverlap() {
  const [overlap, setOverlap] = useState(0);

  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', (e) => {
      setOverlap(Math.max(0, Dimensions.get('screen').height - e.endCoordinates.screenY));
    });
    const hide = Keyboard.addListener('keyboardDidHide', () => setOverlap(0));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  return overlap;
}
