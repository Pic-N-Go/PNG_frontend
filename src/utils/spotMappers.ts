// 스팟 상세 API DTO → 화면 뷰모델 변환 (순수 함수)
// 스펙: docs/ai/specs/feature/spot-detail-screen/spot-detail-api.md
import type {
  ConvenienceDTO,
  ConvenienceInfo,
  FacilityStatus,
  ScheduleGroup,
  ScheduleRow,
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

const NOT_PROVIDED = '미제공'; // API가 값을 안 준 경우 (null·빈문자열)

// HTML 태그 제거 + 공백 정리. 값 없으면 '' 반환.
function clean(value: string | null): string {
  if (!value) return '';
  return value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

// 긴 값(이용시간 등): <br>은 줄바꿈으로 보존, 나머지 태그 제거, 빈 줄 제거
function cleanMultiline(value: string | null): string {
  if (!value) return '';
  return value
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]*>/g, ' ')
    .split('\n')
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter((line) => line.length > 0)
    .join('\n');
}

// 편의 항목 상태: 가능/있음=good, 미제공=missing, 그 외 값(없음 등)=neutral
function availStatus(raw: string | null): FacilityStatus {
  const s = clean(raw);
  if (!s) return 'missing';
  return s.startsWith('가능') || s.startsWith('있음') ? 'good' : 'neutral';
}

// 칩 표시값 — 앞 상태어 추출, 없으면 '미제공', 길면 절삭
function facilityValue(raw: string | null): string {
  const s = clean(raw);
  if (!s) return NOT_PROVIDED;
  if (s.startsWith('가능')) return '가능';
  if (s.startsWith('불가')) return '불가';
  if (s.startsWith('있음')) return '있음';
  if (s.startsWith('없음')) return '없음';
  return s.length > 10 ? `${s.slice(0, 10)}…` : s;
}

// 이용시간 행 파싱: 범위(~)가 없고 끝에 단일 시각이 있으면 이름-시간 쌍,
// 그 외(계절별 범위 "09:00~17:00 (입장마감 16:00)" 등)는 값만 있는 행으로
const SCHEDULE_TIME_RE = /(\d{1,2}:\d{2})\s*$/;
function parseScheduleRow(s: string): ScheduleRow {
  if (!s.includes('~')) {
    const m = s.match(SCHEDULE_TIME_RE);
    if (m && m.index && m.index > 0) {
      const name = s.slice(0, m.index).trim();
      if (name) return { name, time: m[1] };
    }
  }
  return { value: s };
}

// "[헤더]" 그룹 + "- 이름 시간" 행 + "※ 노트" 파싱. 헤더가 없으면 null(폴백 → 원문 표시)
function parseSchedule(raw: string | null): ScheduleGroup[] | null {
  if (!raw) return null;
  const lines = cleanMultiline(raw)
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
  const HEADER_RE = /^\[([^\]]+)\]\s*(.*)$/;
  if (!lines.some((l) => HEADER_RE.test(l))) return null;
  const groups: ScheduleGroup[] = [];
  let current: ScheduleGroup | null = null;
  for (const line of lines) {
    const h = line.match(HEADER_RE);
    if (h) {
      current = { title: h[1].trim(), rows: [] };
      groups.push(current);
      const rest = h[2].trim();
      if (rest) current.rows.push(parseScheduleRow(rest));
      continue;
    }
    if (!current) {
      current = { title: '', rows: [] };
      groups.push(current);
    }
    if (line.startsWith('※')) current.rows.push({ note: line.replace(/^※\s*/, '').trim() });
    else if (line.startsWith('-')) current.rows.push(parseScheduleRow(line.replace(/^-\s*/, '').trim()));
    else current.rows.push(parseScheduleRow(line));
  }
  return groups;
}

export function mapConvenience(c: ConvenienceDTO): ConvenienceInfo {
  const holiday = clean(c.restdate);
  const schedule = parseSchedule(c.usetime);
  return {
    facilities: [
      { key: 'parking', label: '주차장', value: facilityValue(c.parking), status: availStatus(c.parking) },
      { key: 'wheel', label: '휠체어 접근', value: facilityValue(c.wheelchairAccess), status: availStatus(c.wheelchairAccess) },
      { key: 'stroller', label: '유모차', value: facilityValue(c.strollerAccess), status: availStatus(c.strollerAccess) },
      { key: 'pet', label: '반려동물', value: facilityValue(c.petFriendly), status: availStatus(c.petFriendly) },
      { key: 'subway', label: '지하철', value: facilityValue(c.subwayAccess), status: availStatus(c.subwayAccess) },
      { key: 'holiday', label: '휴무일', value: holiday || NOT_PROVIDED, status: holiday ? 'accent' : 'missing' },
    ],
    schedule,
    scheduleText: schedule ? null : cleanMultiline(c.usetime) || null,
    phone: clean(c.infocenter) || null,
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
  { label: string; max: number; valueColor: string; iconBg: string; iconColor: string }
> = {
  // 색은 팩터 "종류" 고정 (핸드오프 디자인). value 텍스트는 공통 text색, 아이콘만 종류색.
  weather: { label: '날씨', max: 30, valueColor: '#1F1E1D', iconBg: '#E4EEFD', iconColor: '#2E7BF6' },
  dust: { label: '미세먼지', max: 20, valueColor: '#1F1E1D', iconBg: '#E7F6EC', iconColor: '#16A34A' },
  ozone: { label: '오존', max: 10, valueColor: '#1F1E1D', iconBg: '#EEE9FE', iconColor: '#7C4DFF' },
  goldenHour: { label: '골든아워', max: 5, valueColor: '#1F1E1D', iconBg: '#FEF3E2', iconColor: '#E8890B' },
  season: { label: '시즌', max: 15, valueColor: '#1F1E1D', iconBg: '#FDE8EF', iconColor: '#E31B59' },
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
    barPercent: Math.round((score / m.max) * 100),
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

  const conv = mapConvenience({
    parking: '가능',
    wheelchairAccess: null,
    strollerAccess: '없음',
    petFriendly: '',
    subwayAccess: null,
    usetime: '[주일미사]<br>- 새벽미사 06:00<br>※ 월요일 휴무<br>[토요일] 저녁미사 18:00',
    restdate: '매주 월요일',
    infocenter: '02-1',
  });
  const F = (k: string) => conv.facilities.find((f) => f.key === k);
  console.assert(F('parking')?.status === 'good' && F('parking')?.value === '가능', 'parking 가능→good 오류');
  console.assert(F('wheel')?.status === 'missing' && F('wheel')?.value === '미제공', 'wheel null→missing 오류');
  console.assert(F('stroller')?.status === 'neutral' && F('stroller')?.value === '없음', 'stroller 없음→neutral 오류');
  console.assert(F('holiday')?.status === 'accent' && F('holiday')?.value === '매주 월요일', 'holiday accent 오류');
  console.assert(conv.schedule?.length === 2 && conv.schedule[0].title === '주일미사', 'schedule 그룹/헤더 파싱 오류');
  const r0 = conv.schedule?.[0].rows[0];
  console.assert(!!r0 && 'time' in r0 && r0.time === '06:00' && r0.name === '새벽미사', 'schedule 시간 행 파싱 오류');
  const rNote = conv.schedule?.[0].rows[1];
  console.assert(!!rNote && 'note' in rNote && rNote.note === '월요일 휴무', 'schedule 노트 파싱 오류');
  const rInline = conv.schedule?.[1].rows[0];
  console.assert(!!rInline && 'time' in rInline && rInline.time === '18:00', 'schedule 인라인 헤더 행 오류');
  console.assert(conv.scheduleText === null && conv.phone === '02-1', 'schedule 파싱 시 scheduleText null / phone 오류');

  const convFree = mapConvenience({ parking: '<b>가능</b>', wheelchairAccess: null, strollerAccess: null, petFriendly: null, subwayAccess: null, usetime: '상시 개방 (평일 10:00~18:00)', restdate: null, infocenter: null });
  console.assert(convFree.facilities.find((f) => f.key === 'parking')?.status === 'good', 'HTML 래핑 가능→good 오류');
  console.assert(convFree.schedule === null && convFree.scheduleText === '상시 개방 (평일 10:00~18:00)', 'usetime 자유문 폴백 오류');
  console.assert(convFree.facilities.find((f) => f.key === 'holiday')?.status === 'missing', 'restdate 없음→missing 오류');
  console.assert(convFree.phone === null, 'infocenter 없음→null 오류');

  // 계절별 [헤더]+범위 → 노트박스가 아니라 값 행(value)으로
  const convSeason = mapConvenience({ parking: null, wheelchairAccess: null, strollerAccess: null, petFriendly: null, subwayAccess: null, usetime: '[1월~2월] 09:00~17:00 (입장마감 16:00)<br>[3월~5월] 09:00~18:00', restdate: null, infocenter: null });
  console.assert(convSeason.schedule?.length === 2 && convSeason.schedule[0].title === '1월~2월', 'season 그룹/헤더 오류');
  const sr = convSeason.schedule?.[0].rows[0];
  console.assert(!!sr && 'value' in sr && sr.value === '09:00~17:00 (입장마감 16:00)', 'season 범위→value 행 오류');
}
