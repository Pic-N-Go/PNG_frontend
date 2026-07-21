export type SpotBadge = 'HOT' | 'NEW';

export interface SpotItem {
  id: string;
  name: string;
  location: string;
  category: string;
  rating: number;
  photoScore: number;
  badge?: SpotBadge;
  isBookmarked: boolean;
  gradientColors: [string, string, string];
}

export interface CalendarEvent {
  id: string;
  dateRange: string;
  eventName: string;
  place: string;
  tip: string;
  photoScore: number;
  tag: string;
  headerColor: string;
}

export interface CategoryItem {
  id: string;
  label: string;
}

// ── 스팟 상세 화면 ──────────────────────────────

export interface SpotDetailInfo {
  id: string;
  badge: string | null;
  name: string;
  address: string;
  rating: number;
  reviewCount: number;
  photoCount: number;
  tags: string[];
  heroPhotoCount: number;
}

export type PhotogenicFactorKey = 'weather' | 'goldenHour' | 'dust' | 'ozone' | 'season';

export interface PhotogenicFactor {
  key: PhotogenicFactorKey;
  label: string;
  value: string;
  score: number;
  valueColor: string;
  iconBg: string;
  iconColor: string;
  barPercent: number;
}

export interface PhotogenicGoldenHour {
  /** 원본 label (예: 골든아워 / 해당 없음 / 데이터 없음) */
  label: string;
  /** 다음 골든아워까지 남은 분. 진행 중이거나 오늘 종료면 null */
  minutesUntilStart: number | null;
  /** 현재/다음 골든아워 시작 시각 HH:mm. 오늘 더 없으면 null */
  startTime: string | null;
  /** minutesUntilStart=null & score=5 → 현재 진행 중 */
  isActive: boolean;
}

export interface PhotogenicScoreData {
  score: number;
  maxScore: number;
  grade: string;
  goldenHour: PhotogenicGoldenHour;
  factors: PhotogenicFactor[];
}

export type FacilityKey = 'parking' | 'wheel' | 'stroller' | 'pet' | 'subway' | 'holiday';
// good: 가능/있음(초록), neutral: 값 있음(없음 등), missing: 미제공(회색), accent: 강조(휴무일 핑크)
export type FacilityStatus = 'good' | 'neutral' | 'missing' | 'accent';

export interface FacilityChipData {
  key: FacilityKey;
  label: string;
  value: string;
  status: FacilityStatus;
}

// 이용시간 파싱 결과 — 이름-시간 행 / 값만 있는 행(범위 등) / 안내(note)
export type ScheduleRow = { name: string; time: string } | { value: string } | { note: string };
export interface ScheduleGroup {
  title: string;
  rows: ScheduleRow[];
}

export interface ConvenienceInfo {
  facilities: FacilityChipData[];
  /** 이용시간 파싱 성공 시 구조화 데이터, 실패 시 null */
  schedule: ScheduleGroup[] | null;
  /** 파싱 실패 시 원문(폴백). schedule·scheduleText 둘 다 null이면 미제공 */
  scheduleText: string | null;
  /** 문의 전화(infocenter 원문). null이면 미제공 */
  phone: string | null;
}

export interface ReviewStarDistribution {
  star: number;
  percent: number;
}

export interface ReviewSummaryData {
  score: number;
  reviewCount: number;
  distribution: ReviewStarDistribution[];
}

export type ReviewSortOption = '최신순' | '별점 높은순' | '별점 낮은순';

export interface Review {
  id: string;
  name: string;
  avatarInitial: string;
  avatarColor: string;
  rating: number;
  /** 촬영 시간대 라벨(일출/낮/일몰/야간). timeSlot이 null이면 undefined → 배지 미표시 */
  badge?: string;
  date: string;
  text: string;
  /** 리뷰 사진 URL 목록 (API 연동). 없으면 photoColors 플레이스홀더 사용 */
  photos?: string[];
  photoColors?: string[];
  equipment?: string;
}

export type ChatEntryType = 'message' | 'system' | 'date';

export interface ChatEntry {
  id: string;
  type: ChatEntryType;
  isMe?: boolean;
  senderName?: string;
  avatarInitial?: string;
  avatarColor?: string;
  text?: string;
  time?: string;
  isImage?: boolean;
}

export interface TravelPlanOption {
  id: string;
  name: string;
  meta: string;
  days: string[] | null;
  thumbGradient: [string, string];
}

export type NaviAppId = 'kakao' | 'naver' | 'apple';

// 북마크 컬렉션 (GET /bookmark-collections?spotId=). color/icon은 문자열 키.
export interface BookmarkCollectionDTO {
  id: number;
  name: string;
  color: string;
  icon: string;
  spotCount: number;
  /** 이 스팟이 해당 컬렉션에 이미 속해있는지 */
  contains: boolean;
}

// ── API DTO (서버 응답 원형) ──────────────────────
// 스펙: docs/ai/specs/feature/spot-detail-screen/spot-detail-api.md

export type ReviewTimeSlot = 'SUNRISE' | 'DAY' | 'SUNSET' | 'NIGHT';
export type ReviewSortApi = 'LATEST' | 'RATING_HIGH' | 'RATING_LOW';

// 실데이터상 각 필드는 null·빈문자열·HTML(usetime)이 섞여 옴 → 전부 nullable
export interface ConvenienceDTO {
  parking: string | null;
  wheelchairAccess: string | null;
  strollerAccess: string | null;
  petFriendly: string | null;
  subwayAccess: string | null;
  usetime: string | null;
  restdate: string | null;
  infocenter: string | null;
}

export interface SpotDetailResponse {
  id: number;
  name: string;
  address: string;
  badge: boolean;
  imageUrl: string | null;
  latitude: number;
  longitude: number;
  category: string;
  overview: string;
  tags: string[];
  convenience: ConvenienceDTO;
  stats: { avgRating: number; reviewCount: number; photoCount: number };
  checklist: string[];
  isBookmarked: boolean;
}

export interface ReviewDTO {
  id: number;
  userId: number;
  nickname: string;
  rating: number;
  timeSlot: ReviewTimeSlot | null;
  content: string;
  equipmentInfo: string | null;
  photos: string[];
  visitedAt: string | null;
  createdAt: string;
}

export interface ReviewListResponse {
  summary: {
    avgRating: number;
    totalCount: number;
    distribution: Record<string, number>; // "1"~"5" → 개수
  };
  reviews: {
    content: ReviewDTO[];
    totalElements: number;
    totalPages: number;
    number: number;
  };
}

/** 기본 항목은 defaultItemId로 숨김(hide), 사용자 항목은 id로 삭제 */
export interface ChecklistDefaultItemDTO {
  defaultItemId: number;
  content: string;
}

export interface ChecklistUserItemDTO {
  id: number;
  content: string;
}

export interface ChecklistResponse {
  defaultItems: ChecklistDefaultItemDTO[];
  userItems: ChecklistUserItemDTO[];
}

export interface PhotogenicFactorDTO {
  label: string;
  score: number;
}

export interface PhotogenicGoldenHourDTO extends PhotogenicFactorDTO {
  minutesUntilStart: number | null;
  startTime: string | null;
}

export interface PhotogenicScoreResponse {
  score: number;
  grade: string;
  weather: PhotogenicFactorDTO;
  fineDust: PhotogenicFactorDTO;
  ozone: PhotogenicFactorDTO;
  season: PhotogenicFactorDTO;
  goldenHour: PhotogenicGoldenHourDTO;
}

export interface PageSpotResponse {
  content: any[];
  totalElements: number;
  totalPages: number;
  number: number;
}
