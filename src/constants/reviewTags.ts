import type { ReviewTagApi } from '@/types/spot';

/** 서버 @Size(max = 5). 중복은 서버가 Set으로 제거한다. */
export const MAX_REVIEW_TAGS = 5;

/**
 * 리뷰 태그 라벨. 서버는 enum 이름만 주고받고 한글 라벨과 `#` 접두사는 프론트가 소유한다
 * (백엔드 ReviewTag enum 주석에 명시 — 양쪽에 매핑표를 두면 한쪽만 바뀌는 사고가 난다).
 * 목록 조회 엔드포인트가 없어 값 추가·변경은 양쪽 동시 배포가 필요하다.
 *
 * 순서는 목업(review-write.html)의 칩 배열을 따른다 — enum 선언 순서와는 일출명소 위치가 다르다.
 */
export const REVIEW_TAGS: { tag: ReviewTagApi; label: string }[] = [
  { tag: 'LIGHTING', label: '채광맛집' },
  { tag: 'BEST_SHOT', label: '인생샷' },
  { tag: 'MOODY', label: '감성사진' },
  { tag: 'NIGHT_VIEW', label: '야경명소' },
  { tag: 'EASY_PARKING', label: '주차편함' },
  { tag: 'TRIPOD_NEEDED', label: '삼각대필수' },
  { tag: 'GOOD_ACCESS', label: '접근성좋음' },
  { tag: 'SUNRISE', label: '일출명소' },
  { tag: 'GOOD_FOR_SOLO', label: '혼자가기좋음' },
];

export const REVIEW_TAG_LABEL = Object.fromEntries(
  REVIEW_TAGS.map(({ tag, label }) => [tag, label]),
) as Record<ReviewTagApi, string>;
