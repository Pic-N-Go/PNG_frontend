import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import Svg, { Circle, Polyline } from 'react-native-svg';
import ContestPhoto from '@/components/community/ContestPhoto';
import { ContestHistoryRow, ContestInfo, ContestMyHistory, ContestPhase } from '@/types/community';
import { CONTENT_PADDING, FONT_2XS, FONT_MD, FONT_SM, FONT_XL, FONT_XS, HAIRLINE_WIDTH } from '@/constants/layout';
import { normalize } from '@/utils/normalize';
import { BRAND, BRAND_TINT, CARD, HAIRLINE } from '@/constants/colors';

/**
 * 콘테스트 > 내 출품 — 시안 8a(기록 있음)·8b(기록 없음). 캡션 수정·출품 취소는 폐기됐고
 * (사진·설명 수정 불가, 삭제는 진행중 탭 "내 출품작" 시트에서 처리), 이 탭은 순수 통계 화면이다.
 */

const ACCENT = BRAND;
const SURFACE = CARD;

/**
 * 순위 추이 좌표계는 목업의 `0 0 294 110`을 그대로 쓴다. 점의 x·y는 mapMyHistory가
 * 이 viewBox 기준으로 이미 계산해서 넘겨준다 — 컴포넌트는 그리기만 한다.
 */
const TREND_VIEW_W = 294;
const TREND_VIEW_H = 110;

function HistoryRow({ item, onPress }: { item: ContestHistoryRow; onPress: () => void }) {
  return (
    <Pressable
      onPress={item.kind === 'pending' ? undefined : onPress}
      disabled={item.kind === 'pending'}
      style={{ width: '100%', height: normalize(76), paddingHorizontal: CONTENT_PADDING, flexDirection: 'row', alignItems: 'center', gap: normalize(12) }}
    >
      <ContestPhoto
        gradient={item.gradient}
        photoUrl={item.photoUrl}
        radius={normalize(13)}
        style={{ width: normalize(56), height: normalize(56), flexShrink: 0 }}
      />
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
          backgroundColor: item.kind === 'award' ? BRAND_TINT : SURFACE,
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
  /** 진행 중 회차가 없으면 null */
  contest: ContestInfo | null;
  entryCount: number;
  maxEntries: number;
  /** 아직 안 받았으면 null — 화면은 기록 없음과 같게 그린다 */
  history: ContestMyHistory | null;
  onOpenSubmit: () => void;
  onOpenResult: (contestId: string, monthLabel: string, myRank: number | null) => void;
}

export default function ContestMyEntryTab({ phase, contest, entryCount, maxEntries, history, onOpenSubmit, onOpenResult }: Props) {
  if (!history || history.rows.length === 0) {
    return (
      // flexGrow: 1 — 내용이 화면보다 짧을 때 빈 상태가 남은 공간을 차지해 세로 중앙에 설 수 있게 한다
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: normalize(24) }} showsVerticalScrollIndicator={false}>
        {entryCount < maxEntries && (
          <View style={{ margin: normalize(18), marginTop: normalize(18), marginHorizontal: CONTENT_PADDING, padding: normalize(20), borderRadius: normalize(20), backgroundColor: SURFACE }}>
            <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_XS, letterSpacing: -0.1, color: ACCENT }}>
              진행중 콘테스트
            </Text>
            <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_XL, letterSpacing: -0.7, color: '#000', marginTop: normalize(6) }}>
              {contest?.theme ?? '준비 중이에요'}
            </Text>
            <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_SM, letterSpacing: -0.2, color: '#8e8e93', marginTop: normalize(4) }}>
              {contest ? `출품 마감 ${contest.submitDeadlineLabel}` : '다음 회차를 기다리고 있어요'}
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
              {`${history.totalEntryCount}회`}
            </Text>
          </View>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_XS, letterSpacing: -0.1, color: '#8e8e93' }}>
              최고 순위
            </Text>
            <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_XL, letterSpacing: -0.8, color: ACCENT, marginTop: normalize(4) }}>
              {history.bestRank == null ? '집계 중' : `${history.bestRank}위`}
            </Text>
          </View>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_XS, letterSpacing: -0.1, color: '#8e8e93' }}>
              받은 표
            </Text>
            <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_XL, letterSpacing: -0.8, color: '#000', marginTop: normalize(4) }}>
              {history.totalVoteCount}
            </Text>
          </View>
        </View>

        <View style={{ marginTop: normalize(18), paddingTop: normalize(18), borderTopWidth: HAIRLINE_WIDTH, borderTopColor: HAIRLINE }}>
          {/* 배지가 그래프 위로 12 올라오므로 제목과 부딪히지 않게 여백을 그만큼 더 준다 */}
          <View style={{ flexDirection: 'row', alignItems: 'baseline', marginBottom: normalize(20) }}>
            <Text allowFontScaling={false} style={{ flex: 1, fontFamily: 'Pretendard-SemiBold', fontSize: FONT_SM, letterSpacing: -0.2, color: '#000' }}>
              순위 추이
            </Text>
            <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_XS, letterSpacing: -0.1, color: '#8e8e93' }}>
              최근 {history.trend.length}회
            </Text>
          </View>
          <View style={{ height: normalize(TREND_VIEW_H) }}>
            <Svg width="100%" height={normalize(TREND_VIEW_H)} viewBox={`0 0 ${TREND_VIEW_W} ${TREND_VIEW_H}`} preserveAspectRatio="none">
              <Polyline
                points={history.trend.map((p) => `${p.x},${p.y}`).join(' ')}
                fill="none"
                stroke={ACCENT}
                strokeWidth={2.2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {history.trend.map((p, i) => (
                <Circle
                  key={i}
                  cx={p.x}
                  cy={p.y}
                  r={i === history.bestIndex ? 5.5 : 4}
                  fill={i === history.bestIndex ? ACCENT : SURFACE}
                  stroke={i === history.bestIndex ? undefined : ACCENT}
                  strokeWidth={i === history.bestIndex ? undefined : 2}
                />
              ))}
            </Svg>
            {/* 축 라벨 대신 최고 순위 지점에 배지 — X는 %로 SVG와 함께 늘어나고 Y는 상단 고정 */}
            {history.bestIndex >= 0 && history.bestRank != null && (
            <View
              pointerEvents="none"
              style={{
                position: 'absolute',
                left: `${(history.trend[history.bestIndex].x / TREND_VIEW_W) * 100}%`,
                // 최고점 원과 겹치지 않게 그래프 위쪽으로 빼낸다
                top: -normalize(12),
                transform: [{ translateX: -normalize(28) }],
                height: normalize(22),
                paddingHorizontal: normalize(8),
                borderRadius: normalize(11),
                backgroundColor: BRAND_TINT,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_2XS, letterSpacing: -0.1, color: ACCENT }}>
                {`최고 ${history.bestRank}위`}
              </Text>
            </View>
            )}
          </View>

          {/* X축 라벨 — 점 좌표(18~276)는 등간격이 아니지만 라벨은 등분해 배치한다. 마지막 칸만 약 7pt 어긋난다 */}
          <View style={{ flexDirection: 'row', marginTop: normalize(10) }}>
            {history.trend.map((point, index) => {
              const isBest = index === history.bestIndex;
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
      {history.rows.map((item) => (
        <HistoryRow
          key={item.id}
          item={item}
          onPress={() => onOpenResult(item.id, item.monthLabel, item.myRank)}
        />
      ))}
    </ScrollView>
  );
}
