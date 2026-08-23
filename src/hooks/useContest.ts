// 콘테스트 서버 상태 훅 (TanStack Query). 매핑은 utils/contestMappers.ts에 맡기고
// 여기서는 캐시 키·"없음" 판정·무효화만 다룬다.
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiError, isErrorCode } from '@/api/auth';
import { contestApi } from '@/api/contest';
import type { FileUpload } from '@/api/http';
import { useAuthStore } from '@/store/useAuthStore';
import type { InfiniteData } from '@tanstack/react-query';
import type {
  ContestCreateEntryRequestDTO,
  ContestEntryDTO,
  ContestEntryPageDTO,
  ContestResponseDTO,
  ContestSortApi,
} from '@/types/contest';

/** 진행중 탭 미리보기는 8개까지만 그린다(전체 목록은 별도 화면) — 첫 페이지면 충분하다 */
const ENTRY_PREVIEW_SIZE = 20;
/** 지난 탭은 "더보기"가 없어 첫 페이지가 곧 전부다 */
const PAST_PAGE_SIZE = 20;
/** 전체 출품작 화면. 2열 격자라 짝수여야 마지막 줄이 비지 않는다 */
const ENTRY_PAGE_SIZE = 24;

const key = {
  current: (token: string | null) => ['contest', 'current', token ?? 'guest'] as const,
  detail: (contestId: string, token: string | null) => ['contest', 'detail', contestId, token ?? 'guest'] as const,
  upcoming: (token: string | null) => ['contest', 'upcoming', token ?? 'guest'] as const,
  entries: (contestId: string, sort: ContestSortApi, token: string | null) =>
    ['contest', 'entries', contestId, sort, token ?? 'guest'] as const,
  entryPages: (contestId: string, sort: ContestSortApi, token: string | null) =>
    ['contest', 'entry-pages', contestId, sort, token ?? 'guest'] as const,
  myEntry: (contestId: string, token: string | null) => ['contest', 'my-entry', contestId, token ?? 'guest'] as const,
  past: (token: string | null) => ['contest', 'past', token ?? 'guest'] as const,
  ranking: (contestId: string) => ['contest', 'ranking', contestId] as const,
  myVotes: (contestId: string, token: string | null) => ['contest', 'my-votes', contestId, token ?? 'guest'] as const,
  result: (contestId: string, token: string | null) => ['contest', 'result', contestId, token ?? 'guest'] as const,
};

function useToken() {
  return useAuthStore((s) => s.accessToken);
}

/** 콘테스트 자체가 없는 것과 조회 실패는 다르다 — 앞은 정상 상태, 뒤는 에러 카드다 */
function isNotFound(err: unknown, code: string): boolean {
  return isErrorCode(err, code) || (err instanceof ApiError && err.status === 404);
}

/**
 * 진행 중 회차. 없으면 null이다.
 *
 * 서버는 404(CURRENT_CONTEST_NOT_FOUND)로 답하는데, 그건 오류가 아니라 "이번 회차가 아직
 * 안 열렸다"는 정상 상태다. 여기서 null로 바꿔주지 않으면 화면이 에러로 떨어진다.
 */
export function useCurrentContest() {
  const token = useToken();
  return useQuery({
    queryKey: key.current(token),
    enabled: !!token,
    queryFn: async (): Promise<ContestResponseDTO | null> => {
      try {
        return await contestApi.getCurrent(token!);
      } catch (err) {
        if (isNotFound(err, 'CURRENT_CONTEST_NOT_FOUND')) return null;
        throw err;
      }
    },
  });
}

/** 다음 예정 회차. 서버가 204를 주므로 본문이 없으면 undefined가 온다 → null로 정규화 */
export function useUpcomingContest() {
  const token = useToken();
  return useQuery({
    queryKey: key.upcoming(token),
    enabled: !!token,
    queryFn: async (): Promise<ContestResponseDTO | null> => (await contestApi.getUpcoming(token!)) ?? null,
  });
}

export function useContestEntries(contestId: string | null, sort: ContestSortApi) {
  const token = useToken();
  return useQuery({
    queryKey: key.entries(contestId ?? '', sort, token),
    enabled: !!token && !!contestId,
    queryFn: () => contestApi.getEntries(contestId!, token!, { sort, page: 0, size: ENTRY_PREVIEW_SIZE }),
  });
}

/**
 * 특정 회차. 전체 출품작 화면이 쓴다 — 진행 중 회차일 수도 있고 이미 끝난 회차일 수도 있어서
 * useCurrentContest로는 안 된다. 남은 표·투표 마감일·총 출품 수가 전부 여기서 온다.
 */
export function useContestById(contestId: string | null) {
  const token = useToken();
  return useQuery({
    queryKey: key.detail(contestId ?? '', token),
    enabled: !!token && !!contestId,
    queryFn: () => contestApi.getContest(contestId!, token!),
  });
}

/** 전체 출품작 목록. 진행중 탭의 미리보기(useContestEntries)와 달리 끝까지 이어붙인다 */
export function useContestEntryPages(contestId: string | null, sort: ContestSortApi) {
  const token = useToken();
  return useInfiniteQuery({
    queryKey: key.entryPages(contestId ?? '', sort, token),
    enabled: !!token && !!contestId,
    initialPageParam: 0,
    queryFn: ({ pageParam }) =>
      contestApi.getEntries(contestId!, token!, { sort, page: pageParam, size: ENTRY_PAGE_SIZE }),
    getNextPageParam: (lastPage) => (lastPage.last ? undefined : lastPage.page + 1),
  });
}

export function useContestEntryDetail(contestId: string | null, entryId: string | null) {
  const token = useToken();
  return useQuery({
    queryKey: ['contest', 'entry', contestId ?? '', entryId ?? '', token ?? 'guest'],
    enabled: !!token && !!contestId && !!entryId,
    queryFn: () => contestApi.getEntry(contestId!, entryId!, token!),
  });
}

/**
 * 출품작 신고.
 *
 * 서버는 사유(SPAM·ABUSE·COPYRIGHT·INAPPROPRIATE·ETC)를 필수로 받는데 화면에는 사유 선택이
 * 없다 — 목업이 "신고하기" 한 줄로 끝난다. 고를 수 없으니 ETC로 보낸다.
 * ponytail: 운영에서 사유별 통계가 필요해지면 그때 시트를 붙인다.
 */
export function useReportContestEntry() {
  const token = useToken();
  return useMutation({
    mutationFn: (entryId: string) => contestApi.reportEntry(entryId, { reason: 'ETC' }, token!),
  });
}

export function useMyContestEntry(contestId: string | null) {
  const token = useToken();
  return useQuery({
    queryKey: key.myEntry(contestId ?? '', token),
    enabled: !!token && !!contestId,
    queryFn: () => contestApi.getMyEntry(contestId!, token!),
  });
}

/** 내 콘테스트 참여 기록. 회차가 아니라 출품작 단위로 오므로 매퍼가 회차별로 접는다 */
export function useMyContestHistory() {
  const token = useToken();
  return useQuery({
    queryKey: ['contest', 'my-history', token ?? 'guest'],
    enabled: !!token,
    queryFn: () => contestApi.getMyHistory(token!),
  });
}

export function usePastContests() {
  const token = useToken();
  return useQuery({
    queryKey: key.past(token),
    enabled: !!token,
    queryFn: () => contestApi.getPastContests(token!, 0, PAST_PAGE_SIZE),
  });
}

/**
 * 순위 변동 스냅샷. 투표 기간 전에 부르면 409(RESULT_NOT_OPENED)라 enabled로 막는다.
 * 그래도 경계 시각에 걸릴 수 있어 409는 null로 흘린다 — 패널만 안 뜨면 되는 일이다.
 */
export function useContestRankingHistory(contestId: string | null, enabled: boolean) {
  const token = useToken();
  return useQuery({
    queryKey: key.ranking(contestId ?? ''),
    enabled: !!token && !!contestId && enabled,
    queryFn: async () => {
      try {
        return await contestApi.getRankingHistory(contestId!, token!);
      } catch (err) {
        if (isErrorCode(err, 'RESULT_NOT_OPENED')) return null;
        throw err;
      }
    },
  });
}

/**
 * 회차 결과. 발표 전이면 409(RESULT_NOT_OPENED)이고 그때는 null이다 —
 * 수상 배너를 숨길 뿐 화면 전체를 실패로 만들 이유가 없다.
 */
export function useContestResult(contestId: string | null) {
  const token = useToken();
  return useQuery({
    queryKey: key.result(contestId ?? '', token),
    enabled: !!token && !!contestId,
    queryFn: async () => {
      try {
        return await contestApi.getResult(contestId!, token!);
      } catch (err) {
        if (isErrorCode(err, 'RESULT_NOT_OPENED')) return null;
        throw err;
      }
    },
  });
}

/**
 * 다음 회차 알림 신청 토글. 서버가 양쪽 다 멱등이라 재시도해도 안전하다.
 * 응답의 subscribed가 서버 기준 최신값이므로 낙관적 갱신 후 이 값으로 덮는다.
 */
export function useToggleContestSubscription() {
  const token = useToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ contestId, subscribed }: { contestId: string; subscribed: boolean }) =>
      subscribed ? contestApi.unsubscribe(contestId, token!) : contestApi.subscribe(contestId, token!),
    onMutate: async ({ subscribed }) => {
      // 예고 화면의 알림 버튼은 upcoming 응답의 subscribed를 그린다 — current가 아니다
      await queryClient.cancelQueries({ queryKey: key.upcoming(token) });
      const previous = queryClient.getQueryData<ContestResponseDTO | null>(key.upcoming(token));
      if (previous) {
        queryClient.setQueryData<ContestResponseDTO>(key.upcoming(token), { ...previous, subscribed: !subscribed });
      }
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous !== undefined) queryClient.setQueryData(key.upcoming(token), context.previous);
    },
    onSuccess: (data) => {
      const previous = queryClient.getQueryData<ContestResponseDTO | null>(key.upcoming(token));
      if (previous) {
        queryClient.setQueryData<ContestResponseDTO>(key.upcoming(token), { ...previous, subscribed: data.subscribed });
      }
    },
  });
}

export function useMyContestVotes(contestId: string | null, enabled: boolean) {
  const token = useToken();
  return useQuery({
    queryKey: key.myVotes(contestId ?? '', token),
    enabled: !!token && !!contestId && enabled,
    queryFn: () => contestApi.getMyVotes(contestId!, token!),
  });
}

/**
 * 투표 / 취소.
 *
 * 표는 콘테스트 기간 통산이고 마감 전까지 자유롭게 바꿀 수 있다. 탭 즉시 반영해야 해서
 * 낙관적 갱신을 하는데, 되돌릴 대상이 두 군데다 — 목록의 voted 플래그와 남은 표 수.
 * 남은 표는 current 응답(remainingVoteCount)에 있어 목록 캐시만 건드리면 어긋난다.
 *
 * 정렬 두 가지가 서로 다른 캐시를 쓰므로 성공 후에는 콘테스트 하위 캐시를 통째로 무효화한다.
 * 득표순 목록은 투표로 순서 자체가 바뀌기도 한다.
 */
export function useToggleVote(contestId: string | null) {
  const token = useToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ entryId, voted }: { entryId: string; voted: boolean }) =>
      voted ? contestApi.cancelVote(contestId!, entryId, token!) : contestApi.vote(contestId!, entryId, token!),

    onMutate: async ({ entryId, voted }) => {
      await queryClient.cancelQueries({ queryKey: ['contest'] });

      const flip = (entry: ContestEntryDTO) =>
        String(entry.entryId) === entryId ? { ...entry, voted: !voted } : entry;

      // 진행중 탭 미리보기(단일 페이지)
      const entryCaches = queryClient.getQueriesData<ContestEntryPageDTO>({
        queryKey: ['contest', 'entries', contestId ?? ''],
      });
      entryCaches.forEach(([cacheKey, page]) => {
        if (!page) return;
        queryClient.setQueryData<ContestEntryPageDTO>(cacheKey, { ...page, entries: page.entries.map(flip) });
      });

      // 전체 출품작 화면(무한 목록) — 같은 작품이 양쪽에 떠 있을 수 있어 둘 다 뒤집는다
      const pageCaches = queryClient.getQueriesData<InfiniteData<ContestEntryPageDTO>>({
        queryKey: ['contest', 'entry-pages', contestId ?? ''],
      });
      pageCaches.forEach(([cacheKey, data]) => {
        if (!data) return;
        queryClient.setQueryData<InfiniteData<ContestEntryPageDTO>>(cacheKey, {
          ...data,
          pages: data.pages.map((page) => ({ ...page, entries: page.entries.map(flip) })),
        });
      });

      // 남은 표는 두 캐시에 산다 — 진행중 탭은 current, 전체 목록 화면은 detail을 읽는다
      const voteKeys = [key.current(token), key.detail(contestId ?? '', token)];
      const contests = voteKeys.map((cacheKey) => {
        const contest = queryClient.getQueryData<ContestResponseDTO | null>(cacheKey);
        if (contest) {
          // 상한·하한을 넘기지 않게 잘라둔다 — 서버 응답이 오면 어차피 그 값으로 덮인다
          const remaining = Math.min(contest.voteLimit, Math.max(0, contest.remainingVoteCount + (voted ? 1 : -1)));
          queryClient.setQueryData<ContestResponseDTO>(cacheKey, {
            ...contest,
            remainingVoteCount: remaining,
            usedVoteCount: contest.voteLimit - remaining,
          });
        }
        return [cacheKey, contest] as const;
      });

      return { entryCaches, pageCaches, contests };
    },

    onError: (_err, _vars, context) => {
      context?.entryCaches.forEach(([cacheKey, page]) => queryClient.setQueryData(cacheKey, page));
      context?.pageCaches.forEach(([cacheKey, data]) => queryClient.setQueryData(cacheKey, data));
      context?.contests.forEach(([cacheKey, contest]) => queryClient.setQueryData(cacheKey, contest));
    },

    onSuccess: (data) => {
      // 남은 표는 서버 값이 정답이다 — 다른 기기에서 쓴 표가 있으면 낙관적 계산과 어긋난다
      [key.current(token), key.detail(contestId ?? '', token)].forEach((cacheKey) => {
        const contest = queryClient.getQueryData<ContestResponseDTO | null>(cacheKey);
        if (!contest) return;
        queryClient.setQueryData<ContestResponseDTO>(cacheKey, {
          ...contest,
          voteLimit: data.voteLimit,
          usedVoteCount: data.usedVoteCount,
          remainingVoteCount: data.remainingVoteCount,
        });
      });
    },

    onSettled: () => {
      // 목록 자체는 다시 받지 않는다 — 득표순이면 순서가 바뀌어 방금 누른 카드가
      // 손 밑에서 움직인다. 화면을 떠났다 오면 자연히 최신 순서로 받는다.
      queryClient.invalidateQueries({ queryKey: key.myVotes(contestId ?? '', token) });
    },
  });
}

/**
 * 출품작 삭제. 받은 표도 함께 사라지고 되돌릴 수 없다(서버가 투표 행을 먼저 지운다).
 * 출품 기간과 투표 기간에만 가능하고, 발표 이후에는 서버가 409로 막는다.
 */
export function useDeleteContestEntry(contestId: string | null) {
  const token = useToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (entryId: string) => contestApi.deleteEntry(contestId!, entryId, token!),
    onSuccess: () => {
      // 남은 출품 자리(remainingEntryCount)가 늘어나므로 current도 같이 다시 받는다
      queryClient.invalidateQueries({ queryKey: key.myEntry(contestId ?? '', token) });
      queryClient.invalidateQueries({ queryKey: ['contest', 'entries', contestId ?? ''] });
      queryClient.invalidateQueries({ queryKey: ['contest', 'entry-pages', contestId ?? ''] });
      queryClient.invalidateQueries({ queryKey: key.current(token) });
      queryClient.invalidateQueries({ queryKey: key.detail(contestId ?? '', token) });
    },
  });
}

/**
 * 출품. 서버가 photo 파트를 하나만 받으므로 사진 1장당 한 번 호출한다.
 *
 * 여러 장을 한 번에 고른 경우 호출부가 순차로 돌리고, 중간에 실패하면 거기까지는 이미
 * 등록된 상태로 남는다 — 서버에 트랜잭션 경계가 없어서 되돌릴 방법이 없다.
 * 그래서 화면이 성공한 장을 폼에서 지우고 실패한 장만 남기는 식으로 재시도한다.
 */
export function useCreateContestEntry(contestId: string | null) {
  const token = useToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ body, photo }: { body: ContestCreateEntryRequestDTO; photo: FileUpload }) =>
      contestApi.createEntry(contestId!, body, photo, token!),
    onSuccess: () => {
      // 남은 출품 자리(remainingEntryCount)와 총 출품 수가 함께 바뀐다
      queryClient.invalidateQueries({ queryKey: key.myEntry(contestId ?? '', token) });
      queryClient.invalidateQueries({ queryKey: ['contest', 'entries', contestId ?? ''] });
      queryClient.invalidateQueries({ queryKey: ['contest', 'entry-pages', contestId ?? ''] });
      queryClient.invalidateQueries({ queryKey: key.current(token) });
      queryClient.invalidateQueries({ queryKey: key.detail(contestId ?? '', token) });
    },
  });
}
