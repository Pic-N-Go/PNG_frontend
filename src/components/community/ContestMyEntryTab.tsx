import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import Svg, { Circle, Polyline } from 'react-native-svg';
import { ContestInfo, ContestPhase } from '@/types/community';
import { CONTENT_PADDING, FONT_2XS, FONT_MD, FONT_SM, FONT_XL, FONT_XS } from '@/constants/layout';
import { normalize } from '@/utils/normalize';

/**
 * 콘테스트 > 내 출품 — 시안 8a(기록 있음)·8b(기록 없음). 캡션 수정·출품 취소는 폐기됐고
 * (사진·설명 수정 불가, 삭제는 진행중 탭 "내 출품작" 시트에서 처리), 이 탭은 순수 통계 화면이다.
 */

const ACCENT = '#E31B59';
const SURFACE = '#f5f5f7';

interface HistoryItem {
  id: string;
  title: string;
  monthLabel: string;
  meta: string;
  badge: string;
  /** 집계 중이면 null — 표시 문자열(badge)에서 숫자를 파싱하지 않는다 */
  myRank: number | null;
  kind: 'award' | 'plain' | 'pending';
  gradient: [string, string, string];
}

// 회차가 월 단위라 메타는 월 표기로 시작한다. 투표 기간이거나 집계 전이면 순위 자리에 "집계 중".
const HISTORY: HistoryItem[] = [
  { id: 'h1', title: '골든아워', monthLabel: '8월', meta: '8월 · 투표 기간 · 9월 1일 발표', badge: '집계 중', myRank: null, kind: 'pending', gradient: ['#1a1530', '#5a3355', '#d4856a'] },
  { id: 'h2', title: '비 오는 날', monthLabel: '7월', meta: '7월 · 96명 중 · 41표', badge: '7위', myRank: 7, kind: 'plain', gradient: ['#241a33', '#8b4a6b', '#e8a87c'] },
  { id: 'h3', title: '밤하늘', monthLabel: '6월', meta: '6월 · 142명 중 · 68표', badge: '2위', myRank: 2, kind: 'award', gradient: ['#0f1f2e', '#3f5a6b', '#d9a882'] },
  { id: 'h4', title: '숲 산책', monthLabel: '5월', meta: '5월 · 65명 중 · 24표', badge: '18위', myRank: 18, kind: 'plain', gradient: ['#12333a', '#2f5f5a', '#8fae9b'] },
];

/**
 * 순위 추이 — 위가 1위, 아래로 갈수록 하위. 최근 6회.
 * viewBox는 목업의 `0 0 294 110`을 그대로 쓰되, x는 아래 X축 라벨 6등분 칸의 중앙(294/12의 홀수배)에
 * 둔다. 목업 좌표(18·73·128·183·238·276)는 마지막 간격만 38이라 점과 라벨이 최대 6% 어긋난다.
 * 양 끝 여백이 24.5로 균등해져 원(r=5.5)이 잘릴 일도 없다.
 */
const TREND_VIEW_W = 294;
const TREND_VIEW_H = 110;
const RANK_TREND: { x: number; y: number; monthLabel: string; theme: string }[] = [
  { x: 24.5, y: 84, monthLabel: '3월', theme: '안개' },
  { x: 73.5, y: 58, monthLabel: '4월', theme: '벚꽃' },
  { x: 122.5, y: 44, monthLabel: '5월', theme: '숲 산책' },
  { x: 171.5, y: 22, monthLabel: '6월', theme: '밤하늘' },
  { x: 220.5, y: 66, monthLabel: '7월', theme: '비 오는 날' },
  { x: 269.5, y: 38, monthLabel: '8월', theme: '골든아워' },
];
// 회차별 기록의 최고 순위(6월 밤하늘 2위)와 같은 지점을 가리켜야 한다
const BEST_RANK_INDEX = 3;

function HistoryRow({ item, onPress }: { item: HistoryItem; onPress: () => void }) {
  return (
    <Pressable
      onPress={item.kind === 'pending' ? undefined : onPress}
      disabled={item.kind === 'pending'}
      style={{ width: '100%', height: normalize(76), paddingHorizontal: CONTENT_PADDING, flexDirection: 'row', alignItems: 'center', gap: normalize(12) }}
    >
      <View style={{ width: normalize(56), height: normalize(56), borderRadius: normalize(13), backgroundColor: item.gradient[0], flexShrink: 0 }} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_MD, letterSpacing: -0.3, color: '#000' }}>
          {item.title}
        </Text>
        <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_XS, letterSpacing: -0.1, color: '#8e8e93', marginTop: normalize(3) }}>
          {item.meta}
        </Text>
      </View>
      <View
        style={{
          height: normalize(26),
          paddingHorizontal: normalize(10),
          borderRadius: normalize(13),
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          backgroundColor: item.kind === 'award' ? 'rgba(227,27,89,0.1)' : SURFACE,
        }}
      >
        <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_XS, letterSpacing: -0.1, color: item.kind === 'award' ? ACCENT : item.kind === 'pending' ? '#8e8e93' : '#000' }}>
          {item.badge}
        </Text>
      </View>
    </Pressable>
  );
}

interface Props {
  phase: ContestPhase;
  contest: ContestInfo;
  entryCount: number;
  maxEntries: number;
  /** 8b(기록 없음) 확인용 — 실제로는 서버가 준 기록 유무로 갈린다 */
  hasHistory: boolean;
  onOpenSubmit: () => void;
  onOpenResult: (monthLabel: string, myRank: number | null) => void;
}

export default function ContestMyEntryTab({ phase, contest, entryCount, maxEntries, hasHistory, onOpenSubmit, onOpenResult }: Props) {

  if (!hasHistory) {
    return (
      // flexGrow: 1 — 내용이 화면보다 짧을 때 빈 상태가 남은 공간을 차지해 세로 중앙에 설 수 있게 한다
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: normalize(24) }} showsVerticalScrollIndicator={false}>
        {entryCount < maxEntries && (
          <View style={{ margin: normalize(18), marginTop: normalize(18), marginHorizontal: CONTENT_PADDING, padding: normalize(20), borderRadius: normalize(20), backgroundColor: SURFACE }}>
            <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_XS, letterSpacing: -0.1, color: ACCENT }}>
              진행중 콘테스트
            </Text>
            <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_XL, letterSpacing: -0.7, color: '#000', marginTop: normalize(6) }}>
              {contest.theme}
            </Text>
            <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_SM, letterSpacing: -0.2, color: '#8e8e93', marginTop: normalize(4) }}>
              {`출품 마감 ${contest.submitDeadlineLabel}`}
            </Text>
            <Pressable onPress={onOpenSubmit} style={{ width: '100%', height: normalize(44), marginTop: normalize(16), borderRadius: normalize(22), backgroundColor: ACCENT, alignItems: 'center', justifyContent: 'center' }}>
              <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_SM, letterSpacing: -0.2, color: '#fff' }}>
                첫 작품 출품하기
              </Text>
            </Pressable>
          </View>
        )}

        <View style={{ flex: 1, minHeight: normalize(260), justifyContent: 'center', paddingHorizontal: CONTENT_PADDING, alignItems: 'center' }}>
          <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_MD, letterSpacing: -0.3, color: '#000' }}>
            아직 출품 기록이 없어요
          </Text>
          <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_SM, letterSpacing: -0.2, color: '#8e8e93', marginTop: normalize(6) }}>
            출품하면 회차별 순위가 여기에 쌓여요
          </Text>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: normalize(24) }} showsVerticalScrollIndicator={false}>
      <View style={{ margin: normalize(18), marginHorizontal: CONTENT_PADDING, padding: normalize(20), borderRadius: normalize(20), backgroundColor: SURFACE }}>
        <View style={{ flexDirection: 'row' }}>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_XS, letterSpacing: -0.1, color: '#8e8e93' }}>
              출품
            </Text>
            <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_XL, letterSpacing: -0.8, color: '#000', marginTop: normalize(4) }}>
              7회
            </Text>
          </View>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_XS, letterSpacing: -0.1, color: '#8e8e93' }}>
              최고 순위
            </Text>
            <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_XL, letterSpacing: -0.8, color: ACCENT, marginTop: normalize(4) }}>
              2위
            </Text>
          </View>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_XS, letterSpacing: -0.1, color: '#8e8e93' }}>
              받은 표
            </Text>
            <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_XL, letterSpacing: -0.8, color: '#000', marginTop: normalize(4) }}>
              168
            </Text>
          </View>
        </View>

        <View style={{ marginTop: normalize(18), paddingTop: normalize(18), borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.07)' }}>
          {/* 배지가 그래프 위로 12 올라오므로 제목과 부딪히지 않게 여백을 그만큼 더 준다 */}
          <View style={{ flexDirection: 'row', alignItems: 'baseline', marginBottom: normalize(20) }}>
            <Text allowFontScaling={false} style={{ flex: 1, fontFamily: 'Pretendard-SemiBold', fontSize: FONT_SM, letterSpacing: -0.2, color: '#000' }}>
              순위 추이
            </Text>
            <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_XS, letterSpacing: -0.1, color: '#8e8e93' }}>
              최근 {RANK_TREND.length}회
            </Text>
          </View>
          <View style={{ height: normalize(TREND_VIEW_H) }}>
            <Svg width="100%" height={normalize(TREND_VIEW_H)} viewBox={`0 0 ${TREND_VIEW_W} ${TREND_VIEW_H}`} preserveAspectRatio="none">
              <Polyline
                points={RANK_TREND.map((p) => `${p.x},${p.y}`).join(' ')}
                fill="none"
                stroke={ACCENT}
                strokeWidth={2.2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {RANK_TREND.map((p, i) => (
                <Circle
                  key={i}
                  cx={p.x}
                  cy={p.y}
                  r={i === BEST_RANK_INDEX ? 5.5 : 4}
                  fill={i === BEST_RANK_INDEX ? ACCENT : SURFACE}
                  stroke={i === BEST_RANK_INDEX ? undefined : ACCENT}
                  strokeWidth={i === BEST_RANK_INDEX ? undefined : 2}
                />
              ))}
            </Svg>
            {/* 축 라벨 대신 최고 순위 지점에 배지 — X는 %로 SVG와 함께 늘어나고 Y는 상단 고정 */}
            <View
              pointerEvents="none"
              style={{
                position: 'absolute',
                left: `${(RANK_TREND[BEST_RANK_INDEX].x / TREND_VIEW_W) * 100}%`,
                // 최고점 원과 겹치지 않게 그래프 위쪽으로 빼낸다
                top: -normalize(12),
                transform: [{ translateX: -normalize(28) }],
                height: normalize(22),
                paddingHorizontal: normalize(8),
                borderRadius: normalize(11),
                backgroundColor: 'rgba(227,27,89,0.1)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_2XS, letterSpacing: -0.1, color: ACCENT }}>
                최고 2위
              </Text>
            </View>
          </View>

          {/* X축 라벨 — 점 좌표(18~276)는 등간격이 아니지만 라벨은 등분해 배치한다. 마지막 칸만 약 7pt 어긋난다 */}
          <View style={{ flexDirection: 'row', marginTop: normalize(10) }}>
            {RANK_TREND.map((point, index) => {
              const isBest = index === BEST_RANK_INDEX;
              return (
                <View key={point.monthLabel} style={{ flex: 1, alignItems: 'center' }}>
                  <Text
                    allowFontScaling={false}
                    style={{ fontFamily: isBest ? 'Pretendard-SemiBold' : 'Pretendard-Regular', fontSize: FONT_2XS, letterSpacing: -0.1, color: isBest ? ACCENT : '#8e8e93' }}
                  >
                    {point.monthLabel}
                  </Text>
                  <Text
                    allowFontScaling={false}
                    numberOfLines={1}
                    style={{ fontFamily: isBest ? 'Pretendard-SemiBold' : 'Pretendard-Regular', fontSize: FONT_2XS, letterSpacing: -0.1, color: isBest ? ACCENT : '#c7c7cc', marginTop: normalize(2) }}
                  >
                    {point.theme}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      </View>

      <Text allowFontScaling={false} style={{ paddingHorizontal: CONTENT_PADDING, paddingTop: normalize(24), paddingBottom: normalize(8), fontFamily: 'Pretendard-SemiBold', fontSize: FONT_MD, letterSpacing: -0.3, color: '#000' }}>
        회차별 기록
      </Text>
      {HISTORY.map((item) => (
        <HistoryRow
          key={item.id}
          item={item}
          onPress={() => onOpenResult(item.monthLabel, item.myRank)}
        />
      ))}
    </ScrollView>
  );
}
