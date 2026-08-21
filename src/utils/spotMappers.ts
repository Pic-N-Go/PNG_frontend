// 스팟 상세 API DTO → 화면 뷰모델 변환 (순수 함수)
// 스펙: docs/ai/specs/feature/spot-detail-screen/spot-detail-api.md
// ponytail: 카테고리 라벨 테이블은 SpotHeroPlaceholder가 이미 갖고 있어 그대로 재사용한다(라벨 중복 정의 방지).
// 아이콘까지 딸려오는 게 부담되면 constants/로 분리 — 지금은 유일한 소비처라 이동 비용이 더 크다.
import { SPOT_CATEGORY_MAP } from '@/components/spot/SpotHeroPlaceholder';
import type { PhotoExifData } from '@/types/photo';
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
  ReviewTagApi,
  MyReview,
  MyReviewDTO,
  MyReviewListResponse,
  MapSpot,
  ReviewedSpotResponse,
  PhotoExifDTO,
  ReviewExifResponse,
  SpotDetailInfo,
  SpotDetailResponse,
  RecommendedSpotResponse,
  SpotItem,
  SpotResponse,
  TimePeriodApi,
} from '@/types/spot';

const TIME_PERIOD_LABEL: Record<TimePeriodApi, string> = {
  SUNRISE: '일출',
  DAYTIME: '낮',
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

// 시·도 정식명 → 축약형 (예: 서울특별시 → 서울). 개편 전후 명칭(강원도/강원특별자치도 등) 모두 대응.
const SIDO_ABBR: Record<string, string> = {
  서울특별시: '서울',
  부산광역시: '부산',
  대구광역시: '대구',
  인천광역시: '인천',
  광주광역시: '광주',
  대전광역시: '대전',
  울산광역시: '울산',
  세종특별자치시: '세종',
  경기도: '경기',
  강원도: '강원',
  강원특별자치도: '강원',
  충청북도: '충북',
  충청남도: '충남',
  전라북도: '전북',
  전북특별자치도: '전북',
  전라남도: '전남',
  경상북도: '경북',
  경상남도: '경남',
  제주도: '제주',
  제주특별자치도: '제주',
};

// 대표 이미지 없을 때 ETC 카테고리 폴백 라벨: 시·도(축약형) + 시·군·구까지만
export function regionLabelFrom(address: string): string | null {
  const [sido, sigungu] = address.trim().split(' ');
  if (!sido) return null;
  const shortSido = SIDO_ABBR[sido] ?? sido;
  return sigungu ? `${shortSido} ${sigungu}` : shortSido;
}

// ponytail: dev 전용 self-check — 시·도 축약 회귀 방지 (프로덕션 no-op)
if (__DEV__) {
  console.assert(regionLabelFrom('서울특별시 강남구 압구정로 161') === '서울 강남구', '서울특별시 축약 오류');
  console.assert(regionLabelFrom('강원특별자치도 속초시 중앙로') === '강원 속초시', '강원특별자치도 축약 오류');
  console.assert(regionLabelFrom('제주특별자치도 서귀포시') === '제주 서귀포시', '제주특별자치도 축약 오류');
  console.assert(regionLabelFrom('') === null, '빈 주소 → null 오류');
}

// 서버 enum 코드 → 표시용 라벨. ETC는 버린다(라벨이 "기타"라 칩으로 달 의미가 없다).
// mapPopularSpot과 같은 규칙으로 최대 2개만 남긴다 — 바텀시트 한 줄에 들어가는 개수다.
function categoryLabels(codes: string[] | undefined): string[] {
  return (codes ?? [])
    .filter((code) => code !== 'ETC')
    .map((code) => SPOT_CATEGORY_MAP[code]?.label)
    .filter((label): label is string => !!label)
    .slice(0, 2);
}

/**
 * PIC MAP의 두 핀 목록을 하나로 합친다.
 * 같은 스팟을 리뷰도 쓰고 즐겨찾기도 했으면 핀은 하나이고 두 플래그가 함께 선다 —
 * 나누어 담으면 같은 좌표에 핀이 겹쳐 찍히고, "리뷰" 필터에서도 그 스팟이 빠진다.
 *
 * 순서는 리뷰 핀(작성일 최신순) → 즐겨찾기 전용(최근 담은 순). 서버 두 응답의 순서를 그대로 잇는다.
 */
export function mergeMapSpots(
  reviewed: ReviewedSpotResponse[] | undefined,
  bookmarked: SpotResponse[] | undefined,
): MapSpot[] {
  const byId = new Map<number, MapSpot>();

  // 리뷰 핀을 먼저 넣는다 — 작성일·별점을 이쪽만 갖고 있다.
  for (const dto of reviewed ?? []) {
    byId.set(dto.spotId, {
      id: String(dto.spotId),
      name: dto.name,
      lat: dto.latitude,
      lng: dto.longitude,
      loc: regionLabelFrom(dto.address ?? '') ?? '',
      photo: toHttps(dto.imageUrl),
      reviewed: true,
      bookmarked: false,
      date: dto.reviewedAt.slice(0, 10).replace(/-/g, '.'),
      rating: dto.rating,
      categories: categoryLabels(dto.categories),
    });
  }

  for (const dto of bookmarked ?? []) {
    const existing = byId.get(dto.id);
    if (existing) {
      existing.bookmarked = true;
      continue;
    }
    byId.set(dto.id, {
      id: String(dto.id),
      name: dto.name,
      lat: dto.latitude,
      lng: dto.longitude,
      loc: regionLabelFrom(dto.address ?? '') ?? '',
      photo: toHttps(dto.thumbnailUrl ?? dto.imageUrl),
      reviewed: false,
      bookmarked: true,
      // 즐겨찾기만 한 스팟은 리뷰가 없다. 바텀시트에서 통계 카드를 렌더하지 않는 근거가 이 null이다.
      date: null,
      rating: null,
      categories: categoryLabels(dto.categories),
    });
  }

  return [...byId.values()];
}

// ponytail: dev 전용 self-check — 머지가 이 작업에서 유일하게 틀릴 수 있는 로직이다 (프로덕션 no-op)
if (__DEV__) {
  const rev: ReviewedSpotResponse = {
    spotId: 1, name: '광안리', address: '부산광역시 수영구 광안해변로',
    latitude: 35.1, longitude: 129.1, imageUrl: null,
    reviewedAt: '2026-06-16T10:30:00.123456', rating: 4,
    // ETC는 걸러지고 최대 2개만 남아야 한다 (NIGHT_VIEW=야경, BEACH=해변, PARK는 잘림)
    categories: ['NIGHT_VIEW', 'BEACH', 'PARK', 'ETC'],
  };
  const bmk = {
    id: 1, name: '광안리', address: '부산광역시 수영구', latitude: 35.1, longitude: 129.1,
    categories: [], badge: false, imageUrl: null, thumbnailUrl: null,
    bookmarkCount: 0, reviewCount: 0, photogenicScore: 0, reviewAverage: null,
  } as SpotResponse;

  const onlyReview = mergeMapSpots([rev], []);
  console.assert(onlyReview[0].categories.join() === '야경,해변', `카테고리 라벨 변환 오류: ${onlyReview[0].categories}`);
  console.assert(onlyReview.length === 1 && onlyReview[0].reviewed && !onlyReview[0].bookmarked, '리뷰 전용 핀 오류');
  console.assert(onlyReview[0].date === '2026.06.16', '리뷰 작성일 포맷 오류');
  console.assert(onlyReview[0].loc === '부산 수영구', '지역명 축약 오류');

  const onlyBookmark = mergeMapSpots([], [bmk]);
  console.assert(onlyBookmark.length === 1 && !onlyBookmark[0].reviewed && onlyBookmark[0].bookmarked, '즐겨찾기 전용 핀 오류');
  console.assert(onlyBookmark[0].date === null && onlyBookmark[0].rating === null, '즐겨찾기 전용은 작성일·별점이 없어야 한다');

  // 같은 스팟 — 핀 1개에 두 플래그. 여기가 무너지면 핀이 겹쳐 찍힌다.
  const both = mergeMapSpots([rev], [bmk]);
  console.assert(both.length === 1, '같은 스팟이 핀 2개로 갈라졌다');
  console.assert(both[0].reviewed && both[0].bookmarked, '두 플래그가 함께 서지 않았다');
  console.assert(both[0].rating === 4, '머지 후 리뷰 별점이 사라졌다');

  console.assert(mergeMapSpots(undefined, undefined).length === 0, '로딩 중 undefined 처리 오류');
}

/**
 * 컬렉션별 스팟 목록 → 스팟별 소속 컬렉션 맵.
 * 서버가 스팟 응답에 소속 컬렉션을 안 실어줘서(isBookmarked만 있다) 프론트에서 뒤집는다.
 * 한 스팟이 여러 컬렉션에 담길 수 있어 값은 배열이고, 순서는 컬렉션 목록 순서를 따른다.
 */
export function invertCollectionSpots<C extends { id: number }, S extends { id: number | string }>(
  groups: { collection: C; spots: S[] }[],
): Map<string, C[]> {
  const bySpot = new Map<string, C[]>();
  for (const { collection, spots } of groups) {
    for (const spot of spots) {
      const key = String(spot.id);
      const list = bySpot.get(key);
      if (list) list.push(collection);
      else bySpot.set(key, [collection]);
    }
  }
  return bySpot;
}

// ponytail: dev 전용 self-check — 중복 소속·빈 컬렉션 회귀 방지 (프로덕션 no-op)
if (__DEV__) {
  const fav = { id: 1 };
  const night = { id: 2 };
  const empty = { id: 3 };
  const inverted = invertCollectionSpots([
    { collection: fav, spots: [{ id: 10 }, { id: 11 }] },
    { collection: night, spots: [{ id: 11 }] },
    { collection: empty, spots: [] },
  ]);
  console.assert(inverted.size === 2, '중복 스팟은 한 키로 합쳐져야 함');
  console.assert(inverted.get('11')?.length === 2, '두 컬렉션에 담긴 스팟은 배지 2개여야 함');
  console.assert(inverted.get('10')?.[0] === fav, '소속 컬렉션 객체가 그대로 유지돼야 함');
  console.assert(!inverted.has('99'), '없는 스팟은 키가 없어야 함');
}

/**
 * TourAPI 이미지가 평문 http로 내려온다(tong.visitkorea.or.kr). iOS는 ATS 예외가 있고 Android도
 * debug 매니페스트는 cleartext를 허용하지만, **release 빌드는 차단돼 이미지만 조용히 안 뜬다.**
 * 해당 호스트가 https로도 200을 주므로 승격해서 쓴다 — 플랫폼 설정을 열어주는 것보다 안전하다.
 */
export function toHttps<T extends string | null | undefined>(url: T): T {
  return (url ? url.replace(/^http:\/\//i, 'https://') : url) as T;
}

/**
 * 목록/인기/검색 공용 `SpotResponse` → 홈 카드 표시 모델.
 * badge(HOT/NEW)는 서버에 대응 값이 없어 미표시 — SpotResponse.badge는 관광공사 인증 여부라 의미가 다르다.
 * isBookmarked는 토큰을 실어 보낸 요청에서만 채워지고, 비로그인/구버전 서버에서는 false로 떨어진다.
 */
export function mapPopularSpot(dto: SpotResponse): SpotItem {
  // 서버는 enum 코드(BEACH, NIGHT_VIEW)를 준다. 한글 라벨은 프론트가 갖는다.
  const labels = (dto.categories ?? [])
    .map((code) => SPOT_CATEGORY_MAP[code]?.label)
    .filter((label): label is string => !!label)
    .slice(0, 2);

  const location = [regionLabelFrom(dto.address ?? ''), labels.join('/')]
    .filter((part): part is string => !!part)
    .join(' · ');

  return {
    id: String(dto.id),
    name: dto.name,
    location,
    category: labels[0] ?? '',
    rating: dto.reviewAverage ?? 0,
    reviewCount: dto.reviewCount ?? 0,
    isBookmarked: dto.isBookmarked ?? false,
    imageUrl: toHttps(dto.thumbnailUrl ?? dto.imageUrl),
  };
}

// 관심 테마 기반 추천 스팟. SpotResponse보다 필드가 적지만(overview·photogenicScore 없음)
// 카드가 쓰는 값은 다 있어서 인기 카드와 같은 모양으로 그린다.
export function mapRecommendedSpot(dto: RecommendedSpotResponse): SpotItem {
  const labels = (dto.categories ?? [])
    .map((code) => SPOT_CATEGORY_MAP[code]?.label)
    .filter((label): label is string => !!label)
    .slice(0, 2);

  const location = [regionLabelFrom(dto.address ?? ''), labels.join('/')]
    .filter((part): part is string => !!part)
    .join(' · ');

  return {
    id: String(dto.id),
    name: dto.name,
    location,
    category: labels[0] ?? '',
    rating: dto.reviewAverage ?? 0,
    reviewCount: dto.reviewCount ?? 0,
    isBookmarked: dto.isBookmarked ?? false,
    imageUrl: toHttps(dto.thumbnailUrl),
  };
}

// ponytail: dev 전용 self-check — 매핑 경계(빈 주소·null 평점) 회귀 방지 (프로덕션 no-op)
if (__DEV__) {
  const base = { id: 7, name: '광안리', latitude: 0, longitude: 0, bookmarkCount: 0, reviewCount: 0 };
  const full = mapPopularSpot({
    ...base,
    address: '부산광역시 수영구 광안해변로',
    categories: ['NIGHT_VIEW', 'BEACH', 'PARK'],
    badge: true,
    imageUrl: 'http://tong.visitkorea.or.kr/o.jpg',
    thumbnailUrl: 'http://tong.visitkorea.or.kr/t.jpg',
    photogenicScore: 87,
    reviewAverage: 4.8,
    isBookmarked: true,
  });
  console.assert(full.id === '7', 'id는 문자열로 변환돼야 함');
  console.assert(full.isBookmarked === true, '서버 isBookmarked를 그대로 반영해야 함');
  console.assert(full.location === '부산 수영구 · 야경/해변', `location 조합 오류: ${full.location}`);
  console.assert(full.category === '야경', 'category는 enum 코드가 아니라 한글 라벨이어야 함');
  console.assert(full.imageUrl === 'https://tong.visitkorea.or.kr/t.jpg', '썸네일 우선 선택 + https 승격 오류');
  console.assert(full.badge === undefined, '서버 badge를 카드 배지로 쓰면 안 됨');

  const bare = mapPopularSpot({
    ...base,
    address: '',
    categories: [],
    badge: false,
    imageUrl: null,
    thumbnailUrl: null,
    photogenicScore: 0,
    reviewAverage: 0,
  });
  console.assert(bare.location === '', '빈 주소·빈 카테고리 → 빈 문자열이어야 함');
  console.assert(bare.rating === 0, '리뷰 없음 → 평점 0 오류');
  console.assert(bare.imageUrl === null, '사진 없음 → null 유지 오류');
  console.assert(bare.isBookmarked === false, 'isBookmarked 누락 → false 폴백 오류');

  const rec = mapRecommendedSpot({
    ...base,
    address: '부산광역시 수영구 광안해변로',
    categories: ['NIGHT_VIEW', 'BEACH'],
    badge: true,
    thumbnailUrl: 'http://tong.visitkorea.or.kr/t.jpg',
    reviewCount: 12,
    reviewAverage: 4.5,
    isBookmarked: true,
  });
  console.assert(rec.rating === 4.5, '추천 카드도 인기 카드와 같은 별점을 써야 함');
  console.assert(rec.reviewCount === 12, '리뷰 수는 그대로 전달돼야 함');
  console.assert(rec.isBookmarked === true, '서버 isBookmarked를 그대로 반영해야 함');
  console.assert(rec.location === '부산 수영구 · 야경/해변', `추천 location 조합 오류: ${rec.location}`);
  console.assert(rec.imageUrl === 'https://tong.visitkorea.or.kr/t.jpg', '추천 썸네일 https 승격 오류');
}

export function mapSpotDetail(dto: SpotDetailResponse): { info: SpotDetailInfo; convenience: ConvenienceInfo } {
  return {
    info: {
      id: String(dto.id),
      badge: dto.badge ? '관광공사 인증' : null,
      imageUrl: toHttps(dto.imageUrl),
      name: dto.name,
      address: dto.address,
      rating: dto.stats.avgRating,
      reviewCount: dto.stats.reviewCount,
      photoCount: dto.stats.photoCount,
      tags: dto.tags,
      categories: dto.categories,
      regionLabel: regionLabelFrom(dto.address),
      heroPhotoCount: dto.stats.photoCount,
      myReviewId: dto.myReviewId,
      latitude: dto.latitude,
      longitude: dto.longitude,
      navigation: dto.navigation,
    },
    convenience: mapConvenience(dto.convenience),
  };
}

// "2026-06-15" / "2026-06-16T10:30:00" → "2026.06.15"
function formatReviewDate(dto: ReviewDTO): string {
  return (dto.visitedAt || dto.createdAt).slice(0, 10).replace(/-/g, '.');
}

export function mapReview(dto: ReviewDTO): Review {
  return {
    id: String(dto.id),
    userId: dto.userId,
    name: dto.nickname,
    avatarInitial: dto.nickname.trim().charAt(0) || '?',
    avatarColor: avatarColorFor(dto.nickname),
    // 서버가 저장 시 정규화하지만 그 이전에 쌓인 행이 남아 있을 수 있다. 빈 문자열은 없는 것으로 처리.
    avatarUrl: toHttps(dto.profileImageUrl) || undefined,
    rating: dto.rating,
    badge: dto.timePeriod ? TIME_PERIOD_LABEL[dto.timePeriod] : undefined,
    timePeriod: dto.timePeriod,
    visitedAtISO: dto.visitedAt,
    date: formatReviewDate(dto),
    text: dto.content,
    // 계약상 항상 [] 이상. ?? []는 어긋났을 때 칩 렌더가 터지지 않게 하는 최소 방어.
    tags: dto.tags ?? [],
    // photos 키 자체가 누락된 응답이 관측돼 옵셔널 체이닝으로 방어한다 (계약상으론 항상 배열)
    photos: dto.photos?.length ? dto.photos : undefined,
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

export function mapMyReview(dto: MyReviewDTO): MyReview {
  return {
    reviewId: dto.reviewId,
    spotId: dto.spotId,
    spotName: dto.spotName,
    rating: dto.rating,
    badge: dto.timePeriod ? TIME_PERIOD_LABEL[dto.timePeriod] : undefined,
    timePeriod: dto.timePeriod,
    visitedAtISO: dto.visitedAt,
    // visitedAt이 없으면 작성일로 대체. 초 뒤 소수점이 붙을 수 있어 앞 10자만 사용한다.
    date: (dto.visitedAt || dto.createdAt).slice(0, 10).replace(/-/g, '.'),
    text: dto.content,
    // 계약상 항상 [] 이상. ?? []는 어긋났을 때 칩 렌더가 터지지 않게 하는 최소 방어.
    tags: dto.tags ?? [],
    photos: dto.photos,
    equipment: dto.equipmentInfo ?? undefined,
  };
}

export function mapMyReviewPages(data: { pages: MyReviewListResponse[] }): MyReview[] {
  return data.pages.flatMap((page) => page.content.map(mapMyReview));
}

/**
 * 무한 스크롤 페이지들을 화면용 단일 구조로 합친다.
 * summary는 페이지마다 동일한 전체 집계라 첫 페이지 것만 쓴다.
 */
export function mapReviewPages(
  data: { pages: ReviewListResponse[] },
): { summary: ReviewSummaryData; reviews: Review[] } {
  return {
    summary: mapReviewSummary(data.pages[0].summary),
    reviews: data.pages.flatMap((page) => page.reviews.content.map(mapReview)),
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

// EXIF 문자열은 metadata-extractor의 영문 description으로 저장돼 있어 표시용으로만 한글화한다.
// 목업(photo-detail.html)에 나오는 값만 담고, 나머지는 원문을 그대로 노출한다 — 빈칸보다 낫다.
const EXIF_LABEL: Record<string, string> = {
  'Auto white balance': '자동',
  'Manual white balance': '수동',
  'Auto exposure': '자동',
  'Manual exposure': '수동',
  'Auto bracket': '자동 브라케팅',
  'Multi-segment': '다분할측광',
  'Center weighted average': '중앙중점',
  Spot: '스팟',
  Average: '평균',
  Partial: '부분',
  'Multi-spot': '멀티스팟',
};

function exifLabel(raw: string | null): string | undefined {
  if (!raw) return undefined;
  // 플래시 description은 발광 모드·리턴광 조합으로 변형이 20가지가 넘는다 → 접두사로만 가른다.
  if (raw.startsWith('Flash did not fire')) return '사용 안 함';
  if (raw.startsWith('Flash fired')) return '사용';
  return EXIF_LABEL[raw] ?? raw;
}

// '24 mm' → '24' (StatCell이 mm 단위를 따로 붙인다)
const stripMm = (raw: string | null): string | undefined => raw?.replace(/\s*mm$/i, '') ?? undefined;
// '1/500 sec' → '1/500s'
const shortSec = (raw: string | null): string | undefined => raw?.replace(/\s*sec$/i, 's') ?? undefined;

function formatFileSize(bytes: number | null): string | undefined {
  if (bytes == null) return undefined;
  if (bytes < 1024) return `${bytes}B`;
  const kb = bytes / 1024;
  return kb < 1024 ? `${Math.round(kb)}KB` : `${(kb / 1024).toFixed(1)}MB`;
}

export function mapPhotoExif(dto: PhotoExifDTO): PhotoExifData {
  return {
    camera: dto.cameraModel ?? undefined,
    lens: dto.lensModel ?? undefined,
    iso: dto.iso ?? undefined,
    aperture: dto.fNumber ?? undefined,
    shutter: shortSec(dto.exposureTime),
    focalLength: stripMm(dto.focalLength),
    exposureMode: exifLabel(dto.exposureMode),
    metering: exifLabel(dto.meteringMode),
    whiteBalance: exifLabel(dto.whiteBalance),
    flash: exifLabel(dto.flash),
    focalLength35mm: dto.focalLength35mm ? `${stripMm(dto.focalLength35mm)}mm` : undefined,
    software: dto.software ?? undefined,
    gpsLat: dto.latitude ?? undefined,
    gpsLng: dto.longitude ?? undefined,
    filename: dto.fileName ?? undefined,
    fileSize: formatFileSize(dto.fileSize),
    format: dto.fileFormat ?? undefined,
    // shotAtLabel·modifiedAtLabel은 채우지 않는다 — DB(ReviewPhoto)엔 takenAt이 있지만
    // 응답 DTO(PhotoExifResponse)에서 빠져 있다. 목업의 '촬영일시'·'해상도'·'색공간' 행도 같은 이유로 공백.
  };
}

/** photoId → EXIF 맵. 라이트박스가 현재 사진의 photoId로 바로 꺼내 쓴다. */
export function mapReviewExif(res: ReviewExifResponse): Record<number, PhotoExifData> {
  const byId: Record<number, PhotoExifData> = {};
  for (const img of res.images) byId[img.imageId] = mapPhotoExif(img);
  return byId;
}

/**
 * 스팟 사진(TourAPI 외부 이미지)용 최소 정보. 서버가 이 사진들의 EXIF를 갖고 있지 않아
 * (`GET /spots/{id}/photos`는 originUrl·thumbnailUrl·imgName뿐, exif 엔드포인트 없음)
 * URL에서 뽑히는 파일명·형식만 채운다. 시트의 나머지 행은 값이 없으면 알아서 접힌다.
 * 서버가 스팟 사진 EXIF를 주기 시작하면 이 함수 대신 mapPhotoExif로 교체할 것.
 */
export function exifFromPhotoUrl(url: string): PhotoExifData {
  // presigned 쿼리스트링이 붙어도 파일명만 남기고, 확장자는 형식 행에 쓴다.
  const filename = url.split('?')[0].split('/').pop() || undefined;
  const ext = filename?.includes('.') ? filename.split('.').pop() : undefined;
  return { filename, format: ext ? ext.toUpperCase() : undefined };
}

/**
 * 시트에 **표시할** 값이 하나라도 있는지. EXIF가 제거된 사진이면 전 필드가 undefined다.
 * `shotAtLabel`은 제외한다 — PhotoExifSheetContent가 그리지 않는 필드라(응답 DTO에 takenAt이
 * 없어 비워둔 자리) 이것만 있는 사진은 빈 시트가 열린다. 시트가 이 값을 그리기 시작하면 뺄 것.
 */
const NOT_RENDERED_IN_SHEET = ['shotAtLabel'];
export function hasAnyExif(exif: PhotoExifData | undefined): boolean {
  return !!exif && Object.entries(exif).some(([k, v]) => v !== undefined && !NOT_RENDERED_IN_SHEET.includes(k));
}

// ponytail: dev 전용 self-check — 분포 percent/시간대 라벨/null 처리 회귀 방지 (프로덕션 no-op)
if (__DEV__) {
  const sum = mapReviewSummary({ avgRating: 4, totalCount: 4, distribution: { '5': 1, '4': 1, '3': 2 } });
  console.assert(sum.distribution.find((d) => d.star === 5)?.percent === 25, 'percent 계산 오류');
  console.assert(mapReviewSummary({ avgRating: 0, totalCount: 0, distribution: {} }).distribution[0].percent === 0, 'div-by-zero 처리 오류');
  const base = { id: 1, userId: 1, nickname: '홍길동', profileImageUrl: null, rating: 5, content: 'x', equipmentInfo: null, tags: [] as ReviewTagApi[], photos: [], visitedAt: '2026-06-15', createdAt: '2026-06-16T10:30:00' };
  console.assert(mapReview({ ...base, timePeriod: 'NIGHT' }).badge === '야간', 'timePeriod 라벨 오류');
  console.assert(mapReview({ ...base, timePeriod: 'DAYTIME' }).badge === '낮', 'timePeriod DAYTIME 라벨 오류');
  console.assert(mapReview({ ...base, timePeriod: null }).badge === undefined, 'timePeriod null 배지 오류');
  console.assert(mapReview({ ...base, timePeriod: null }).date === '2026.06.15', 'date 포맷 오류');
  // 사진이 없을 때 undefined여야 카드가 사진 영역을 그리지 않는다. photoId는 삭제 대상 지정에 쓰여 유실되면 안 된다.
  console.assert(mapReview({ ...base, timePeriod: null }).photos === undefined, '사진 없음 처리 오류');
  // 수정 폼이 선택 상태를 되살리려면 태그가 유실되지 않아야 한다.
  console.assert(mapReview({ ...base, timePeriod: null, tags: ['LIGHTING', 'MOODY'] }).tags.length === 2, '태그 매핑 오류');
  // mapMyReview는 date를 직접 조립한다(mapReview는 formatReviewDate 경유). visitedAt이 없으면
  // 작성일로 대체하고, createdAt에 붙는 소수점 초를 slice로 잘라낸다 — 둘 다 회귀하기 쉬운 자리다.
  const myBase = {
    reviewId: 1, spotId: 7, spotName: '갈산공원', spotImageUrl: null, rating: 4,
    content: 'x', equipmentInfo: null, timePeriod: null, tags: [] as ReviewTagApi[],
    photos: [], visitedAt: null, createdAt: '2026-06-16T10:30:00.123456',
  };
  console.assert(mapMyReview(myBase).date === '2026.06.16', 'visitedAt 없을 때 작성일 폴백 오류');
  console.assert(mapMyReview({ ...myBase, visitedAt: '2026-06-15' }).date === '2026.06.15', 'visitedAt 우선 오류');
  console.assert(
    mapReview({ ...base, timePeriod: null, photos: [{ photoId: 7, url: 'https://x/a.jpg' }] }).photos?.[0].photoId === 7,
    'photoId 매핑 오류',
  );
  // Review.avatarUrl은 optional 계약이라 null이 새어나가면 안 된다(타입만으로는 런타임 값을 못 막음).
  console.assert(mapReview({ ...base, timePeriod: null }).avatarUrl === undefined, 'profileImageUrl null 처리 오류');
  console.assert(mapReview({ ...base, timePeriod: null, profileImageUrl: '' }).avatarUrl === undefined, '빈 문자열 처리 오류');
  console.assert(mapReview({ ...base, timePeriod: null, profileImageUrl: 'http://x/a.jpg' }).avatarUrl === 'https://x/a.jpg', 'http → https 승격 오류');
  // photos 키 자체가 빠진 응답이 관측돼 방어를 넣었다 — 빠지면 리뷰 탭 전체가 죽는다.
  const noPhotosKey = { ...base, timePeriod: null } as Partial<ReviewDTO>;
  delete noPhotosKey.photos;
  console.assert(mapReview(noPhotosKey as ReviewDTO).photos === undefined, 'photos 키 누락 시 방어 실패');

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

// ponytail: dev 전용 self-check — EXIF 단위 정리/한글화/빈 EXIF 판정 회귀 방지 (프로덕션 no-op)
if (__DEV__) {
  const empty: PhotoExifDTO = {
    imageId: 1, cameraModel: null, lensModel: null, iso: null, fNumber: null, exposureTime: null,
    focalLength: null, exposureMode: null, meteringMode: null, whiteBalance: null, flash: null,
    focalLength35mm: null, software: null, latitude: null, longitude: null, fileSize: null,
    fileFormat: null, fileName: null,
  };
  const full = mapPhotoExif({
    ...empty, imageId: 2, cameraModel: 'ILCE-7M4', iso: 100, fNumber: 'f/2.8',
    exposureTime: '1/500 sec', focalLength: '24 mm', focalLength35mm: '24 mm',
    meteringMode: 'Multi-segment', whiteBalance: 'Auto white balance', flash: 'Flash did not fire',
    exposureMode: 'Manual exposure', fileSize: 8_808_038, fileFormat: 'JPEG',
  });
  console.assert(full.focalLength === '24', 'focalLength에서 mm를 떼야 StatCell 단위와 겹치지 않는다');
  console.assert(full.focalLength35mm === '24mm', '35mm 환산은 DetailRow라 단위를 붙여야 한다');
  console.assert(full.shutter === '1/500s', "'1/500 sec' → '1/500s' 변환 오류");
  console.assert(full.metering === '다분할측광' && full.flash === '사용 안 함' && full.exposureMode === '수동', 'EXIF 한글화 오류');
  console.assert(full.fileSize === '8.4MB', `fileSize 포맷 오류: ${full.fileSize}`);
  console.assert(hasAnyExif(full) && !hasAnyExif(mapPhotoExif(empty)), 'EXIF 없음 판정 오류 (전 필드 null이면 false여야 함)');
  // 시트가 그리지 않는 필드만 있으면 빈 시트가 열린다 — '정보 없음'으로 떨어져야 한다.
  console.assert(!hasAnyExif({ shotAtLabel: '2026.08.18' }), 'shotAtLabel만 있으면 EXIF 없음이어야 한다');
  console.assert(mapReviewExif({ reviewId: 9, images: [empty] })[1] !== undefined, 'mapReviewExif가 photoId로 키를 잡아야 한다');
  const fromUrl = exifFromPhotoUrl('http://tong.visitkorea.or.kr/cms/resource/31/3352031_image2_1.jpg?w=1');
  console.assert(fromUrl.filename === '3352031_image2_1.jpg', 'URL 파일명 추출 오류 (쿼리스트링 제거 포함)');
  console.assert(fromUrl.format === 'JPG', 'URL 확장자 → 형식 변환 오류');
  console.assert(exifFromPhotoUrl('https://x/photo').format === undefined, '확장자가 없으면 형식 행이 비어야 한다');
}
