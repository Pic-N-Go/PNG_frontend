import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Camera, Check, ChevronLeft, ChevronRight, CircleAlert, Image as ImageIcon, RotateCw, ThumbsUp } from 'lucide-react-native';
import MyVotesSheet from '@/components/community/MyVotesSheet';
import ContestPhoto from '@/components/community/ContestPhoto';
import Toast from '@/components/common/Toast';
import { toErrorMessage } from '@/api/auth';
import { useContestById, useContestEntryPages, useMyContestVotes, useToggleVote } from '@/hooks/useContest';
import { dayLabel, mapContestEntry, mapMyVotes } from '@/utils/contestMappers';
import { CommunityDetailStackParamList } from '@/navigation/stacks/CommunityDetailStack';
import { ContestEntry, ContestSortKey, MyVoteEntry } from '@/types/community';
import type { ContestSortApi } from '@/types/contest';
import { BUTTON_RADIUS, CARD_RADIUS, CONTENT_PADDING, FONT_2XS, FONT_LG, FONT_MD, FONT_SM, FONT_XS, HAIRLINE_WIDTH, HEADER_HEIGHT } from '@/constants/layout';
import { normalize } from '@/utils/normalize';
import { voteHaptic } from '@/utils/haptics';
import { BRAND, BRAND_TINT, CARD, HAIRLINE } from '@/constants/colors';

/**
 * 콘테스트 > 전체 출품작 목록 — 목업 contest-all-entries.html 1:1, 두 가지 용도로 쓰인다.
 * (1) 투표 기간(1a·1c·1d·1e): 정렬 최신순(기본)·득표순 2종, 순위·득표수 비공개, 투표 28px 원형 버튼
 * (2) 지난 콘테스트(1b): route.params.mode === 'past' — 결과가 확정된 뒤라 순위 배지·득표수를 노출하고
 *     투표 UI는 없다(그 자리에 마감일). ContestResultScreen의 "전체 보기"에서 이 모드로 들어온다.
 */

const PINK = BRAND;
const INK = '#000000';
const FILL = CARD;
const GRAY_DISABLED = '#c7c7cc';
const GRAY_SUB = '#8e8e93';
const GRAY_SPENT = '#e6e6ea';
const GRAY_SPENT_ICON = '#b8b8be';

const GAP = 20;

const SORTS: { key: ContestSortKey; label: string }[] = [
  { key: 'latest', label: '최신순' },
  { key: 'votes', label: '득표순' },
];

/* ── 투표 버튼 (28px 원형) ─────────────────────────────── */

function VoteButton({ voted, disabled, onPress }: { voted: boolean; disabled: boolean; onPress: () => void }) {
  // 이미 투표한 카드는 표가 없어도 눌러서 취소할 수 있어야 한다 — 막히는 건 "표가 없는데 새로 투표"뿐이다.
  const spent = disabled && !voted;
  return (
    <Pressable
      onPress={onPress}
      disabled={spent}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={voted ? '투표함' : '투표'}
      className="items-center justify-center"
      style={{
        width: normalize(28),
        height: normalize(28),
        borderRadius: normalize(14),
        flexShrink: 0,
        backgroundColor: voted ? BRAND_TINT : spent ? GRAY_SPENT : PINK,
      }}
    >
      {voted ? (
        <Check size={normalize(14)} color={PINK} strokeWidth={2.6} />
      ) : (
        <ThumbsUp size={normalize(15)} color={spent ? GRAY_SPENT_ICON : '#fff'} strokeWidth={1.9} />
      )}
    </Pressable>
  );
}

/* ── 카드 ─────────────────────────────────────────────── */

function EntryCard({
  item,
  width,
  mode,
  votesLeft,
  onVote,
  onPress,
}: {
  item: ContestEntry;
  width: number;
  mode: 'voting' | 'past';
  votesLeft: number;
  onVote: (id: string) => void;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={{ width, borderRadius: CARD_RADIUS, overflow: 'hidden', backgroundColor: FILL }}>
      {/* 투표 기간에는 사진 위에 아무것도 얹지 않는다. 지난 콘테스트만 순위 배지 예외 */}
      <View style={{ width: '100%', aspectRatio: 1, backgroundColor: '#ededf1' }}>
        <ContestPhoto gradient={item.gradient} photoUrl={item.photoUrl} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
        {mode === 'past' && item.rank != null && (
          <View
            className="items-center justify-center"
            style={{ position: 'absolute', top: normalize(10), left: normalize(10), height: normalize(22), paddingHorizontal: normalize(8), borderRadius: normalize(11), backgroundColor: 'rgba(255,255,255,0.92)' }}
          >
            <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_2XS, letterSpacing: -0.1, color: INK }}>
              {`${item.rank}위`}
            </Text>
          </View>
        )}
      </View>
      <View className="flex-row items-center" style={{ paddingTop: normalize(9), paddingHorizontal: normalize(12), paddingBottom: normalize(11), gap: normalize(8) }}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text allowFontScaling={false} numberOfLines={1} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_SM, letterSpacing: -0.2, color: INK }}>
            {item.author}
          </Text>
          <Text allowFontScaling={false} numberOfLines={1} style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_XS, letterSpacing: -0.1, color: GRAY_SUB, marginTop: normalize(2) }}>
            {mode === 'past'
              ? [`${item.votes}표`, item.spot].filter(Boolean).join(' · ')
              : [item.spot, item.shotAtLabel].filter(Boolean).join(' · ')}
          </Text>
        </View>
        {/* 내 출품작에는 투표할 수 없다 — 서버도 거절하므로 버튼 대신 표시만 남긴다 */}
        {mode === 'voting' &&
          (item.isMine ? (
            <Text allowFontScaling={false} style={{ flexShrink: 0, fontFamily: 'Pretendard-Medium', fontSize: FONT_2XS, letterSpacing: -0.1, color: GRAY_SUB }}>
              내 작품
            </Text>
          ) : (
            <VoteButton voted={item.voted} disabled={votesLeft <= 0} onPress={() => onVote(item.id)} />
          ))}
      </View>
    </Pressable>
  );
}

function SkeletonCard({ width }: { width: number }) {
  return (
    <View style={{ width, borderRadius: CARD_RADIUS, overflow: 'hidden', backgroundColor: FILL, opacity: 0.7 }}>
      <View style={{ width: '100%', aspectRatio: 1, backgroundColor: '#ededf1' }} />
      <View style={{ paddingTop: normalize(9), paddingHorizontal: normalize(12), paddingBottom: normalize(11) }}>
        <View style={{ height: normalize(10), borderRadius: normalize(5), backgroundColor: GRAY_SPENT }} />
        <View style={{ height: normalize(10), width: '60%', borderRadius: normalize(5), backgroundColor: GRAY_SPENT, marginTop: normalize(6) }} />
      </View>
    </View>
  );
}

/* ── 빈 상태 · 에러 ────────────────────────────────────── */

function Placeholder({
  icon,
  title,
  desc,
  ctaLabel,
  ctaIcon,
  ctaAccent,
  onPressCta,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  ctaLabel: string;
  ctaIcon: React.ReactNode;
  ctaAccent?: boolean;
  /** 없으면 CTA를 렌더하지 않는다 — 누를 수 없는 버튼을 보여주지 않는다 */
  onPressCta?: () => void;
}) {
  return (
    // 네비 아래 영역의 기하학적 중앙은 화면 전체로 보면 아래로 치우친다 — paddingBottom만큼 끌어올려 시각 중앙에 맞춘다
    <View className="flex-1 items-center justify-center" style={{ paddingHorizontal: CONTENT_PADDING, paddingBottom: normalize(96) }}>
      <View className="items-center justify-center" style={{ width: normalize(56), height: normalize(56), borderRadius: normalize(28), backgroundColor: FILL, marginBottom: normalize(14) }}>
        {icon}
      </View>
      <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_MD, letterSpacing: -0.3, color: INK, marginTop: normalize(4) }}>
        {title}
      </Text>
      <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_SM, letterSpacing: -0.2, color: GRAY_SUB, marginTop: normalize(6) }}>
        {desc}
      </Text>
      {onPressCta && (
        <Pressable
          onPress={onPressCta}
          accessibilityRole="button"
          accessibilityLabel={ctaLabel}
          className="flex-row items-center"
          style={{ height: normalize(44), paddingHorizontal: normalize(22), borderRadius: BUTTON_RADIUS, marginTop: normalize(20), gap: normalize(6), backgroundColor: ctaAccent ? PINK : FILL }}
        >
          {ctaIcon}
          <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_SM, letterSpacing: -0.2, color: ctaAccent ? '#fff' : INK }}>
            {ctaLabel}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

/* ── 화면 ─────────────────────────────────────────────── */

export default function ContestAllEntriesScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<CommunityDetailStackParamList>>();
  const route = useRoute<RouteProp<CommunityDetailStackParamList, 'ContestAllEntries'>>();
  const contestId = route.params.contestId;
  const mode = route.params.mode ?? 'voting';
  const submitTarget = route.params.submitTarget;

  const [sort, setSort] = useState<ContestSortKey>('latest');
  // 지난 콘테스트는 결과가 확정돼 기본이 득표순이다(투표 기간과 기본값이 반대)
  const [pastSort, setPastSort] = useState<'ranked' | 'latest'>('ranked');
  const [toastMessage, setToastMessage] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const [gridWidth, setGridWidth] = useState(0);
  const [myVotesSheetVisible, setMyVotesSheetVisible] = useState(false);

  const apiSort: ContestSortApi = mode === 'past' ? (pastSort === 'ranked' ? 'votes' : 'latest') : sort;

  const contestQuery = useContestById(contestId);
  const entriesQuery = useContestEntryPages(contestId, apiSort);
  const voteMutation = useToggleVote(contestId);
  const myVotesQuery = useMyContestVotes(contestId, myVotesSheetVisible);

  const contest = contestQuery.data ?? null;
  const maxVotes = contest?.voteLimit ?? 0;
  const votesLeft = contest?.remainingVoteCount ?? 0;

  const entries = useMemo(
    () => (entriesQuery.data?.pages ?? []).flatMap((page) => page.entries).map(mapContestEntry),
    [entriesQuery.data],
  );
  const myVoteEntries: MyVoteEntry[] = useMemo(
    () => (myVotesQuery.data ? mapMyVotes(myVotesQuery.data) : []),
    [myVotesQuery.data],
  );

  // 헤더 숫자는 페이지 응답이 먼저다 — 회차 응답의 entryCount와 같은 값이지만 목록과 함께 갱신된다
  const totalCount = entriesQuery.data?.pages[0]?.totalElements ?? contest?.entryCount ?? 0;

  const showToast = (message: string) => {
    setToastMessage(message);
    setToastVisible(true);
  };

  const openEntry = useCallback(
    (id: string) => navigation.navigate('ContestEntryDetail', { contestId, entryId: id, isEnded: mode === 'past' }),
    [navigation, contestId, mode],
  );

  // 투표 취소는 투표 기간 내 자유 — 완료 버튼을 다시 누르면 표 1개가 복구된다.
  const handleVote = useCallback(
    (id: string) => {
      const target = entries.find((entry) => entry.id === id);
      if (!target || voteMutation.isPending) return;
      if (target.isMine) return;
      // 막히는 건 "표가 없는데 새로 투표"뿐이다 — 이미 던진 표의 취소는 언제나 가능해야 한다
      if (!target.voted && votesLeft <= 0) return;

      voteHaptic();
      voteMutation.mutate(
        { entryId: id, voted: target.voted },
        {
          onSuccess: (data) =>
            showToast(
              target.voted
                ? `${target.author} 투표를 취소했어요 · ${data.remainingVoteCount}/${data.voteLimit}`
                : `${target.author} 님에게 투표했어요 · ${data.remainingVoteCount}/${data.voteLimit}`,
            ),
          onError: (err) => showToast(toErrorMessage(err, '투표에 실패했어요')),
        },
      );
    },
    [entries, votesLeft, voteMutation],
  );

  /**
   * 시트에서의 취소는 목록을 거치지 않는다 — 2페이지 이후 작품에 던진 표는
   * 아직 불러오지 않은 페이지에 있어 entries에서 못 찾는다.
   */
  const cancelVoteFromSheet = useCallback(
    (id: string) => {
      if (voteMutation.isPending) return;
      voteHaptic();
      voteMutation.mutate(
        { entryId: id, voted: true },
        {
          onSuccess: (data) => showToast(`투표를 취소했어요 · ${data.remainingVoteCount}/${data.voteLimit}`),
          onError: (err) => showToast(toErrorMessage(err, '투표 취소에 실패했어요')),
        },
      );
    },
    [voteMutation],
  );

  const cardWidth = gridWidth > 0 ? (gridWidth - normalize(GAP)) / 2 : 0;
  const spent = mode === 'voting' && maxVotes > 0 && votesLeft <= 0;

  const isPending = entriesQuery.isPending || contestQuery.isPending;
  const loadError = entriesQuery.error ?? contestQuery.error ?? null;
  const isEmpty = !isPending && !loadError && entries.length === 0;

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'left', 'right', 'bottom']}>
      {/* 네비 — 히어로 없이 타이틀 + 총 개수. 검색 없음 */}
      <View className="flex-row items-center" style={{ height: HEADER_HEIGHT, paddingLeft: normalize(12), paddingRight: normalize(20), gap: normalize(4) }}>
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="뒤로"
          className="items-center justify-center"
          style={{ width: normalize(40), height: normalize(40) }}
        >
          <ChevronLeft size={normalize(22)} color={INK} strokeWidth={2} />
        </Pressable>
        <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_LG, letterSpacing: -0.4, color: INK }}>
          전체 출품작
        </Text>
        {totalCount > 0 && (
          <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_LG, letterSpacing: -0.4, color: GRAY_DISABLED, marginLeft: normalize(6) }}>
            {totalCount}
          </Text>
        )}
      </View>

      {isPending && (
        <View className="flex-1 items-center justify-center" style={{ paddingBottom: normalize(96) }}>
          <ActivityIndicator color={PINK} />
        </View>
      )}

      {isEmpty && (
        <Placeholder
          icon={<ImageIcon size={normalize(24)} color={GRAY_SPENT_ICON} strokeWidth={1.7} />}
          title="아직 출품작이 없어요"
          desc={submitTarget ? `첫 번째로 ${submitTarget.theme} 사진을 올려보세요` : '첫 번째 출품작을 기다리고 있어요'}
          ctaLabel="출품하기"
          ctaIcon={<Camera size={normalize(16)} color="#fff" strokeWidth={1.9} />}
          ctaAccent
          // 남은 자리를 모르면 출품으로 보내지 않는다 — 화면이 기본값 3장으로 열려 상한이 무너진다
          onPressCta={submitTarget ? () => navigation.navigate('ContestSubmit', submitTarget) : undefined}
        />
      )}

      {loadError && (
        <Placeholder
          icon={<CircleAlert size={normalize(24)} color={GRAY_SPENT_ICON} strokeWidth={1.7} />}
          title="목록을 불러오지 못했어요"
          desc="네트워크 상태를 확인하고 다시 시도해주세요"
          ctaLabel="다시 시도"
          ctaIcon={<RotateCw size={normalize(16)} color={INK} strokeWidth={1.9} />}
          onPressCta={() => {
            entriesQuery.refetch();
            contestQuery.refetch();
          }}
        />
      )}

      {!isPending && !isEmpty && !loadError && (
        <>
          {/* 정렬 바 — 칩(pill)이 아니라 배경 없는 텍스트 2개. 우측은 투표 기간엔 남은 표 pill, 지난 기간엔 마감일 */}
          <View className="flex-row items-center" style={{ paddingTop: normalize(6), paddingBottom: normalize(14), borderBottomWidth: HAIRLINE_WIDTH, borderBottomColor: HAIRLINE }}>
            <View className="flex-row items-center" style={{ height: normalize(34), paddingLeft: CONTENT_PADDING, gap: normalize(14) }}>
              {mode === 'voting'
                ? SORTS.map((option, index) => (
                    <React.Fragment key={option.key}>
                      {index > 0 && <View style={{ width: normalize(3), height: normalize(3), borderRadius: normalize(2), backgroundColor: '#dcdce0' }} />}
                      <Pressable onPress={() => setSort(option.key)} hitSlop={{ top: 12, bottom: 12 }} accessibilityRole="button" accessibilityLabel={option.label}>
                        <Text allowFontScaling={false} style={{ fontFamily: sort === option.key ? 'Pretendard-SemiBold' : 'Pretendard-Medium', fontSize: FONT_SM, letterSpacing: -0.2, color: sort === option.key ? INK : GRAY_SUB }}>
                          {option.label}
                        </Text>
                      </Pressable>
                    </React.Fragment>
                  ))
                : (['ranked', 'latest'] as const).map((key, index) => (
                    <React.Fragment key={key}>
                      {index > 0 && <View style={{ width: normalize(3), height: normalize(3), borderRadius: normalize(2), backgroundColor: '#dcdce0' }} />}
                      <Pressable onPress={() => setPastSort(key)} hitSlop={{ top: 12, bottom: 12 }} accessibilityRole="button" accessibilityLabel={key === 'ranked' ? '득표순' : '최신순'}>
                        <Text allowFontScaling={false} style={{ fontFamily: pastSort === key ? 'Pretendard-SemiBold' : 'Pretendard-Medium', fontSize: FONT_SM, letterSpacing: -0.2, color: pastSort === key ? INK : GRAY_SUB }}>
                          {key === 'ranked' ? '득표순' : '최신순'}
                        </Text>
                      </Pressable>
                    </React.Fragment>
                  ))}
            </View>
            <View style={{ flex: 1 }} />
            {mode === 'voting' ? (
              <Pressable
                onPress={() => setMyVotesSheetVisible(true)}
                className="flex-row items-center"
                style={{ height: normalize(32), paddingLeft: normalize(12), paddingRight: normalize(10), marginRight: CONTENT_PADDING, borderRadius: normalize(16), backgroundColor: FILL, gap: normalize(8) }}
              >
                <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_SM, letterSpacing: -0.2, color: spent ? GRAY_DISABLED : GRAY_SUB }}>
                  남은 표
                </Text>
                <View className="flex-row items-center" style={{ gap: normalize(4) }}>
                  {Array.from({ length: maxVotes }).map((_, i) => (
                    <View key={i} style={{ width: normalize(7), height: normalize(7), borderRadius: normalize(4), backgroundColor: i < votesLeft ? PINK : GRAY_SPENT }} />
                  ))}
                </View>
                <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_SM, letterSpacing: -0.2, color: spent ? GRAY_DISABLED : INK }}>
                  {votesLeft}/{maxVotes}
                </Text>
                <ChevronRight size={normalize(14)} color="#c7c7cc" strokeWidth={2} />
              </Pressable>
            ) : (
              <Text allowFontScaling={false} style={{ paddingRight: CONTENT_PADDING, fontFamily: 'Pretendard-Regular', fontSize: FONT_SM, letterSpacing: -0.2, color: GRAY_SUB }}>
                {contest ? `${dayLabel(contest.voteEndAt)} 종료` : ''}
              </Text>
            )}
          </View>

          <FlatList
            data={entries}
            keyExtractor={(item) => item.id}
            numColumns={2}
            columnWrapperStyle={{ justifyContent: 'space-between' }}
            contentContainerStyle={{ paddingHorizontal: CONTENT_PADDING, paddingTop: normalize(20), paddingBottom: normalize(28), rowGap: normalize(GAP) }}
            onLayout={(e) => setGridWidth(e.nativeEvent.layout.width - CONTENT_PADDING * 2)}
            showsVerticalScrollIndicator={false}
            onEndReachedThreshold={0.4}
            onEndReached={() => {
              if (entriesQuery.hasNextPage && !entriesQuery.isFetchingNextPage) entriesQuery.fetchNextPage();
            }}
            ListHeaderComponent={
              spent ? (
                // 카드 전체를 흐리지 않는다 — 사진 감상이 목적인 화면이라 목록이 죽어 보인다.
                <View style={{ padding: normalize(12), borderRadius: normalize(12), backgroundColor: FILL, marginBottom: normalize(20) }}>
                  <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_XS, lineHeight: FONT_XS * 1.5, letterSpacing: -0.15, color: 'rgba(0,0,0,0.45)' }}>
                    표 {maxVotes}개를 모두 썼어요. 투표를 취소하면 다시 쓸 수 있어요
                  </Text>
                </View>
              ) : null
            }
            renderItem={({ item }) =>
              cardWidth > 0 ? (
                <EntryCard item={item} width={cardWidth} mode={mode} votesLeft={votesLeft} onVote={handleVote} onPress={() => openEntry(item.id)} />
              ) : (
                <SkeletonCard width={cardWidth || 1} />
              )
            }
            ListFooterComponent={
              entriesQuery.isFetchingNextPage ? (
                <ActivityIndicator color={PINK} style={{ paddingTop: normalize(24) }} />
              ) : entriesQuery.hasNextPage ? null : (
                <Text
                  allowFontScaling={false}
                  style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_XS, letterSpacing: -0.1, color: GRAY_DISABLED, textAlign: 'center', paddingTop: normalize(24) }}
                >
                  {`출품작 ${totalCount}개를 모두 봤어요`}
                </Text>
              )
            }
          />
        </>
      )}

      {mode === 'voting' && (
        <MyVotesSheet
          visible={myVotesSheetVisible}
          onClose={() => setMyVotesSheetVisible(false)}
          entries={myVoteEntries}
          votesLeft={votesLeft}
          maxVotes={maxVotes}
          onCancelVote={cancelVoteFromSheet}
          onOpenEntry={openEntry}
        />
      )}

      <Toast message={toastMessage} visible={toastVisible} onHide={() => setToastVisible(false)} />
    </SafeAreaView>
  );
}
