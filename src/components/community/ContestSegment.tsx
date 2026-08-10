import React, { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import ContestActiveTab from '@/components/community/ContestActiveTab';
import ContestMyEntryTab from '@/components/community/ContestMyEntryTab';
import ContestPastTab from '@/components/community/ContestPastTab';
import MyVotesSheet from '@/components/community/MyVotesSheet';
import MyEntriesSheet from '@/components/community/MyEntriesSheet';
import Toast from '@/components/common/Toast';
import DevStateSwitch from '@/components/common/DevStateSwitch';
import { voteHaptic } from '@/utils/haptics';
import {
  ContestEntry,
  ContestInfo,
  ContestAwardSummary,
  ContestPastMonthItem,
  ContestPhase,
  ContestSortKey,
  ContestSubmitTarget,
  MyVoteEntry,
  RankHistory,
  RankVariant,
} from '@/types/community';
import { CONTENT_PADDING, FONT_SM } from '@/constants/layout';
import { normalize } from '@/utils/normalize';

const ACCENT = '#E31B59';
const INK = '#000000';
const SUB = 'rgba(0,0,0,0.4)';

type SubtabKey = 'active' | 'mine' | 'past';

/** 표는 하루 단위가 아니라 콘테스트 기간(2주) 통틀어 3표 — 일일 리셋 없음 */
const MAX_VOTES = 3;
const MAX_ENTRIES = 3;

const SUBTABS: { key: SubtabKey; label: string }[] = [
  { key: 'active', label: '진행중' },
  { key: 'mine', label: '내 출품' },
  { key: 'past', label: '지난' },
];

// ~/Desktop/handoff_community/contest-final-mockup.html(월간 주기 최종안) 기준 mock 데이터
const SUBMIT_CONTEST: ContestInfo = {
  monthLabel: '8월',
  theme: '골든아워',
  themeDesc: '해 뜨거나 지는 시간의 빛을 담아보세요',
  submitDeadlineLabel: '8월 14일',
  voteDeadlineLabel: '8월 31일',
  participantCount: 82,
  entryCount: 214,
};

const NEXT_CONTEST: ContestInfo = {
  monthLabel: '9월',
  theme: '밤의 도시',
  themeDesc: '해가 진 뒤의 거리와 불빛을 담아보세요',
  submitDeadlineLabel: '9월 14일',
  voteDeadlineLabel: '9월 30일',
  participantCount: 3,
  entryCount: 4,
};

/** 결과 발표 당일(매달 1일)에만 진행중 탭 상단에 뜨는 지난 달 요약 — 지난 탭 목록과는 별도 데이터 */
const LAST_MONTH_AWARD: ContestAwardSummary = {
  monthLabel: '7월',
  rank: 1,
  theme: '비 오는 날',
  winnerHandle: '@rainy.frame',
  voteCount: 1032,
  // 목업 community-feed.html의 .award-row__thumbs 3개와 같은 그라디언트(1·2·3위 순)
  podiumGradients: [
    ['#1a1530', '#5a3355', '#d4856a'],
    ['#12333a', '#2f5f5a', '#8fae9b'],
    ['#241a33', '#8b4a6b', '#e8a87c'],
  ],
};

const SUBMIT_FEED: ContestEntry[] = [
  { id: 's1', author: '@rimi', createdAgoLabel: '12분 전', votes: 0, voted: false, gradient: ['#1a1530', '#5a3355', '#d4856a'] },
  { id: 's2', author: '@dokyum', createdAgoLabel: '38분 전', votes: 0, voted: false, gradient: ['#12333a', '#2f5f5a', '#8fae9b'] },
  { id: 's3', author: '@haneul', createdAgoLabel: '2시간 전', votes: 0, voted: false, gradient: ['#241a33', '#8b4a6b', '#e8a87c'] },
  { id: 's4', author: '@jiwoo_p', createdAgoLabel: '4시간 전', votes: 0, voted: false, gradient: ['#2d1b4e', '#8b4a6b', '#f0c89a'] },
];

const RESULT_DAY_FEED: ContestEntry[] = [
  { id: 'r1', author: '@nightwalk', createdAgoLabel: '방금', votes: 0, voted: false, gradient: ['#0f1f2e', '#3f5a6b', '#d9a882'] },
  { id: 'r2', author: '@seora', createdAgoLabel: '18분 전', votes: 0, voted: false, gradient: ['#2d1b4e', '#8b4a6b', '#f0c89a'] },
  { id: 'r3', author: '@taeho', createdAgoLabel: '1시간 전', votes: 0, voted: false, gradient: ['#2d1b4e', '#8b4a6b', '#f0c89a'] },
  { id: 'r4', author: '@eunji', createdAgoLabel: '3시간 전', votes: 0, voted: false, gradient: ['#1c1c2b', '#4a3a5e', '#c98f7a'] },
];

/**
 * 득표순 정렬용 고정 순열. 투표 기간에는 득표수를 노출하지 않아 mock 데이터의 votes가 전부 0이라,
 * 실제 표 수로 정렬하면 화면이 그대로다. 서버가 VOTES 정렬을 내려주기 전까지 "다른 순서"만 재현한다.
 */
const VOTE_SORT_ORDER = [4, 0, 2, 5, 1, 3];

const VOTE_ENTRIES: ContestEntry[] = [
  { id: 'v1', author: '@rimi', spot: '다대포', shotAtLabel: '05:32', votes: 0, voted: false, gradient: ['#1a1530', '#5a3355', '#d4856a'] },
  { id: 'v2', author: '@dokyum', spot: '청사포', shotAtLabel: '18:04', votes: 0, voted: false, gradient: ['#12333a', '#2f5f5a', '#8fae9b'] },
  { id: 'v3', author: '@haneul', spot: '송정', shotAtLabel: '05:48', votes: 0, voted: false, gradient: ['#241a33', '#8b4a6b', '#e8a87c'] },
  { id: 'v4', author: '@jiwoo_p', spot: '이기대', shotAtLabel: '19:12', votes: 0, voted: false, gradient: ['#2d1b4e', '#8b4a6b', '#f0c89a'] },
  { id: 'v5', author: '@seora', spot: '광안리', shotAtLabel: '05:21', votes: 0, voted: false, gradient: ['#1c1c2b', '#4a3a5e', '#c98f7a'] },
  { id: 'v6', author: '@taeho', spot: '해운대', shotAtLabel: '18:37', votes: 0, voted: false, gradient: ['#0f1f2e', '#3f5a6b', '#d9a882'] },
];

const RANK_DAYS = ['16', '17', '18', '19', '20', '21', '22'];

/** 날짜별 순위 배열 → 스냅샷. null은 그 날 순위권(1~3위) 밖이라는 뜻이고, 배열이 짧으면 거기서 선이 끝난다. */
function rankPoints(ranks: (number | null)[]) {
  return ranks.map((rank, i) => ({ dateLabel: RANK_DAYS[i], rank }));
}

const RANK_HISTORY_NORMAL: RankHistory = {
  variant: 'normal',
  subtitle: '어제 집계 · @sunset_jk 1위',
  periodLabel: '투표 시작 8월 15일 · 마감 8월 31일',
  days: RANK_DAYS,
  legend: [
    { id: 'l1', author: '@sunset_jk', meta: '214표 · 광안리', rank: 1, gradient: ['#1a1530', '#5a3355', '#d4856a'], isNew: false },
    { id: 'l2', author: '@minsoo', meta: '187표 · 다대포', rank: 2, gradient: ['#12333a', '#2f5f5a', '#8fae9b'], isNew: false },
    { id: 'l3', author: '@dawnlee', meta: '31표 · 21일 3위권 진입', rank: 3, gradient: ['#241a33', '#8b4a6b', '#e8a87c'], isNew: true },
  ],
  // 선 색은 사진과 무관한 순위 서열 표시 — 1위만 accent, 나머지는 회색 농도로 구분한다(목업 11a 고정값)
  series: [
    { gradient: ['#1a1530', '#5a3355', '#d4856a'], strokeColor: '#E31B59', strokeWidth: 2.4, points: rankPoints([2, 1, 1, 1, 1, 1, 1]) },
    { gradient: ['#12333a', '#2f5f5a', '#8fae9b'], strokeColor: '#b8b8be', strokeWidth: 2, points: rankPoints([1, 2, 2, 3, 2, 2, 2]) },
    { gradient: ['#241a33', '#8b4a6b', '#e8a87c'], strokeColor: '#d2d2d8', strokeWidth: 2, points: rankPoints([3, 3, 3, 2, 3, 3, 3]) },
  ],
};

const RANK_HISTORY_FIRST: RankHistory = {
  variant: 'first',
  subtitle: '첫 집계는 내일 자정에 나와요',
  days: [],
  legend: [],
  series: [],
};

/**
 * 12a — 3위권 안에서 이탈/진입이 있는 경우. null = 그 날 순위권 밖(권외).
 * TODO(API): 실제로는 서버 집계 결과에 진입·이탈이 있으면 이 형태가 내려온다.
 */
const RANK_HISTORY_OUT: RankHistory = {
  variant: 'out',
  subtitle: '어제 집계 · @sunset_jk 1위',
  periodLabel: '투표 시작 8월 15일 · 마감 8월 31일',
  days: RANK_DAYS,
  legend: [
    { id: 'l1', author: '@sunset_jk', meta: '214표 · 광안리', rank: 1, gradient: ['#1a1530', '#5a3355', '#d4856a'], isNew: false },
    { id: 'l2', author: '@minsoo', meta: '187표 · 다대포', rank: 2, gradient: ['#12333a', '#2f5f5a', '#8fae9b'], isNew: false },
    { id: 'l3', author: '@dawnlee', meta: '31표 · 21일 3위권 진입', rank: 3, gradient: ['#2a1030', '#8b4438', '#f0c89a'], isNew: true },
  ],
  series: [
    { gradient: ['#1a1530', '#5a3355', '#d4856a'], strokeColor: '#E31B59', strokeWidth: 2.4, points: rankPoints([1, 1, 1, 1, 1, 1, 1]) },
    { gradient: ['#12333a', '#2f5f5a', '#8fae9b'], strokeColor: '#b8b8be', strokeWidth: 2, points: rankPoints([2, 2, 2, 2, 2, 2, 2]) },
    // 3위권을 지키다 21일에 밀려난 작품 — 권외로 내려가는 선을 그리고 거기서 끝낸다(이후 순위는 비공개)
    { gradient: ['#241a33', '#8b4a6b', '#e8a87c'], strokeColor: '#d2d2d8', strokeWidth: 2, points: rankPoints([3, 3, 3, 3, 3, null]) },
    // 권외에 있다가 21일에 3위권으로 진입 — 진입 전 구간은 실제 순위를 모르므로 점선이다
    { gradient: ['#2a1030', '#8b4438', '#f0c89a'], strokeColor: '#5c5c60', strokeWidth: 2, points: rankPoints([null, null, null, null, null, 3, 3]) },
  ],
};

const PAST_ITEMS: ContestPastMonthItem[] = [
  { id: 'p1', monthLabel: '6월', theme: '비 오는 날', winnerHandle: '@rainy.frame', meta: '118명 출품 · 1,032표', myRank: 2, kind: 'award', gradient: ['#1a0f1e', '#c080a0', '#f0c89a'] },
  { id: 'p2', monthLabel: '5월', theme: '밤하늘', winnerHandle: '@nightowl', meta: '142명 출품 · 1,284표', myRank: 42, kind: 'plain', gradient: ['#020010', '#1a1545', '#4a4080'] },
  { id: 'p3', monthLabel: '4월', theme: '숲 산책', winnerHandle: '@forestday', meta: '65명 출품 · 604표', myRank: null, kind: 'none', gradient: ['#0a1a0f', '#4a8060', '#a8c090'] },
];

/**
 * 목업 `.phase-switch`의 7개 버튼과 1:1. phase 하나로는 표현이 안 되는 분기가 있어
 * (같은 VOTING 안에서도 집계 전·권외가 갈리고, SUBMITTING 안에서 출품 0개가 갈린다) 시나리오로 묶는다.
 */
type DevScenario = 'submit' | 'submit0' | 'vote' | 'voteFirst' | 'voteOut' | 'result' | 'none' | 'none7b';

const SCENARIOS: Record<DevScenario, { phase: ContestPhase; rankVariant: RankVariant; emptyFeed: boolean }> = {
  submit: { phase: 'SUBMITTING', rankVariant: 'normal', emptyFeed: false },
  submit0: { phase: 'SUBMITTING', rankVariant: 'normal', emptyFeed: true },
  vote: { phase: 'VOTING', rankVariant: 'normal', emptyFeed: false },
  voteFirst: { phase: 'VOTING', rankVariant: 'first', emptyFeed: false },
  voteOut: { phase: 'VOTING', rankVariant: 'out', emptyFeed: false },
  result: { phase: 'RESULT', rankVariant: 'normal', emptyFeed: false },
  none: { phase: 'ENDED', rankVariant: 'normal', emptyFeed: false },
  // 7b — phase는 같은 ENDED고 다음 주기 예고만 없다
  none7b: { phase: 'ENDED', rankVariant: 'normal', emptyFeed: false },
};

// ponytail: 테스트용 임시 복원 — 확인 끝나면 SCENARIO_OPTIONS·setScenario·DevStateSwitch 3곳 같이 삭제
const SCENARIO_OPTIONS: { key: DevScenario; label: string }[] = [
  { key: 'submit', label: '출품' },
  { key: 'submit0', label: '0개' },
  { key: 'vote', label: '투표' },
  { key: 'voteFirst', label: '집계전' },
  { key: 'voteOut', label: '권외' },
  { key: 'result', label: '발표' },
  { key: 'none', label: '없음 7a' },
  { key: 'none7b', label: '없음 7b' },
];

const RANK_HISTORY_BY_VARIANT: Record<RankVariant, RankHistory> = {
  normal: RANK_HISTORY_NORMAL,
  first: RANK_HISTORY_FIRST,
  out: RANK_HISTORY_OUT,
};

interface Props {
  onSelectPastItem: (item: ContestPastMonthItem) => void;
  /** 빈 상태 CTA가 출품으로 넘어갈 수 있게 목록 화면에도 같은 target을 넘긴다 */
  onSeeAllEntries: (target: ContestSubmitTarget) => void;
  /** 남은 자리 수를 함께 넘긴다 — 출품 화면이 자체 기본값으로 3장을 열어주면 상한이 무너진다 */
  onOpenSubmit: (target: ContestSubmitTarget) => void;
  onOpenEntry: (id: string) => void;
  onOpenResult: (monthLabel: string, myRank: number | null) => void;
}

export default function ContestSegment({ onSelectPastItem, onSeeAllEntries, onOpenSubmit, onOpenEntry, onOpenResult }: Props) {
  const [subtab, setSubtab] = useState<SubtabKey>('active');

  // 서버가 phase를 내려주기 전까지는 SUBMITTING 하나만 실제로 도달 가능하다.
  // 나머지 분기는 __DEV__ 스위처로만 열리고, 릴리즈에서는 항상 기본값이다. 서버 연동 시 응답값으로 교체.
  const [scenario, setScenario] = useState<DevScenario>('submit');
  const [mineHasHistory, setMineHasHistory] = useState(true);
  const [pastHasItems, setPastHasItems] = useState(true);
  const { phase, rankVariant, emptyFeed } = SCENARIOS[scenario];

  const [voteEntries, setVoteEntries] = useState<ContestEntry[]>(VOTE_ENTRIES);
  const [voteSort, setVoteSort] = useState<ContestSortKey>('latest');
  const [votesLeft, setVotesLeft] = useState(MAX_VOTES);
  const [votedAtLabel, setVotedAtLabel] = useState<Record<string, string>>({});
  const [myEntries, setMyEntries] = useState<ContestEntry[]>([
    { id: 'mine-1', author: '@my_username', spot: '광안리 해수욕장', createdAgoLabel: '8월 6일 출품', votes: 0, voted: false, gradient: ['#1a1530', '#5a3355', '#d4856a'], caption: '난간에 기대서 찍은 광안대교', isMine: true },
    { id: 'mine-2', author: '@my_username', spot: '다대포 해수욕장', createdAgoLabel: '8월 9일 출품', votes: 0, voted: false, gradient: ['#12333a', '#2f5f5a', '#8fae9b'], caption: '물이 빠진 자리를 따라 걸으며', isMine: true },
  ]);

  const [toastMessage, setToastMessage] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const [myVotesSheetVisible, setMyVotesSheetVisible] = useState(false);
  const [myEntriesSheetVisible, setMyEntriesSheetVisible] = useState(false);
  // TODO(API): 다음 콘테스트 알림 구독 여부. 서버 연동 전까지는 화면 안에서만 유지된다
  const [subscribed, setSubscribed] = useState(false);

  const rankHistory = RANK_HISTORY_BY_VARIANT[rankVariant];

  // 정렬은 보여줄 순서만 바꾼다 — voteEntries 자체를 재배열하면 투표 상태가 섞인다
  const sortedVoteEntries = useMemo(
    () => (voteSort === 'votes' ? VOTE_SORT_ORDER.map((i) => voteEntries[i]).filter(Boolean) : voteEntries),
    [voteSort, voteEntries],
  );

  // 결과 발표일(RESULT)에는 이미 다음 달 출품이 시작돼 있어 그쪽이 출품 대상이 된다.
  const submitTarget = phase === 'RESULT' ? NEXT_CONTEST : SUBMIT_CONTEST;
  const submitTargetParams: ContestSubmitTarget = {
    theme: submitTarget.theme,
    monthLabel: submitTarget.monthLabel,
    remainingSlots: Math.max(0, MAX_ENTRIES - myEntries.length),
  };
  const openSubmit = () => onOpenSubmit(submitTargetParams);

  // 투표 기간 안에서는 취소가 자유롭다 — 완료 버튼 재탭으로 표 1개가 복구된다. 마감(말일)에 확정.
  const toggleVote = (id: string) => {
    const target = voteEntries.find((entry) => entry.id === id);
    if (!target) return;

    if (target.voted) {
      voteHaptic();
      setVoteEntries((prev) => prev.map((e) => (e.id === id ? { ...e, voted: false, votes: e.votes - 1 } : e)));
      setVotedAtLabel((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      const remaining = Math.min(MAX_VOTES, votesLeft + 1);
      setVotesLeft(remaining);
      setToastMessage(`투표를 취소했어요 · ${remaining}/${MAX_VOTES}`);
      setToastVisible(true);
      return;
    }

    if (votesLeft <= 0) return;
    voteHaptic();
    setVoteEntries((prev) => prev.map((e) => (e.id === id ? { ...e, voted: true, votes: e.votes + 1 } : e)));
    setVotedAtLabel((prev) => ({ ...prev, [id]: '오늘 14:20' }));
    const remaining = votesLeft - 1;
    setVotesLeft(remaining);
    setToastMessage(`${target.author} 님에게 투표했어요 · ${remaining}/${MAX_VOTES}`);
    setToastVisible(true);
  };

  const myVoteEntries: MyVoteEntry[] = voteEntries
    .filter((entry) => entry.voted)
    .map((entry) => ({
      id: entry.id,
      author: entry.author,
      spotLabel: entry.spot ?? '',
      votedAtLabel: votedAtLabel[entry.id] ?? '방금',
      gradient: entry.gradient,
    }));

  const deleteMyEntry = (id: string) => setMyEntries((prev) => prev.filter((e) => e.id !== id));

  return (
    <View style={{ flex: 1 }}>
      <View className="flex-row" style={{ paddingHorizontal: CONTENT_PADDING, gap: normalize(20), borderBottomWidth: 0.5, borderBottomColor: 'rgba(0,0,0,0.08)' }}>
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

      {subtab === 'active' && <DevStateSwitch options={SCENARIO_OPTIONS} value={scenario} onChange={setScenario} />}
      {subtab === 'mine' && (
        <DevStateSwitch
          options={[
            { key: 'has', label: '기록' },
            { key: 'none', label: '없음' },
          ]}
          value={mineHasHistory ? 'has' : 'none'}
          onChange={(key) => setMineHasHistory(key === 'has')}
        />
      )}
      {subtab === 'past' && (
        <DevStateSwitch
          options={[
            { key: 'has', label: '회차' },
            { key: 'none', label: '없음' },
          ]}
          value={pastHasItems ? 'has' : 'none'}
          onChange={(key) => setPastHasItems(key === 'has')}
        />
      )}

      {subtab === 'active' && (
        <ContestActiveTab
          phase={phase}
          contest={phase === 'RESULT' ? NEXT_CONTEST : SUBMIT_CONTEST}
          lastMonthAward={LAST_MONTH_AWARD}
          submitFeed={emptyFeed ? [] : phase === 'RESULT' ? RESULT_DAY_FEED : SUBMIT_FEED}
          voteEntries={sortedVoteEntries}
          sort={voteSort}
          onChangeSort={setVoteSort}
          rankHistory={rankHistory}
          votesLeft={votesLeft}
          maxVotes={MAX_VOTES}
          myEntryCount={myEntries.length}
          maxEntries={MAX_ENTRIES}
          nextContest={NEXT_CONTEST}
          nextScheduled={scenario !== 'none7b'}
          subscribed={subscribed}
          pastItems={PAST_ITEMS}
          onVote={toggleVote}
          onOpenEntry={onOpenEntry}
          onOpenSubmit={openSubmit}
          onSeeAll={() => onSeeAllEntries(submitTargetParams)}
          onOpenMyVotes={() => setMyVotesSheetVisible(true)}
          onOpenMyEntries={() => setMyEntriesSheetVisible(true)}
          onSelectPastItem={onSelectPastItem}
          onSeeAllPast={() => setSubtab('past')}
          onSubscribe={() => {
            // 탭하면 즉시 토글된다 — 별도 시트나 확인 다이얼로그를 두지 않는다(목업 subscribeContest)
            setSubscribed((prev) => !prev);
            setToastMessage(subscribed ? '알림을 껐어요' : '시작하면 알려드릴게요');
            setToastVisible(true);
          }}
        />
      )}
      {subtab === 'mine' && (
        <ContestMyEntryTab
          phase={phase}
          contest={SUBMIT_CONTEST}
          entryCount={myEntries.length}
          maxEntries={MAX_ENTRIES}
          hasHistory={mineHasHistory}
          onOpenSubmit={openSubmit}
          onOpenResult={onOpenResult}
        />
      )}
      {subtab === 'past' && <ContestPastTab items={pastHasItems ? PAST_ITEMS : []} onSelectItem={onSelectPastItem} />}

      <Toast message={toastMessage} visible={toastVisible} onHide={() => setToastVisible(false)} />

      <MyVotesSheet
        visible={myVotesSheetVisible}
        onClose={() => setMyVotesSheetVisible(false)}
        entries={myVoteEntries}
        votesLeft={votesLeft}
        maxVotes={MAX_VOTES}
        onCancelVote={toggleVote}
        onOpenEntry={onOpenEntry}
      />

      <MyEntriesSheet
        visible={myEntriesSheetVisible}
        onClose={() => setMyEntriesSheetVisible(false)}
        phase={phase}
        contest={SUBMIT_CONTEST}
        maxEntries={MAX_ENTRIES}
        entries={myEntries}
        onDelete={deleteMyEntry}
        onOpenSubmit={openSubmit}
      />
    </View>
  );
}
