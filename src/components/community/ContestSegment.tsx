import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import ContestActiveTab from '@/components/community/ContestActiveTab';
import ContestMyEntryTab from '@/components/community/ContestMyEntryTab';
import ContestPastTab from '@/components/community/ContestPastTab';
import MyVotesSheet from '@/components/community/MyVotesSheet';
import MyEntriesSheet from '@/components/community/MyEntriesSheet';
import Toast from '@/components/common/Toast';
import { toErrorMessage } from '@/api/auth';
import { useAuthStore } from '@/store/useAuthStore';
import { voteHaptic } from '@/utils/haptics';
import {
  useContestEntries,
  useContestRankingHistory,
  useContestResult,
  useCurrentContest,
  useDeleteContestEntry,
  useMyContestEntry,
  useMyContestHistory,
  useMyContestVotes,
  usePastContests,
  useToggleContestSubscription,
  useToggleVote,
  useUpcomingContest,
} from '@/hooks/useContest';
import {
  mapAwardSummary,
  mapContestEntry,
  mapContestInfo,
  mapMyHistory,
  mapMyVotes,
  mapPastItem,
  mapRankHistory,
} from '@/utils/contestMappers';
import {
  ContestPastMonthItem,
  ContestPhase,
  ContestSortKey,
  ContestSubmitTarget,
} from '@/types/community';
import { CONTENT_PADDING, FONT_MD, FONT_SM, HAIRLINE_WIDTH } from '@/constants/layout';
import { normalize } from '@/utils/normalize';
import { BRAND, HAIRLINE, TEXT_SUB } from '@/constants/colors';

const ACCENT = BRAND;
const INK = '#000000';
const SUB = TEXT_SUB;

type SubtabKey = 'active' | 'mine' | 'past';

const SUBTABS: { key: SubtabKey; label: string }[] = [
  { key: 'active', label: '진행중' },
  { key: 'mine', label: '내 출품' },
  { key: 'past', label: '지난' },
];

interface Props {
  onSelectPastItem: (item: ContestPastMonthItem) => void;
  /** 빈 상태 CTA가 출품으로 넘어갈 수 있게 목록 화면에도 같은 target을 넘긴다 */
  onSeeAllEntries: (contestId: string, target: ContestSubmitTarget) => void;
  /** 남은 자리 수를 함께 넘긴다 — 출품 화면이 자체 기본값으로 3장을 열어주면 상한이 무너진다 */
  onOpenSubmit: (target: ContestSubmitTarget) => void;
  onOpenEntry: (contestId: string, entryId: string) => void;
  onOpenResult: (contestId: string, monthLabel: string, myRank: number | null) => void;
}

export default function ContestSegment({ onSelectPastItem, onSeeAllEntries, onOpenSubmit, onOpenEntry, onOpenResult }: Props) {
  const [subtab, setSubtab] = useState<SubtabKey>('active');
  const isLoggedIn = useAuthStore((s) => !!s.accessToken);
  const [voteSort, setVoteSort] = useState<ContestSortKey>('latest');

  const currentQuery = useCurrentContest();
  const upcomingQuery = useUpcomingContest();
  const pastQuery = usePastContests();
  const historyQuery = useMyContestHistory();

  const current = currentQuery.data ?? null;
  const contestId = current ? String(current.contestId) : null;

  /**
   * 진행 중 회차가 없으면 ENDED다 — 서버의 ENDED(발표까지 끝난 회차)와는 다른 뜻이지만
   * 화면 입장에서는 "지금 참여할 게 없다"로 같다. getCurrentContest는 발표 전 회차까지만
   * 잡아주므로 phase가 ENDED로 내려오는 일은 없다.
   */
  const phase: ContestPhase = current?.phase ?? 'ENDED';

  const entriesQuery = useContestEntries(contestId, voteSort);
  const myEntryQuery = useMyContestEntry(contestId);
  const rankingQuery = useContestRankingHistory(contestId, phase === 'VOTING');

  // 직전 회차 수상 요약은 단일 API가 없다 — 지난 목록 [0]과 그 회차 결과를 합친다
  const lastPast = pastQuery.data?.contests[0] ?? null;
  const lastResultQuery = useContestResult(lastPast ? String(lastPast.contestId) : null);

  const contestInfo = useMemo(() => (current ? mapContestInfo(current) : null), [current]);
  const nextContest = useMemo(
    () => (upcomingQuery.data ? mapContestInfo(upcomingQuery.data) : null),
    [upcomingQuery.data],
  );
  const pastItems = useMemo(
    () => (pastQuery.data?.contests ?? []).map(mapPastItem),
    [pastQuery.data],
  );
  const lastAward = useMemo(
    () => (lastPast && lastResultQuery.data ? mapAwardSummary(lastPast, lastResultQuery.data) : null),
    [lastPast, lastResultQuery.data],
  );
  const myHistory = useMemo(
    () => (historyQuery.data ? mapMyHistory(historyQuery.data) : null),
    [historyQuery.data],
  );
  const rankHistory = useMemo(
    () => (rankingQuery.data && current ? mapRankHistory(rankingQuery.data, current) : null),
    [rankingQuery.data, current],
  );

  const serverEntries = useMemo(
    () => (entriesQuery.data?.entries ?? []).map(mapContestEntry),
    [entriesQuery.data],
  );
  const myEntries = useMemo(
    () => (myEntryQuery.data?.entries ?? []).map(mapContestEntry),
    [myEntryQuery.data],
  );

  const maxVotes = current?.voteLimit ?? 0;
  const maxEntries = current?.maxEntriesPerUser ?? myEntryQuery.data?.maxEntriesPerUser ?? 0;

  // 남은 표는 서버 값이다. 낙관적 갱신도 current 캐시에서 일어나므로 로컬 사본을 두지 않는다
  const votesLeft = current?.remainingVoteCount ?? 0;

  const [toastMessage, setToastMessage] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const [myVotesSheetVisible, setMyVotesSheetVisible] = useState(false);
  const [myEntriesSheetVisible, setMyEntriesSheetVisible] = useState(false);

  const subscribeMutation = useToggleContestSubscription();
  const voteMutation = useToggleVote(contestId);
  const deleteEntryMutation = useDeleteContestEntry(contestId);

  // 시트를 열 때만 조회한다 — 투표할 때마다 무효화되므로 열려 있으면 자동으로 다시 받는다
  const myVotesQuery = useMyContestVotes(contestId, myVotesSheetVisible);
  const myVoteEntries = useMemo(
    () => (myVotesQuery.data ? mapMyVotes(myVotesQuery.data) : []),
    [myVotesQuery.data],
  );

  const submitTargetParams: ContestSubmitTarget = {
    contestId: contestId ?? '',
    theme: contestInfo?.theme ?? '',
    monthLabel: contestInfo?.monthLabel ?? '',
    remainingSlots: current?.remainingEntryCount ?? 0,
  };
  const openSubmit = () => onOpenSubmit(submitTargetParams);
  // 진행 중 회차가 없으면 열 상세도 없다 — 이 경로가 도달하는 화면은 전부 회차 안의 것들이다
  const openEntry = (entryId: string) => contestId && onOpenEntry(contestId, entryId);

  const showToast = (message: string) => {
    setToastMessage(message);
    setToastVisible(true);
  };

  // 투표 기간 안에서는 취소가 자유롭다 — 완료 버튼 재탭으로 표 1개가 복구된다.
  const toggleVote = (id: string) => {
    const target = serverEntries.find((entry) => entry.id === id);
    if (!target || voteMutation.isPending) return;
    // 내 작품은 카드에 버튼 자체가 없지만, 다른 경로로 들어와도 서버까지 가지 않게 여기서 끊는다
    if (target.isMine) return;
    // 표가 없는데 새로 투표하는 것만 막는다 — 이미 던진 표의 취소는 언제나 가능해야 한다
    if (!target.voted && votesLeft <= 0) return;

    voteHaptic();
    voteMutation.mutate(
      { entryId: id, voted: target.voted },
      {
        onSuccess: (data) => {
          showToast(
            target.voted
              ? `투표를 취소했어요 · ${data.remainingVoteCount}/${data.voteLimit}`
              : `${target.author} 님에게 투표했어요 · ${data.remainingVoteCount}/${data.voteLimit}`,
          );
        },
        onError: (err) => showToast(toErrorMessage(err, '투표에 실패했어요')),
      },
    );
  };

  /**
   * 내가 투표한 작품 시트에서의 취소.
   *
   * toggleVote를 그대로 쓰면 안 된다 — 그쪽은 화면에 보이는 첫 페이지(serverEntries)에서
   * 대상을 찾는데, 2페이지 이후 작품에 던진 표는 거기 없어서 조용히 아무 일도 안 일어난다.
   * 시트에 떠 있다는 것 자체가 이미 투표했다는 뜻이라 조회 없이 취소로 보낸다.
   */
  const cancelVoteFromSheet = (id: string) => {
    if (voteMutation.isPending) return;
    voteHaptic();
    voteMutation.mutate(
      { entryId: id, voted: true },
      {
        onSuccess: (data) => showToast(`투표를 취소했어요 · ${data.remainingVoteCount}/${data.voteLimit}`),
        onError: (err) => showToast(toErrorMessage(err, '투표 취소에 실패했어요')),
      },
    );
  };

  const deleteMyEntry = (id: string) => {
    if (deleteEntryMutation.isPending) return;
    deleteEntryMutation.mutate(id, {
      onSuccess: () => showToast('출품작을 삭제했어요'),
      onError: (err) => showToast(toErrorMessage(err, '삭제에 실패했어요')),
    });
  };

  /**
   * 탭마다 보는 쿼리가 다르다 — 아직 안 온 쿼리의 빈 배열을 "없음"으로 그리면 안 된다.
   * isPending은 enabled: false에서도 true라 비로그인이면 영원히 안 풀린다 —
   * isLoading(=isPending && isFetching)을 쓴다.
   */
  const tabQueries: { isLoading: boolean; error: unknown; refetch: () => unknown }[] = {
    active: [currentQuery, pastQuery, entriesQuery, myEntryQuery],
    mine: [currentQuery, myEntryQuery, historyQuery],
    past: [pastQuery],
  }[subtab];
  const isLoading = tabQueries.some((query) => query.isLoading);
  // 조회 실패와 "회차가 없다"는 다르다 — 없음은 currentQuery.data === null로 이미 표현된다
  const loadError = tabQueries.some((query) => query.error);

  const subtabBar = (
    <View className="flex-row" style={{ paddingHorizontal: CONTENT_PADDING, gap: normalize(20), borderBottomWidth: HAIRLINE_WIDTH, borderBottomColor: HAIRLINE }}>
      {SUBTABS.map((tab) => {
        const isActive = tab.key === subtab;
        return (
          <Pressable key={tab.key} onPress={() => setSubtab(tab.key)} style={{ paddingVertical: normalize(10), borderBottomWidth: isActive ? 2 : 0, borderBottomColor: ACCENT, marginBottom: -1 }}>
            <Text allowFontScaling={false} style={{ fontFamily: isActive ? 'Pretendard-SemiBold' : 'Pretendard-Medium', fontSize: FONT_SM, color: isActive ? INK : SUB, letterSpacing: -0.2 }}>
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );

  // 콘테스트 쿼리는 전부 토큰이 있어야 돈다 — 없으면 어느 탭이든 빈 화면이라 안내로 끊는다
  if (!isLoggedIn) {
    return (
      <View style={{ flex: 1 }}>
        {subtabBar}
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: CONTENT_PADDING }}>
          <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Medium', fontSize: FONT_SM, letterSpacing: -0.2, color: SUB }}>
            로그인이 필요해요
          </Text>
        </View>
      </View>
    );
  }

  if (isLoading || loadError) {
    return (
      <View style={{ flex: 1 }}>
        {subtabBar}
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: CONTENT_PADDING, gap: normalize(12) }}>
          {isLoading ? (
            <ActivityIndicator color={ACCENT} />
          ) : (
            <>
              <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_MD, letterSpacing: -0.3, color: INK }}>
                콘테스트를 불러오지 못했어요
              </Text>
              <Pressable onPress={() => tabQueries.forEach((query) => query.refetch())}>
                <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_SM, letterSpacing: -0.2, color: ACCENT }}>
                  다시 시도
                </Text>
              </Pressable>
            </>
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      {subtabBar}

      {subtab === 'active' && (
        <ContestActiveTab
          phase={phase}
          contest={contestInfo}
          lastAward={lastAward}
          submitFeed={serverEntries}
          voteEntries={serverEntries}
          sort={voteSort}
          onChangeSort={setVoteSort}
          rankHistory={rankHistory}
          votesLeft={votesLeft}
          maxVotes={maxVotes}
          myEntryCount={myEntries.length}
          myEntryThumbs={myEntries.map((entry) => ({ gradient: entry.gradient, photoUrl: entry.photoUrl }))}
          maxEntries={maxEntries}
          nextContest={nextContest}
          subscribed={upcomingQuery.data?.subscribed ?? false}
          pastItems={pastItems}
          onVote={toggleVote}
          onOpenEntry={openEntry}
          onOpenSubmit={openSubmit}
          onSeeAll={() => contestId && onSeeAllEntries(contestId, submitTargetParams)}
          onOpenMyVotes={() => setMyVotesSheetVisible(true)}
          onOpenMyEntries={() => setMyEntriesSheetVisible(true)}
          onSelectPastItem={onSelectPastItem}
          onSeeAllPast={() => setSubtab('past')}
          onSubscribe={() => {
            const upcoming = upcomingQuery.data;
            if (!upcoming || subscribeMutation.isPending) return;
            const wasSubscribed = upcoming.subscribed;
            subscribeMutation.mutate(
              { contestId: String(upcoming.contestId), subscribed: wasSubscribed },
              {
                onSuccess: () => showToast(wasSubscribed ? '알림을 껐어요' : '시작하면 알려드릴게요'),
                onError: () => showToast('알림 설정에 실패했어요'),
              },
            );
          }}
        />
      )}
      {subtab === 'mine' && (
        <ContestMyEntryTab
          phase={phase}
          contest={contestInfo}
          entryCount={myEntries.length}
          maxEntries={maxEntries}
          history={myHistory}
          onOpenSubmit={openSubmit}
          onOpenResult={onOpenResult}
        />
      )}
      {subtab === 'past' && <ContestPastTab items={pastItems} onSelectItem={onSelectPastItem} />}

      <Toast message={toastMessage} visible={toastVisible} onHide={() => setToastVisible(false)} />

      <MyVotesSheet
        visible={myVotesSheetVisible}
        onClose={() => setMyVotesSheetVisible(false)}
        entries={myVoteEntries}
        votesLeft={votesLeft}
        maxVotes={maxVotes}
        onCancelVote={cancelVoteFromSheet}
        onOpenEntry={openEntry}
      />

      <MyEntriesSheet
        visible={myEntriesSheetVisible}
        onClose={() => setMyEntriesSheetVisible(false)}
        phase={phase}
        contest={contestInfo}
        maxEntries={maxEntries}
        entries={myEntries}
        onDelete={deleteMyEntry}
        onOpenSubmit={openSubmit}
      />
    </View>
  );
}
