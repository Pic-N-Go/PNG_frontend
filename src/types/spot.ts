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
  badge: string;
  name: string;
  address: string;
  rating: number;
  reviewCount: number;
  photoCount: number;
  tags: string[];
  heroPhotoCount: number;
}

export type PhotogenicFactorKey = 'weather' | 'goldenHour' | 'dust' | 'season';

export interface PhotogenicFactor {
  key: PhotogenicFactorKey;
  label: string;
  value: string;
  score: number;
  valueColor: string;
  iconBg: string;
  iconColor: string;
  barColor: string;
  barPercent: number;
  wide?: boolean;
}

export interface PhotogenicScoreData {
  score: number;
  maxScore: number;
  grade: string;
  goldenHourMinutesLeft: number;
  goldenHourTime: string;
  factors: PhotogenicFactor[];
}

export interface TransportInfoItem {
  icon: 'parking' | 'car';
  main: string;
  sub: string;
}

export interface ConvenienceInfoCell {
  label: string;
  value: string;
  variant: 'green' | 'orange' | 'default';
}

export interface ConvenienceInfo {
  transport: TransportInfoItem[];
  cells: ConvenienceInfoCell[];
}

export interface ChecklistOption {
  id: string;
  label: string;
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
  badge: string;
  date: string;
  text: string;
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

export interface BookmarkCollection {
  id: string;
  name: string;
  count: number;
  iconBg: string;
  iconColor: string;
}
