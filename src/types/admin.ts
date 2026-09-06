// 1. 회원 및 권한 관리 모델
export interface AdminUser {
  id: number;
  email: string;
  nickname: string;
  profileImageUrl: string | null;
  role: 'USER' | 'ADMIN';
  provider: 'LOCAL' | 'KAKAO';
  createdAt: string;
}

export interface AdminUserPageResponse {
  content: AdminUser[];
  pageable: {
    pageNumber: number;
    pageSize: number;
  };
  totalElements: number;
  totalPages: number;
  last: boolean;
  first: boolean;
}

export interface AdminUserFilterParams {
  keyword?: string;
  role?: 'USER' | 'ADMIN';
  page?: number;
  size?: number;
}

export interface RoleUpdateRequest {
  role: 'USER' | 'ADMIN';
}

// 2. AI 의미 검색 임베딩 관리 모델
export interface EmbeddingStatusResponse {
  total: number;
  withEmbedding: number;
  missing: number;
  totalSpots: number;
  embeddedSpots: number;
  missingSpots: number;
  coveragePercentage: number;
}

export interface EmbeddingBackfillResponse {
  saved: number;
  failed: number;
  processedCount?: number;
  successCount?: number;
  failureCount?: number;
}

export interface EmbeddingSingleResponse {
  spotId: number;
  saved: boolean;
  spotName?: string;
  success?: boolean;
  message?: string;
}

// 3. 한국관광공사 TourAPI 동기화 모델
export interface TourSyncResponse {
  areaCode?: number;
  areaName?: string;
  syncedCount?: number;
  createdCount?: number;
  updatedCount?: number;
  message?: string;
}

export interface TourSyncAllResponse {
  totalSyncedCount?: number;
  totalCreatedCount?: number;
  totalUpdatedCount?: number;
  message?: string;
  results?: TourSyncResponse[];
}

export interface AreaCodeItem {
  code: number;
  name: string;
}

export const AREA_CODES: AreaCodeItem[] = [
  { code: 1, name: '서울' },
  { code: 2, name: '인천' },
  { code: 3, name: '대전' },
  { code: 4, name: '대구' },
  { code: 5, name: '광주' },
  { code: 6, name: '부산' },
  { code: 7, name: '울산' },
  { code: 8, name: '세종' },
  { code: 31, name: '경기' },
  { code: 32, name: '강원' },
  { code: 33, name: '충북' },
  { code: 34, name: '충남' },
  { code: 35, name: '경북' },
  { code: 36, name: '경남' },
  { code: 37, name: '전북' },
  { code: 38, name: '전남' },
  { code: 39, name: '제주' },
];

export interface TourSyncStatusResponse {
  isRunning: boolean;
  currentJob?: string | null;
  areaCode?: number | null;
  totalCount?: number;
  processedCount?: number;
  progressPercent?: number;
  statusMessage?: string | null;
  startedAt?: string | null;
  lastCompletedAt?: string | null;
  lastError?: string | null;
}

// 4. 공통 페이징 응답 모델
export interface AdminPageResponse<T> {
  content: T[];
  pageable: {
    pageNumber: number;
    pageSize: number;
  };
  totalElements: number;
  totalPages: number;
  last: boolean;
  first: boolean;
}

// 5. 콘테스트 운영 관리 모델 (/admin/contests)
export type ContestPhase = 'UPCOMING' | 'SUBMITTING' | 'VOTING' | 'RESULT' | 'ENDED';

export const CONTEST_PHASE_LABELS: Record<ContestPhase, string> = {
  UPCOMING: '개설 대기',
  SUBMITTING: '출품 진행중',
  VOTING: '투표 진행중',
  RESULT: '결과 발표',
  ENDED: '종료',
};

export type ContestReportReason = 'SPAM' | 'ABUSE' | 'COPYRIGHT' | 'INAPPROPRIATE' | 'ETC';

export const CONTEST_REPORT_REASON_LABELS: Record<ContestReportReason, string> = {
  SPAM: '스팸/홍보',
  ABUSE: '욕설/비방',
  COPYRIGHT: '저작권 침해',
  INAPPROPRIATE: '부적절한 사진',
  ETC: '기타 사유',
};

export interface ContestCreateRequest {
  title: string;
  description?: string;
  themeImageUrl?: string;
  submitStartAt?: string;
  maxEntriesPerUser?: number;
  voteLimit?: number;
}

export interface AdminContestSummaryResponse {
  contestId: number;
  title: string;
  description: string | null;
  themeImageUrl: string | null;
  phase: ContestPhase;
  submitStartAt: string;
  submitEndAt: string;
  voteStartAt: string;
  voteEndAt: string;
  resultOpenAt: string;
  maxEntriesPerUser: number;
  voteLimit: number;
  active: boolean;
  startNotificationSent: boolean;
  resultNotificationSent: boolean;
  totalEntries: number;
  totalVotes: number;
  createdAt: string;
}

export interface AdminContestDetailResponse {
  contestId: number;
  title: string;
  description: string | null;
  themeImageUrl: string | null;
  phase: ContestPhase;
  submitStartAt: string;
  submitEndAt: string;
  voteStartAt: string;
  voteEndAt: string;
  resultOpenAt: string;
  maxEntriesPerUser: number;
  voteLimit: number;
  active: boolean;
  startNotificationSent: boolean;
  resultNotificationSent: boolean;
  subscriberCount: number;
  totalEntries: number;
  participantCount: number;
  totalVotes: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdminContestEntryResponse {
  entryId: number;
  contestId: number;
  userId: number;
  userNickname: string;
  userProfileImageUrl: string | null;
  spotId: number | null;
  spotName: string | null;
  photoUrl: string;
  caption: string | null;
  voteCount: number;
  reportCount: number;
  createdAt: string;
}

export interface AdminContestReportResponse {
  reportId: number;
  entryId: number;
  entryPhotoUrl: string;
  entryCaption: string | null;
  entryAuthorId: number;
  entryAuthorNickname: string;
  reporterId: number;
  reporterNickname: string;
  reason: ContestReportReason;
  content: string | null;
  createdAt: string;
}

