import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, ChevronRight, MapPin, Share as ShareIcon } from 'lucide-react-native';
import Toast from '@/components/common/Toast';
import ContestPhoto from '@/components/community/ContestPhoto';
import { useContestResult } from '@/hooks/useContest';
import { mapResultEntry, monthLabel as toMonthLabel } from '@/utils/contestMappers';
import { CommunityDetailStackParamList } from '@/navigation/stacks/CommunityDetailStack';
import type { RootStackParamList } from '@/navigation';
import { ContestPhotoEntry } from '@/types/community';
import { CARD_RADIUS, CONTENT_PADDING, FONT_2XS, FONT_LG, FONT_MD, FONT_SM, FONT_XL, FONT_XS, HAIRLINE_WIDTH, HEADER_HEIGHT } from '@/constants/layout';
import { shareContent } from '@/utils/share';
import { normalize, normalizeFontSize, normalizeHeight } from '@/utils/normalize';
import { awardHaptic } from '@/utils/haptics';
import { BRAND, BRAND_MUTED, BRAND_TINT, CARD, HAIRLINE } from '@/constants/colors';

/**
 * 콘테스트 결과 — 목업 contest-result.html 1:1. 시안 10b(수상작 상세)·10d(축하)·10f(순위권 밖).
 * 고정 바 없음 — 탭바와 두 겹이면 150px가 잠기므로 "전체 순위 보기"는 리스트 마지막 행(rowlink)이다.
 *
 * "출품했지만 3위 밖"은 10f(분포 바)로 확정 — 같은 케이스를 다루던 10a(한 줄 요약)는 미채택.
 */

const ACCENT = BRAND;
const SURFACE = CARD;
const SUB = '#8e8e93';

export default function ContestResultScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<CommunityDetailStackParamList & RootStackParamList>>();
  const route = useRoute<RouteProp<CommunityDetailStackParamList, 'ContestResult'>>();
  const contestId = route.params.contestId;

  const resultQuery = useContestResult(contestId);
  const result = resultQuery.data ?? null;

  const [detailEntry, setDetailEntry] = useState<ContestPhotoEntry | null>(null);
  const [toastMessage, setToastMessage] = useState('');
  const [toastVisible, setToastVisible] = useState(false);

  // 진입 경로가 넘겨준 값은 조회가 끝나기 전 첫 페인트에만 쓴다 — 서버 값이 오면 그쪽이 이긴다
  const monthLabel = toMonthLabel(result?.submitStartAt) || route.params.monthLabel || '';
  const participantCount = result?.participantCount ?? 0;
  const totalVotes = result?.totalVoteCount ?? 0;
  const myRank = result ? result.myResult?.rank ?? null : route.params.myRank ?? null;
  const myVotes = result?.myResult?.voteCount ?? 0;

  const winner = useMemo(() => (result?.winner ? mapResultEntry(result.winner) : null), [result]);
  const rankList = useMemo(() => (result?.rankings ?? []).map(mapResultEntry), [result]);
  const podium23 = useMemo(() => rankList.filter((entry) => entry.rank === 2 || entry.rank === 3), [rankList]);
  const myEntry = useMemo(() => (result?.myResult ? mapResultEntry(result.myResult) : null), [result]);
  const myEntryMeta = result?.myResult
    ? [result.myResult.spotName, `${result.myResult.voteCount}표`].filter(Boolean).join(' · ')
    : '';

  const isAward = myRank != null && myRank <= 3;

  const handleShare = async () => {
    const ok = await shareContent({
      title: `${monthLabel} 콘테스트 결과`,
      message: [myRank != null ? `${monthLabel} 콘테스트 ${myRank}위` : `${monthLabel} 콘테스트`, myEntryMeta]
        .filter(Boolean)
        .join('\n'),
    });
    // 성공 토스트는 띄우지 않는다 — Android는 취소해도 성공으로 오므로 거짓이 된다.
    if (!ok) {
      setToastMessage('공유 화면을 열지 못했어요');
      setToastVisible(true);
    }
  };

  // 수상일 때만 진입 축하 — 컨페티·모달은 쓰지 않는다는 결정(ui-publishing.md)에 맞춰
  // 햅틱 한 번과 카드 등장 애니메이션으로만 표현한다. 시뮬레이터에선 햅틱이 나지 않는다.
  useEffect(() => {
    if (isAward) awardHaptic();
  }, [isAward]);

  // 수상작 상세(10b)는 별도 라우트가 아니라 이 화면 안의 상태다 — 그대로 두면 iOS 스와이프·안드로이드
  // 하드웨어 백이 결과 화면째로 빠져나간다. 상세가 열려 있는 동안엔 pop을 가로채 상세만 닫는다.
  useEffect(() => {
    if (!detailEntry) return;
    return navigation.addListener('beforeRemove', (e) => {
      e.preventDefault();
      setDetailEntry(null);
    });
  }, [navigation, detailEntry]);

  if (detailEntry) {
    return (
      <EntryDetailView
        entry={detailEntry}
        monthLabel={monthLabel}
        onBack={() => setDetailEntry(null)}
        onOpenSpot={
          detailEntry.spotId != null
            ? () => navigation.navigate('SpotStack', { screen: 'SpotDetail', params: { spotId: String(detailEntry.spotId) } })
            : undefined
        }
      />
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'left', 'right', 'bottom']}>
      <View className="flex-row items-center" style={{ height: HEADER_HEIGHT, paddingLeft: normalize(12), paddingRight: CONTENT_PADDING, gap: normalize(4) }}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8} accessibilityRole="button" accessibilityLabel="뒤로" className="items-center justify-center" style={{ width: normalize(40), height: normalize(40) }}>
          <ChevronLeft size={normalize(22)} color="#000" strokeWidth={2} />
        </Pressable>
        <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_LG, letterSpacing: -0.4, color: '#000' }}>
          {`${monthLabel} 수상작`}
        </Text>
        <Text allowFontScaling={false} style={{ marginLeft: 'auto', fontFamily: 'Pretendard-Regular', fontSize: FONT_SM, letterSpacing: -0.2, color: SUB }}>
          {`${participantCount}명 · ${totalVotes}표`}
        </Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: normalize(28) }}>
        {isAward ? (
          <View style={{ margin: normalize(18), marginHorizontal: CONTENT_PADDING, padding: normalize(20), borderRadius: normalize(20), backgroundColor: BRAND_TINT }}>
            {/* 등수 배지와 축하 문구는 같은 행 — 카드 안쪽 294px에 들어가야 해서 문구는 FONT_MD */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: normalize(8) }}>
              <Animated.View entering={ZoomIn.delay(120).duration(320)} style={{ height: normalize(24), paddingHorizontal: normalize(10), borderRadius: normalize(12), backgroundColor: ACCENT, alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_XS, letterSpacing: -0.1, color: '#fff' }}>
                  {`${myRank}위`}
                </Text>
              </Animated.View>
              <Text allowFontScaling={false} numberOfLines={1} style={{ flex: 1, minWidth: 0, fontFamily: 'Pretendard-SemiBold', fontSize: FONT_MD, letterSpacing: -0.3, color: '#000' }}>
                {`축하해요, ${monthLabel}의 ${myRank}위예요`}
              </Text>
            </View>
            <Animated.View entering={FadeInDown.delay(200).duration(360)} style={{ width: '100%', marginTop: normalize(14), aspectRatio: 294 / 196 }}>
              {/* 여긴 우승작이 아니라 "내" 출품작이다 — 축하 카드니까 */}
              <ContestPhoto
                gradient={myEntry?.gradient ?? ['#1a1530', '#5a3355', '#d4856a']}
                photoUrl={myEntry?.photoUrl}
                radius={normalize(14)}
                style={{ width: '100%', height: '100%' }}
              />
            </Animated.View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: normalize(12), marginTop: normalize(12) }}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_MD, letterSpacing: -0.3, color: '#000' }}>
                  {`${myVotes}표`}
                </Text>
                <Text allowFontScaling={false} numberOfLines={1} style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_XS, letterSpacing: -0.1, color: SUB, marginTop: normalize(3) }}>
                  {myEntryMeta}
                </Text>
              </View>
              <Pressable onPress={handleShare} style={{ height: normalize(40), paddingHorizontal: normalize(18), borderRadius: normalize(20), backgroundColor: ACCENT, flexDirection: 'row', alignItems: 'center', gap: normalize(6), flexShrink: 0 }}>
                <ShareIcon size={normalize(16)} color="#fff" strokeWidth={2} />
                <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_SM, letterSpacing: -0.2, color: '#fff' }}>
                  공유
                </Text>
              </Pressable>
            </View>
          </View>
        ) : (
          // 출품하지 않은 달이면 이 카드를 감춘다
          myRank != null && <ContestResultOutrank rank={myRank} totalCount={participantCount} votes={myVotes} />
        )}

        {!isAward && (
          <>
            <Text allowFontScaling={false} style={{ paddingHorizontal: CONTENT_PADDING, paddingTop: normalize(24), paddingBottom: normalize(12), fontFamily: 'Pretendard-SemiBold', fontSize: FONT_XL, letterSpacing: -0.7, color: '#000' }}>
              최종 순위
            </Text>

            {winner && (
            <Pressable onPress={() => setDetailEntry(winner)} style={{ marginHorizontal: CONTENT_PADDING, borderRadius: CARD_RADIUS, overflow: 'hidden', backgroundColor: SURFACE }}>
              <View style={{ position: 'relative', aspectRatio: 334 / 220 }}>
                <ContestPhoto gradient={winner.gradient} photoUrl={winner.photoUrl} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
                <View style={{ position: 'absolute', top: normalize(12), left: normalize(12), height: normalize(24), paddingHorizontal: normalize(10), borderRadius: normalize(12), backgroundColor: ACCENT, alignItems: 'center', justifyContent: 'center' }}>
                  <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_XS, letterSpacing: -0.1, color: '#fff' }}>
                    {`1위 · ${winner.voteCount}표`}
                  </Text>
                </View>
              </View>
              <View style={{ padding: normalize(14), paddingBottom: normalize(13) }}>
                <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_MD, letterSpacing: -0.3, color: '#000' }}>
                  {winner.author.handle}
                </Text>
                <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_XS, letterSpacing: -0.1, color: SUB, marginTop: normalize(2) }}>
                  {winner.captionMeta}
                </Text>
              </View>
            </Pressable>
            )}

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: normalize(20), paddingHorizontal: CONTENT_PADDING, paddingTop: normalize(20) }}>
              {podium23.map((entry) => (
                <Pressable key={entry.id} onPress={() => setDetailEntry(entry)} style={{ width: '48%', borderRadius: CARD_RADIUS, overflow: 'hidden', backgroundColor: SURFACE }}>
                  <View style={{ position: 'relative', aspectRatio: 1 }}>
                    <ContestPhoto gradient={entry.gradient} photoUrl={entry.photoUrl} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
                    <View style={{ position: 'absolute', top: normalize(10), left: normalize(10), height: normalize(22), paddingHorizontal: normalize(8), borderRadius: normalize(11), backgroundColor: 'rgba(255,255,255,0.92)', alignItems: 'center', justifyContent: 'center' }}>
                      <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_2XS, letterSpacing: -0.1, color: '#000' }}>
                        {`${entry.rank}위`}
                      </Text>
                    </View>
                  </View>
                  <View style={{ paddingTop: normalize(9), paddingHorizontal: normalize(12), paddingBottom: normalize(11) }}>
                    <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_SM, letterSpacing: -0.2, color: '#000' }}>
                      {entry.author.handle}
                    </Text>
                    <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_XS, letterSpacing: -0.1, color: SUB, marginTop: normalize(2) }}>
                      {entry.captionMeta}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </View>
          </>
        )}

        {isAward && (
          <>
            <Text allowFontScaling={false} style={{ paddingHorizontal: CONTENT_PADDING, paddingTop: normalize(24), paddingBottom: normalize(12), fontFamily: 'Pretendard-SemiBold', fontSize: FONT_XL, letterSpacing: -0.7, color: '#000' }}>
              최종 순위
            </Text>
            <RankList entries={rankList} myRank={myRank} onPress={setDetailEntry} />
          </>
        )}

        {/* contestId 없이 열린 경로(아직 mock인 "내 출품" 탭)에서는 목록을 부를 수 없어 숨긴다 */}
        {contestId && (
        <Pressable
          onPress={() => navigation.navigate('ContestAllEntries', { contestId, mode: 'past' })}
          style={{ margin: normalize(24), marginTop: normalize(24), marginHorizontal: CONTENT_PADDING, height: normalize(56), paddingHorizontal: normalize(16), borderRadius: CARD_RADIUS, backgroundColor: SURFACE, flexDirection: 'row', alignItems: 'center', gap: normalize(8) }}
        >
          <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_MD, letterSpacing: -0.3, color: '#000' }}>
            전체 순위 보기
          </Text>
          <Text allowFontScaling={false} style={{ marginLeft: 'auto', fontFamily: 'Pretendard-Regular', fontSize: FONT_SM, letterSpacing: -0.2, color: SUB }}>
            {`${participantCount}명`}
          </Text>
          <ChevronRight size={normalize(18)} color="#c7c7cc" strokeWidth={2} />
        </Pressable>
        )}
      </ScrollView>

      <Toast message={toastMessage} visible={toastVisible} onHide={() => setToastVisible(false)} />
    </SafeAreaView>
  );
}

function RankList({ entries, myRank, onPress }: { entries: ContestPhotoEntry[]; myRank?: number | null; onPress: (entry: ContestPhotoEntry) => void }) {
  return (
    <View style={{ paddingHorizontal: CONTENT_PADDING }}>
      {entries.map((entry, index) => (
        <Pressable
          key={entry.id}
          onPress={() => onPress(entry)}
          style={{ height: normalize(68), flexDirection: 'row', alignItems: 'center', gap: normalize(12), borderTopWidth: index === 0 ? 0 : HAIRLINE_WIDTH, borderTopColor: HAIRLINE }}
        >
          <Text allowFontScaling={false} style={{ width: normalize(26), fontFamily: 'Pretendard-SemiBold', fontSize: FONT_MD, letterSpacing: -0.3, color: entry.rank === myRank ? ACCENT : '#000' }}>
            {entry.rank}
          </Text>
          <ContestPhoto gradient={entry.gradient} photoUrl={entry.photoUrl} radius={normalize(11)} style={{ width: normalize(44), height: normalize(44) }} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_SM, letterSpacing: -0.2, color: '#000' }}>
              {entry.author.handle}
            </Text>
            <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_XS, letterSpacing: -0.1, color: SUB, marginTop: normalize(2) }}>
              {entry.captionMeta}
            </Text>
          </View>
          <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_SM, letterSpacing: -0.2, color: '#000' }}>
            {`${entry.voteCount}표`}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

/** 수상작 상세(10b) — 출품작 상세(14g)와 같은 화면. 사진 위엔 뒤로가기만, 팔로우 버튼은 여기에만 있다. */
function EntryDetailView({ entry, monthLabel, onBack, onOpenSpot }: { entry: ContestPhotoEntry; monthLabel: string; onBack: () => void; /** 직접 입력한 장소면 스팟이 없어 undefined다 */ onOpenSpot?: () => void }) {
  const [following, setFollowing] = useState(false);
  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={{ height: normalizeHeight(470) }}>
          <ContestPhoto gradient={entry.gradient} photoUrl={entry.photoUrl} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
          <LinearGradient colors={['rgba(0,0,0,0.42)', 'rgba(0,0,0,0)']} style={{ position: 'absolute', top: 0, left: 0, right: 0, height: normalize(140) }} pointerEvents="none" />
          <SafeAreaView edges={['top']}>
            <Pressable onPress={onBack} hitSlop={8} accessibilityRole="button" accessibilityLabel="뒤로" style={{ margin: normalize(12), width: normalize(40), height: normalize(40), alignItems: 'center', justifyContent: 'center' }}>
              <ChevronLeft size={normalize(22)} color="#fff" strokeWidth={2} />
            </Pressable>
          </SafeAreaView>
        </View>

        <View style={{ padding: normalize(20), paddingHorizontal: CONTENT_PADDING, paddingBottom: normalize(28) }}>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: normalize(8) }}>
            <View style={{ height: normalize(24), paddingHorizontal: normalize(10), borderRadius: normalize(12), backgroundColor: BRAND_TINT, alignItems: 'center', justifyContent: 'center' }}>
              <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_XS, letterSpacing: -0.1, color: ACCENT }}>
                {`${monthLabel} ${entry.rank}위`}
              </Text>
            </View>
            <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_MD, letterSpacing: -0.3, color: ACCENT }}>
              {`${entry.voteCount}표`}
            </Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: normalize(10), marginTop: normalize(16) }}>
            <View style={{ width: normalize(40), height: normalize(40), borderRadius: normalize(20), backgroundColor: entry.gradient[0], flexShrink: 0 }} />
            {/* flex: 1이 없으면 minWidth: 0은 무의미하다 — 긴 핸들이 내재 폭으로 커져 팔로우 버튼을 화면 밖으로 민다 */}
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text allowFontScaling={false} numberOfLines={1} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_MD, letterSpacing: -0.3, color: '#000' }}>
                {entry.author.handle}
              </Text>
              <Text allowFontScaling={false} numberOfLines={1} style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_XS, letterSpacing: -0.1, color: SUB, marginTop: normalize(2) }}>
                {entry.captionMeta}
              </Text>
            </View>
            <Pressable
              onPress={() => setFollowing((v) => !v)}
              style={{ marginLeft: 'auto', height: normalize(32), paddingHorizontal: normalize(16), borderRadius: normalize(16), backgroundColor: following ? SURFACE : ACCENT, alignItems: 'center', justifyContent: 'center' }}
            >
              <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_SM, letterSpacing: -0.2, color: following ? '#000' : '#fff' }}>
                {following ? '팔로잉' : '팔로우'}
              </Text>
            </Pressable>
          </View>

          {entry.caption && (
            <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_MD, lineHeight: FONT_MD * 1.6, letterSpacing: -0.25, color: '#000', marginTop: normalize(16) }}>
              {entry.caption}
            </Text>
          )}

          <View style={{ height: 1, backgroundColor: 'rgba(0,0,0,0.06)', marginVertical: normalize(18) }} />

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: normalize(8) }}>
            <MapPin size={normalize(17)} color={SUB} strokeWidth={1.8} />
            <Text allowFontScaling={false} numberOfLines={1} style={{ flex: 1, minWidth: 0, fontFamily: 'Pretendard-Regular', fontSize: FONT_MD, letterSpacing: -0.25, color: '#000' }}>
              {entry.spotName}
            </Text>
            {/* 스팟 DB에 없는 장소(직접 입력)는 넘어갈 상세가 없다 */}
            {onOpenSpot && (
              <Pressable onPress={onOpenSpot}>
                <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_SM, letterSpacing: -0.2, color: ACCENT }}>
                  스팟 보기
                </Text>
              </Pressable>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

/**
 * 10f — 4위 이하 결과 카드(분포 바 포함). 공유 버튼은 두지 않는다 — 42위를 공유하라고 권하는 건 무례하다.
 * 순위가 떨어진 달이어도 deltaLabel은 사실만 적고 빨강으로 강조하지 않는다(ui-publishing.md).
 */
function ContestResultOutrank({ rank, totalCount, votes, deltaLabel }: { rank: number; totalCount: number; votes: number; deltaLabel?: string }) {
  // totalCount가 0이면 width가 NaN%가 되어 바가 사라진다
  const percentile = totalCount > 0 ? Math.round((rank / totalCount) * 100) : 0;
  return (
    <View style={{ margin: normalize(18), marginHorizontal: CONTENT_PADDING, padding: normalize(14), paddingHorizontal: normalize(16), borderRadius: CARD_RADIUS, backgroundColor: SURFACE }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: normalize(12) }}>
        <View style={{ width: normalize(48), height: normalize(48), borderRadius: normalize(12), backgroundColor: '#12333a', flexShrink: 0 }} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_XS, letterSpacing: -0.1, color: SUB }}>
            내 출품작
          </Text>
          <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_LG, letterSpacing: -0.4, color: '#000' }}>
            {`${rank}위`}
          </Text>
        </View>
        {/* 목업 .outrank__meta는 --font-base(14px) — 상수가 없는 유일한 크기 */}
        <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: normalizeFontSize(14), letterSpacing: -0.2, color: SUB }}>
          {`${totalCount}명 중 · ${votes}표`}
        </Text>
      </View>

      {/* 왼쪽이 1위, 오른쪽이 꼴찌. 채운 구간 끝에 점을 찍어 내 위치를 정확히 가리킨다 */}
      <View style={{ position: 'relative', height: normalize(8), borderRadius: normalize(4), backgroundColor: '#e6e6ea', marginTop: normalize(16) }}>
        <View style={{ width: `${percentile}%`, height: '100%', borderRadius: normalize(4), backgroundColor: BRAND_MUTED }} />
        <View style={{ position: 'absolute', left: `${percentile}%`, marginLeft: -normalize(4), top: 0, width: normalize(8), height: normalize(8), borderRadius: normalize(4), backgroundColor: ACCENT }} />
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: normalize(8), marginTop: normalize(10) }}>
        <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_XS, letterSpacing: -0.1, color: SUB }}>
          {`상위 ${percentile}% · 1위 ← → ${totalCount}위`}
        </Text>
        {deltaLabel && (
          <Text allowFontScaling={false} style={{ marginLeft: 'auto', fontFamily: 'Pretendard-Regular', fontSize: FONT_XS, letterSpacing: -0.1, color: SUB }}>
            {deltaLabel}
          </Text>
        )}
      </View>
    </View>
  );
}
