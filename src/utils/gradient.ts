/**
 * 시드(ID, 문자열 등)를 기반으로 일관된 감각적인 3색 그라디언트를 반환하는 유틸리티.
 * 출사/여행/사진 서비스의 톤앤매너에 맞춘 노을, 바다, 새벽, 숲, 황혼 등 다채로운 팔레트를 제공합니다.
 */

const GRADIENTS: [string, string, string][] = [
  ['#1a1530', '#4a2545', '#9e4770'], // 딥 플럼 & 로즈
  ['#0b1d3a', '#1e3c72', '#2a5298'], // 미드나잇 오션
  ['#1f1c2c', '#4a3f55', '#928dab'], // 트와일라잇 퍼플
  ['#16222f', '#243b55', '#4b6cb7'], // 코발트 블루
  ['#2c1b2d', '#5c2d54', '#a3487f'], // 선셋 마젠타
  ['#0f2027', '#203a43', '#2c5364'], // 딥 에메랄드 틸
  ['#1e130c', '#4a2c11', '#9a5b2d'], // 골든아워 브라운
  ['#232526', '#414345', '#6e7074'], // 차콜 그레이
  ['#2e1437', '#5b2b62', '#b3548e'], // 오키드 핑크
  ['#0d2b45', '#203c56', '#544e68'], // 노르딕 스카이
];

export function getFallbackGradient(seed: number | string | null | undefined): [string, string, string] {
  if (seed == null || seed === '') {
    return GRADIENTS[0];
  }
  let hash = 0;
  const str = String(seed);
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return GRADIENTS[Math.abs(hash) % GRADIENTS.length];
}
