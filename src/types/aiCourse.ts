export interface AiCoursePlanRequest {
  prompt: string;
  region?: string;
  targetDate: string; // YYYY-MM-DD
}

export type AiCoursePlanStatus = 'PROCESSING' | 'COMPLETED' | 'FAILED';

export interface AiCoursePlanResponse {
  taskId: string;
  status: AiCoursePlanStatus;
  message?: string;
  courseId?: number;
  title?: string;
}

export interface SuggestionChip {
  label: string;
  prompt: string;
  region: string;
}

export const getSeasonalSuggestions = (): SuggestionChip[] => {
  const month = new Date().getMonth() + 1;

  // 봄 (3월 ~ 5월)
  if (month >= 3 && month <= 5) {
    return [
      { label: '제주 유채꽃 출사', prompt: '제주도에서 유채꽃과 봄 풍경을 담기 좋은 감성 코스 추천해줘', region: '제주' },
      { label: '서울 벚꽃 나들이', prompt: '서울에서 벚꽃과 봄 산책로를 둘러보는 당일치기 출사 코스 짜줘', region: '서울' },
      { label: '경주 고택 및 벚꽃', prompt: '경주에서 고즈넉한 한옥과 벚꽃길을 촬영하기 좋은 코스 기획해줘', region: '경북' },
      { label: '도심 야경 출사', prompt: '도심 속 화려한 불빛과 야경을 담을 수 있는 저녁 출사 코스 알려줘', region: '서울' },
    ];
  }
  // 여름 (6월 ~ 8월)
  if (month >= 6 && month <= 8) {
    return [
      { label: '부산 오션뷰 해변', prompt: '부산에서 시원한 바다 풍경과 해변을 담기 좋은 출사 코스 추천해줘', region: '부산' },
      { label: '동해 일출 출사', prompt: '강원도 동해안에서 웅장한 일출과 바다를 촬영하는 새벽 코스 짜줘', region: '강원' },
      { label: '제주 해안도로 드라이브', prompt: '제주도 해안도로를 따라 푸른 바다를 담는 당일치기 출사 코스 알려줘', region: '제주' },
      { label: '도심 야경 출사', prompt: '여름밤 도심의 야경과 산책로를 담기 좋은 저녁 코스 기획해줘', region: '서울' },
    ];
  }
  // 가을 (9월 ~ 11월)
  if (month >= 9 && month <= 11) {
    return [
      { label: '부산 노을 및 야경', prompt: '부산에서 노을과 야경 보기 좋은 감성 출사 코스 추천해줘', region: '부산' },
      { label: '상암 억새풀 감성 출사', prompt: '서울 근교에서 가을 억새풀과 노을을 담기 좋은 감성 코스 짜줘', region: '서울' },
      { label: '경주 단풍 명소 투어', prompt: '경주에서 오색 단풍과 고택의 조화를 담는 가을 출사 코스 알려줘', region: '경북' },
      { label: '강원도 은하수 출사', prompt: '강원도에서 밤하늘 별과 은하수를 촬영하기 좋은 맑은 출사 코스 기획해줘', region: '강원' },
    ];
  }
  // 겨울 (12월 ~ 2월)
  return [
    { label: '강원도 겨울 설경', prompt: '강원도에서 새하얀 설경과 겨울 산을 담기 좋은 출사 코스 추천해줘', region: '강원' },
    { label: '도심 연말 야경 출사', prompt: '도심의 연말 조명과 화려한 야경을 담을 수 있는 저녁 코스 짜줘', region: '서울' },
    { label: '제주 겨울 동백꽃', prompt: '제주도에서 붉은 동백꽃과 겨울 숲길을 둘러보는 출사 코스 알려줘', region: '제주' },
    { label: '일출 명소 출사', prompt: '겨울 바다에서 맑은 새해 일출을 촬영할 수 있는 코스 기획해줘', region: '강원' },
  ];
};
