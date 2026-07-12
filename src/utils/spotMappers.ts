// 스팟 상세 API DTO → 화면 뷰모델 변환 (순수 함수)
// 스펙: docs/ai/specs/feature/spot-detail-screen/spot-detail-api.md
import type {
  ConvenienceDTO,
  ConvenienceInfo,
  PhotogenicFactor,
  PhotogenicFactorKey,
  PhotogenicScoreData,
  PhotogenicScoreResponse,
  Review,
  ReviewDTO,
  ReviewListResponse,
  ReviewSortApi,
  ReviewSortOption,
  ReviewSummaryData,
  ReviewTimeSlot,
  SpotDetailInfo,
  SpotDetailResponse,
} from '@/types/spot';

const TIMESLOT_LABEL: Record<ReviewTimeSlot, string> = {
  SUNRISE: '일출',
  DAY: '낮',
  SUNSET: '일몰',
  NIGHT: '야간',
};

export const SORT_TO_API: Record<ReviewSortOption, ReviewSortApi> = {
  최신순: 'LATEST',
  '별점 높은순': 'RATING_HIGH',
  '별점 낮은순': 'RATING_LOW',
};

// 닉네임 → 아바타 배경색 (결정적 해시 — 같은 닉네임은 항상 같은 색)
const AVATAR_COLORS = ['#0071E3', '#2C5364', '#C9705A', '#7C3AED', '#E31B59', '#34C759', '#FF9500'];
export function avatarColorFor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) hash = (hash * 31 + name.charCodeAt(i)) | 0;
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

const CONVENIENCE_NONE = '정보 없음';

// null·빈문자열 → "정보 없음", 그 외는 원값 (HTML 태그/개행은 제거)
function orNone(value: string | null): string {
  if (!value) return CONVENIENCE_NONE;
  const clean = value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  return clean || CONVENIENCE_NONE;
}

// 셀용 짧은 상태값 — "가능 요금(...)" 같은 자유 텍스트는 앞 상태어만 추출 (셀 레이아웃 보호)
function shortAvail(value: string | null): string {
  const s = orNone(value);
  if (s.startsWith('가능')) return '가능';
  if (s.startsWith('불가')) return '불가';
  if (s.startsWith('있음')) return '있음';
  if (s.startsWith('없음')) return '없음';
  return s.length > 12 ? `${s.slice(0, 12)}…` : s;
}

// "가능"/"있음"으로 시작하면 green (shortAvail과 동일하게 orNone 정제값 기준 → HTML/공백 프리픽스도 일치)
function availVariant(value: string | null): ConvenienceInfo['cells'][number]['variant'] {
  const s = orNone(value);
  return s.startsWith('가능') || s.startsWith('있음') ? 'green' : 'default';
}

export function mapConvenience(c: ConvenienceDTO): ConvenienceInfo {
  return {
    transport: [
      // 상세 텍스트는 넓은 교통 카드에 유지 (셀은 짧게)
      { icon: 'parking', main: `주차 ${orNone(c.parking)}`, sub: '' },
      { icon: 'car', main: orNone(c.subwayAccess), sub: '' },
    ],
    cells: [
      { label: '주차장', value: shortAvail(c.parking), variant: availVariant(c.parking) },
      { label: '휠체어 접근', value: shortAvail(c.wheelchairAccess), variant: availVariant(c.wheelchairAccess) },
      { label: '유모차', value: shortAvail(c.strollerAccess), variant: availVariant(c.strollerAccess) },
      { label: '반려동물', value: shortAvail(c.petFriendly), variant: availVariant(c.petFriendly) },
      { label: '지하철', value: orNone(c.subwayAccess), variant: 'default' },
      { label: '문의 전화', value: orNone(c.infocenter), variant: 'default' },
    ],
  };
}

export function mapSpotDetail(dto: SpotDetailResponse): { info: SpotDetailInfo; convenience: ConvenienceInfo } {
  return {
    info: {
      id: String(dto.id),
      badge: dto.badge ? '관광공사 인증' : null,
      name: dto.name,
      address: dto.address,
      rating: dto.stats.avgRating,
      reviewCount: dto.stats.reviewCount,
      photoCount: dto.stats.photoCount,
      tags: dto.tags,
      heroPhotoCount: dto.stats.photoCount,
    },
    convenience: mapConvenience(dto.convenience),
  };
}

// "2026-06-15" / "2026-06-16T10:30:00" → "2026.06.15"
function formatReviewDate(dto: ReviewDTO): string {
  return (dto.visitedAt ?? dto.createdAt).slice(0, 10).replace(/-/g, '.');
}

export function mapReview(dto: ReviewDTO): Review {
  return {
    id: String(dto.id),
    name: dto.nickname,
    avatarInitial: dto.nickname.trim().charAt(0) || '?',
    avatarColor: avatarColorFor(dto.nickname),
    rating: dto.rating,
    badge: dto.timeSlot ? TIMESLOT_LABEL[dto.timeSlot] : undefined,
    date: formatReviewDate(dto),
    text: dto.content,
    photos: dto.photos.length > 0 ? dto.photos : undefined,
    equipment: dto.equipmentInfo ?? undefined,
  };
}

export function mapReviewSummary(s: ReviewListResponse['summary']): ReviewSummaryData {
  const total = s.totalCount;
  const distribution = [5, 4, 3, 2, 1].map((star) => ({
    star,
    percent: total > 0 ? Math.round(((s.distribution[String(star)] ?? 0) / total) * 100) : 0,
  }));
  return { score: s.avgRating, reviewCount: total, distribution };
}

export function mapReviewList(res: ReviewListResponse): { summary: ReviewSummaryData; reviews: Review[] } {
  return {
    summary: mapReviewSummary(res.summary),
    reviews: res.reviews.content.map(mapReview),
  };
}

// ── 포토제닉 ──────────────────────────────
// 팩터별 만점(총 80) + 디자인 색/라벨 (클라 고정)
const PG_FACTOR_META: Record<
  PhotogenicFactorKey,
  { label: string; max: number; valueColor: string; iconBg: string; iconColor: string; barColor: string; wide?: boolean }
> = {
  weather: { label: '날씨', max: 30, valueColor: '#000', iconBg: '#E8F3FF', iconColor: '#0071E3', barColor: '#0071E3' },
  dust: { label: '미세먼지', max: 20, valueColor: '#34C759', iconBg: '#E8F5EB', iconColor: '#34C759', barColor: '#34C759' },
  ozone: { label: '오존', max: 10, valueColor: '#7C3AED', iconBg: '#F3F0FF', iconColor: '#7C3AED', barColor: '#7C3AED' },
  goldenHour: { label: '골든아워', max: 5, valueColor: '#FF9F0A', iconBg: '#FFF3E0', iconColor: '#FF9500', barColor: '#FF9500' },
  season: { label: '시즌', max: 15, valueColor: '#E31B59', iconBg: '#FFF0F3', iconColor: '#E31B59', barColor: '#E31B59', wide: true },
};

function toFactor(key: PhotogenicFactorKey, dtoLabel: string, score: number): PhotogenicFactor {
  const m = PG_FACTOR_META[key];
  return {
    key,
    label: m.label,
    value: dtoLabel,
    score,
    valueColor: m.valueColor,
    iconBg: m.iconBg,
    iconColor: m.iconColor,
    barColor: m.barColor,
    barPercent: Math.round((score / m.max) * 100),
    wide: m.wide,
  };
}

export function mapPhotogenicScore(dto: PhotogenicScoreResponse): PhotogenicScoreData {
  const gh = dto.goldenHour;
  return {
    score: dto.score,
    maxScore: 80,
    grade: dto.grade,
    goldenHour: {
      label: gh.label,
      minutesUntilStart: gh.minutesUntilStart,
      startTime: gh.startTime,
      isActive: gh.minutesUntilStart === null && gh.score === 5,
    },
    // 표시 순서: 날씨·미세먼지·오존·골든아워 (소형) → 시즌 (와이드)
    factors: [
      toFactor('weather', dto.weather.label, dto.weather.score),
      toFactor('dust', dto.fineDust.label, dto.fineDust.score),
      toFactor('ozone', dto.ozone.label, dto.ozone.score),
      toFactor('goldenHour', dto.goldenHour.label, dto.goldenHour.score),
      toFactor('season', dto.season.label, dto.season.score),
    ],
  };
}

// ponytail: dev 전용 self-check — 분포 percent/시간대 라벨/null 처리 회귀 방지 (프로덕션 no-op)
if (__DEV__) {
  const sum = mapReviewSummary({ avgRating: 4, totalCount: 4, distribution: { '5': 1, '4': 1, '3': 2 } });
  console.assert(sum.distribution.find((d) => d.star === 5)?.percent === 25, 'percent 계산 오류');
  console.assert(mapReviewSummary({ avgRating: 0, totalCount: 0, distribution: {} }).distribution[0].percent === 0, 'div-by-zero 처리 오류');
  const base = { id: 1, userId: 1, nickname: '홍길동', rating: 5, content: 'x', equipmentInfo: null, photos: [], visitedAt: '2026-06-15', createdAt: '2026-06-16T10:30:00' };
  console.assert(mapReview({ ...base, timeSlot: 'NIGHT' }).badge === '야간', 'timeSlot 라벨 오류');
  console.assert(mapReview({ ...base, timeSlot: null }).badge === undefined, 'timeSlot null 배지 오류');
  console.assert(mapReview({ ...base, timeSlot: null }).date === '2026.06.15', 'date 포맷 오류');

  const pgBase = { score: 69, grade: '좋음', weather: { label: '맑음', score: 30 }, fineDust: { label: '좋음', score: 20 }, ozone: { label: '보통', score: 6 }, season: { label: '벚꽃 47%', score: 7 } };
  const active = mapPhotogenicScore({ ...pgBase, goldenHour: { label: '골든아워', score: 5, minutesUntilStart: null, startTime: null } });
  console.assert(active.goldenHour.isActive === true, '골든아워 진행중 판정 오류');
  console.assert(active.maxScore === 80, 'maxScore 오류');
  console.assert(active.factors.find((f) => f.key === 'weather')?.barPercent === 100, 'weather barPercent 오류');
  console.assert(active.factors.find((f) => f.key === 'ozone')?.barPercent === 60, 'ozone barPercent 오류');
  const ended = mapPhotogenicScore({ ...pgBase, goldenHour: { label: '해당 없음', score: 0, minutesUntilStart: null, startTime: null } });
  console.assert(ended.goldenHour.isActive === false, '골든아워 종료 판정 오류');
  console.assert(ended.goldenHour.label === '해당 없음', '골든아워 label 전달 오류');

  const conv = mapConvenience({ parking: '가능', wheelchairAccess: null, strollerAccess: '없음', petFriendly: '', subwayAccess: null, usetime: 'a<br>\nb', restdate: null, infocenter: '02-1' });
  console.assert(conv.cells.find((c) => c.label === '휠체어 접근')?.value === '정보 없음', 'convenience null→정보없음 오류');
  console.assert(conv.cells.find((c) => c.label === '주차장')?.variant === 'green', 'convenience 가능→green 오류');
  console.assert(orNone('a<br>\nb') === 'a b', 'convenience HTML/개행 정리 오류');
  const convLong = mapConvenience({ parking: '가능 요금 (5시간 무료 / 10분당 600원)', wheelchairAccess: null, strollerAccess: '불가', petFriendly: null, subwayAccess: null, usetime: null, restdate: null, infocenter: null });
  console.assert(convLong.cells.find((c) => c.label === '주차장')?.value === '가능', '긴 parking 텍스트 → 짧은 상태값 오류');
  console.assert(convLong.cells.find((c) => c.label === '주차장')?.variant === 'green', '긴 parking → green 오류');
  const convHtml = mapConvenience({ parking: '<b>가능</b>', wheelchairAccess: null, strollerAccess: null, petFriendly: null, subwayAccess: null, usetime: null, restdate: null, infocenter: null });
  console.assert(convHtml.cells.find((c) => c.label === '주차장')?.variant === 'green', 'HTML 래핑 가능 → variant/값 불일치');
}
