// 콘테스트 API (순수 fetch). 매핑은 utils/contestMappers.ts, 캐싱은 hooks/useContest.ts에서 처리한다.
// 백엔드: PNG_backend `contest` 모듈(ContestController).
//
// 모든 엔드포인트가 인증을 요구한다 — voted·mine·subscribed·myRank가 전부 내 기준 값이라
// 서버가 @AuthenticationPrincipal 없이는 응답을 만들 수 없다. token은 선택 인자가 아니다.
import { appendFilePart, appendJsonPart, request, upload } from '@/api/http';
import type { FileUpload } from '@/api/http';
import type {
  ContestCreateEntryRequestDTO,
  ContestEntryDTO,
  ContestEntryDetailDTO,
  ContestEntryPageDTO,
  ContestMyEntryDTO,
  ContestMyHistoryDTO,
  ContestMyVoteDTO,
  ContestPastPageDTO,
  ContestRankingHistoryDTO,
  ContestReportRequestDTO,
  ContestResponseDTO,
  ContestResultDTO,
  ContestSortApi,
  ContestSubscriptionDTO,
  ContestVoteResultDTO,
} from '@/types/contest';

type Id = string | number;

export const contestApi = {
  // 1. 현재 진행 중인 회차. 없으면 404(CURRENT_CONTEST_NOT_FOUND)다 — 훅에서 빈 상태로 다룬다.
  getCurrent: (token: string) => request<ContestResponseDTO>('/contests/current', { token }),

  /**
   * 2. 다음 예정 회차. 예정이 없으면 **204라서 undefined가 온다**(404가 아니다).
   *    진행 중 회차가 없을 때 예고·알림 신청 화면을 그릴지, "예고 없음"으로 갈지를 이 값으로 가른다.
   */
  getUpcoming: (token: string) =>
    request<ContestResponseDTO | undefined>('/contests/upcoming', { token }),

  getContest: (contestId: Id, token: string) =>
    request<ContestResponseDTO>(`/contests/${contestId}`, { token }),

  // 3. 지난 회차 목록. 결과 발표(resultOpenAt)가 지난 것만, 발표 시각 내림차순.
  //    [0]이 곧 직전 수상 회차라서 진행중 탭 상단 배너도 이 목록에서 가져간다.
  getPastContests: (token: string, page = 0, size = 20) =>
    request<ContestPastPageDTO>(`/contests?page=${page}&size=${size}`, { token }),

  // 4. 출품작 목록. sort=votes도 서버가 정렬만 해주고 득표수는 발표 전까지 null이다.
  getEntries: (
    contestId: Id,
    token: string,
    { sort = 'latest', page = 0, size = 20 }: { sort?: ContestSortApi; page?: number; size?: number } = {},
  ) =>
    request<ContestEntryPageDTO>(
      `/contests/${contestId}/entries?sort=${sort}&page=${page}&size=${size}`,
      { token },
    ),

  getEntry: (contestId: Id, entryId: Id, token: string) =>
    request<ContestEntryDetailDTO>(`/contests/${contestId}/entries/${entryId}`, { token }),

  /**
   * 5. 출품 (multipart). 사진 1장당 한 번 호출한다 — 서버가 `photo` 파트 하나만 받는다.
   *    여러 장을 고른 출품 화면은 장별로 순차 호출하고, 중간에 실패하면 거기까지만 등록된 상태가 된다.
   */
  createEntry: (contestId: Id, body: ContestCreateEntryRequestDTO, photo: FileUpload, token: string) => {
    const form = new FormData();
    appendJsonPart(form, 'request', body);
    appendFilePart(form, 'photo', photo);
    return upload<ContestEntryDTO>(`/contests/${contestId}/entries`, 'POST', form, token);
  },

  deleteEntry: (contestId: Id, entryId: Id, token: string) =>
    request<void>(`/contests/${contestId}/entries/${entryId}`, { method: 'DELETE', token }),

  // 6. 투표 / 취소. 둘 다 남은 표 수를 최신값으로 돌려주므로 낙관적 갱신 후 이 값으로 덮는다.
  vote: (contestId: Id, entryId: Id, token: string) =>
    request<ContestVoteResultDTO>(`/contests/${contestId}/entries/${entryId}/vote`, { method: 'POST', token }),
  cancelVote: (contestId: Id, entryId: Id, token: string) =>
    request<ContestVoteResultDTO>(`/contests/${contestId}/entries/${entryId}/vote`, { method: 'DELETE', token }),

  // 7. 내 출품 현황 / 내가 투표한 작품 / 내 참여 기록
  getMyEntry: (contestId: Id, token: string) =>
    request<ContestMyEntryDTO>(`/contests/${contestId}/my-entry`, { token }),
  getMyVotes: (contestId: Id, token: string) =>
    request<ContestMyVoteDTO>(`/contests/${contestId}/my-votes`, { token }),
  getMyHistory: (token: string) => request<ContestMyHistoryDTO>('/contests/my-history', { token }),

  // 8. 순위 변동 스냅샷. 투표 기간부터 열리고 상위 3개만 담긴다.
  //    출품 기간에 부르면 409(RESULT_NOT_OPENED)다.
  getRankingHistory: (contestId: Id, token: string) =>
    request<ContestRankingHistoryDTO>(`/contests/${contestId}/ranking-history`, { token }),

  // 9. 결과. 발표(resultOpenAt) 전에 부르면 409(RESULT_NOT_OPENED)다.
  getResult: (contestId: Id, token: string) =>
    request<ContestResultDTO>(`/contests/${contestId}/result`, { token }),

  // 10. 다음 회차 알림 신청 / 해제. 양쪽 다 멱등하므로 연타해도 409가 나지 않는다.
  subscribe: (contestId: Id, token: string) =>
    request<ContestSubscriptionDTO>(`/contests/${contestId}/subscribe`, { method: 'POST', token }),
  unsubscribe: (contestId: Id, token: string) =>
    request<ContestSubscriptionDTO>(`/contests/${contestId}/subscribe`, { method: 'DELETE', token }),

  // 11. 신고. 경로가 /contests/ 밑이 아니라 /contest-entries/{entryId}/report다.
  //     같은 작품을 두 번 신고하면 409(ALREADY_REPORTED).
  reportEntry: (entryId: Id, body: ContestReportRequestDTO, token: string) =>
    request<void>(`/contest-entries/${entryId}/report`, { method: 'POST', body, token }),
};
