// 콘테스트 서버 DTO. 백엔드 PNG_backend `contest` 모듈(ContestController)의 응답 그대로다.
//
// 화면 뷰모델(ContestInfo·ContestEntry·RankHistory 등)은 types/community.ts에 남아 있다.
// 두 벌을 한 파일에 두면 어느 쪽이 서버 계약인지 흐려져서 DTO만 여기로 뺐다.
//
// LocalDateTime은 오프셋 없이 `2026-08-17T12:34:56`으로 온다 — utils/communityMappers.ts의
// formatDate·formatRelativeTime이 쓰는 전제와 같다.
import type { ContestPhase } from '@/types/community';

/** 정렬은 서버가 latest / votes 두 가지만 받는다 (ContestService.resolveEntrySort) */
export type ContestSortApi = 'latest' | 'votes';

// phase는 types/community.ts의 ContestPhase를 그대로 쓴다 — UPCOMING(출품 시작 전) 포함

export interface ContestResponseDTO {
  contestId: number;
  /** 테마명. 화면의 "골든아워"에 해당한다 */
  title: string;
  description: string | null;
  themeImageUrl: string | null;
  phase: ContestPhase;
  submitStartAt: string;
  submitEndAt: string;
  /** 항상 submitEndAt과 같다 (Contest.create가 붙여서 만든다) */
  voteStartAt: string;
  voteEndAt: string;
  /** 결과 발표 = 투표 종료 다음 날 09:00. 집계 중 화면의 "언제 발표" 문구가 이 값이다 */
  resultOpenAt: string;
  entryCount: number;
  participantCount: number;
  maxEntriesPerUser: number;
  myEntryCount: number;
  remainingEntryCount: number;
  voteLimit: number;
  usedVoteCount: number;
  remainingVoteCount: number;
  /** 다음 회차 알림 신청 여부 */
  subscribed: boolean;
}

/**
 * 출품작 하나.
 *
 * voteCount·rank는 결과 발표(ENDED) 후에만 값이 있고 그전에는 둘 다 null이다.
 * 투표 기간에 서열이 드러나는 창구는 순위 변동 스냅샷(상위 3개)뿐이라
 * 목록·상세에서는 내 작품도 가려진다. 0으로 대체하지 말 것 — "0표"와 "비공개"는 다르다.
 */
export interface ContestEntryDTO {
  entryId: number;
  photoUrl: string;
  authorId: number;
  authorNickname: string;
  caption: string | null;
  spotId: number | null;
  spotName: string | null;
  voteCount: number | null;
  rank: number | null;
  voted: boolean;
  mine: boolean;
  /** EXIF 촬영 시각. EXIF가 없는 사진이면 null */
  shotAt: string | null;
  createdAt: string;
}

export interface ContestEntryDetailDTO extends ContestEntryDTO {
  phase: ContestPhase;
  canVote: boolean;
  canDelete: boolean;
  voteLimit: number;
  remainingVoteCount: number;
}

export interface ContestEntryPageDTO {
  entries: ContestEntryDTO[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

export interface ContestPastDTO {
  contestId: number;
  title: string;
  themeImageUrl: string | null;
  submitStartAt: string;
  /** 발표 후 한 달만 "지난 회차 수상" 배너를 띄우는 판단에 쓴다 */
  resultOpenAt: string;
  entryCount: number;
  participantCount: number;
  totalVoteCount: number;
  /** 미출품이면 null */
  myRank: number | null;
  winnerNickname: string | null;
  /** 목록 카드 썸네일 */
  winnerPhotoUrl: string | null;
}

export interface ContestPastPageDTO {
  contests: ContestPastDTO[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

export interface ContestMyEntryDTO {
  contestId: number;
  title: string;
  phase: ContestPhase;
  myEntryCount: number;
  maxEntriesPerUser: number;
  remainingEntryCount: number;
  entries: ContestEntryDTO[];
}

export interface ContestVotedEntryDTO {
  entryId: number;
  photoUrl: string;
  authorNickname: string;
  spotName: string | null;
  votedAt: string;
}

export interface ContestMyVoteDTO {
  contestId: number;
  voteLimit: number;
  usedVoteCount: number;
  remainingVoteCount: number;
  votedEntries: ContestVotedEntryDTO[];
}

export interface ContestHistoryItemDTO {
  contestId: number;
  title: string;
  submitStartAt: string;
  thumbnailUrl: string;
  /** 집계 전이면 null — 화면은 순위 자리에 "집계 중"을 띄운다 */
  myRank: number | null;
  voteCount: number | null;
  status: 'PENDING' | 'RANKED';
}

export interface ContestMyHistoryDTO {
  totalEntryCount: number;
  bestRank: number | null;
  totalVoteCount: number;
  items: ContestHistoryItemDTO[];
}

export interface ContestRankingDTO {
  rank: number;
  entryId: number;
  /** 출품 사진 — 1~3위 목록의 사각 썸네일에 쓴다 */
  photoUrl: string;
  authorNickname: string;
  /** 출품자 프로필 사진 — 순위 그래프의 원형 썸네일에 쓴다. 없으면 null */
  authorProfileImageUrl: string | null;
  spotName: string | null;
  voteCount: number;
}

export interface ContestSnapshotDTO {
  /** `2026-08-21` (날짜만) */
  snapshotDate: string;
  completed: boolean;
  /** 매일 자정 집계, 상위 3개까지만 */
  rankings: ContestRankingDTO[];
}

export interface ContestRankingHistoryDTO {
  contestId: number;
  phase: ContestPhase;
  snapshots: ContestSnapshotDTO[];
}

export interface ContestResultEntryDTO {
  rank: number;
  entryId: number;
  /** 출품 사진 — 수상 카드·순위표의 큰 사진 자리 */
  photoUrl: string;
  /** 아바타 폴백 색을 고르는 씨앗. 같은 사람이 어느 화면에서든 같은 색이어야 한다 */
  authorId: number;
  authorNickname: string;
  /** 출품자 프로필 사진 — 순위 목록의 원형 아바타. 없으면 null */
  authorProfileImageUrl: string | null;
  caption: string | null;
  spotId: number | null;
  spotName: string | null;
  voteCount: number;
}

export interface ContestResultDTO {
  contestId: number;
  title: string;
  submitStartAt: string;
  voteEndAt: string;
  entryCount: number;
  participantCount: number;
  totalVoteCount: number;
  winner: ContestResultEntryDTO | null;
  /** 내가 출품하지 않았으면 null */
  myResult: ContestResultEntryDTO | null;
  /** 상위 5개까지 */
  rankings: ContestResultEntryDTO[];
}

export interface ContestVoteResultDTO {
  entryId: number;
  voted: boolean;
  voteLimit: number;
  usedVoteCount: number;
  remainingVoteCount: number;
}

export interface ContestSubscriptionDTO {
  contestId: number;
  subscribed: boolean;
}

export interface ContestCreateEntryRequestDTO {
  /** 최대 80자 */
  caption?: string;
  /** 스팟을 검색해 고른 경우에만. 직접 입력이면 spotName만 보낸다 */
  spotId?: number;
  /** 최대 100자. spotId가 있으면 서버가 스팟 이름으로 덮어쓴다 */
  spotName?: string;
  /**
   * 원본 사진에서 읽은 촬영 시각(`2026-08-23T05:32:00`).
   *
   * 이미지 피커가 업로드 전에 재인코딩하면서 EXIF를 떨어뜨려서, 서버가 받은 바이트에서
   * 다시 뽑으려 해도 대부분 비어 있다. 원본을 손에 쥔 이쪽에서 읽어 보낸다.
   */
  shotAt?: string;
}

export type ContestReportReason = 'SPAM' | 'ABUSE' | 'COPYRIGHT' | 'INAPPROPRIATE' | 'ETC';

export interface ContestReportRequestDTO {
  reason: ContestReportReason;
  /** 최대 500자 */
  content?: string;
}
