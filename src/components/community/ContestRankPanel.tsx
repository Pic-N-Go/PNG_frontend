import React from 'react';
import { Pressable, Text, View } from 'react-native';
import Svg, { Circle, Line } from 'react-native-svg';
import { ChevronDown, ChevronRight, Clock } from 'lucide-react-native';
import { RankHistory } from '@/types/community';
import { CARD_RADIUS, CONTENT_PADDING, FONT_2XS, FONT_SM, FONT_XS } from '@/constants/layout';
import { normalize } from '@/utils/normalize';

/**
 * 순위 변동 패널 — 투표 기간에만 노출. 매일 자정 1회 집계, 그래프는 최근 7일.
 * 핸드오프 spec/06-ranking-history.md · 07-rank-enter-exit.md 기준(시안 11a·11b·12a).
 *
 * 좌표계는 목업의 viewBox를 그대로 쓴다(11a `0 0 306 150`, 12a `0 0 306 190`).
 * 306은 390dp에서 이 패널의 실제 콘텐츠 폭(390 − 28×2 − 14×2)이라, `width="100%"`와 함께 쓰면
 * 폭이 줄어도 가로세로가 거의 같은 비율로 축소돼 원이 타원으로 뭉개지지 않는다.
 * 좌표를 0~100으로 정규화하면 이 성질이 깨지고, 권외 변형의 좌측 거터도 표현할 수 없다.
 */

const INK = '#000000';
const SUB = '#8e8e93';
const FILL = '#f5f5f7';
const ACCENT = '#E31B59';

const VIEW_W = 306;
/** 권외 밴드가 붙으면 높이가 커지고 좌측 거터도 20 → 44로 넓어진다(권외 라벨 자리) */
const GEOMETRY = {
  normal: { height: 150, xStart: 20, xEnd: 286 },
  out: { height: 190, xStart: 44, xEnd: 292 },
} as const;

const RANK_Y: Record<number, number> = { 1: 26, 2: 74, 3: 122 };
const BAND_Y = 170;
const THUMB = 30;
const RING = 2;

function yAt(rank: number | null): number {
  if (rank == null) return BAND_Y;
  return RANK_Y[rank] ?? BAND_Y;
}

export default function ContestRankPanel({
  history,
  open,
  onToggle,
  onOpenEntry,
}: {
  history: RankHistory;
  /** 펼침 상태는 상위가 소유한다 — 펼치면 히어로가 함께 줄어야 해서(목업 .is-expanded) */
  open: boolean;
  onToggle: () => void;
  onOpenEntry: (id: string) => void;
}) {
  const geo = history.variant === 'out' ? GEOMETRY.out : GEOMETRY.normal;
  const graphHeight = normalize(geo.height);
  const dayCount = history.days.length;
  // x는 계열 배열 길이가 아니라 날짜 인덱스 기준 — 중간에 끝나는 계열도 같은 날짜 칸에 맞아야 한다
  const xAt = (index: number) =>
    dayCount <= 1 ? geo.xStart : geo.xStart + ((geo.xEnd - geo.xStart) * index) / (dayCount - 1);

  return (
    <View style={{ margin: normalize(16), marginTop: normalize(16), marginHorizontal: CONTENT_PADDING, borderRadius: CARD_RADIUS, backgroundColor: FILL, overflow: 'hidden' }}>
      <Pressable onPress={onToggle} style={{ height: normalize(72), paddingHorizontal: normalize(14), flexDirection: 'row', alignItems: 'center', gap: normalize(12) }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {history.legend.slice(0, 3).map((entry, index) => (
            <View
              key={entry.id}
              style={{ width: normalize(34), height: normalize(34), borderRadius: normalize(17), borderWidth: 2, borderColor: FILL, backgroundColor: entry.gradient[0], marginLeft: index === 0 ? 0 : normalize(-10) }}
            />
          ))}
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_SM, letterSpacing: -0.2, color: INK }}>
            순위 변동
          </Text>
          <Text allowFontScaling={false} numberOfLines={1} style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_XS, letterSpacing: -0.1, color: SUB, marginTop: normalize(2) }}>
            {history.subtitle}
          </Text>
        </View>
        <ChevronDown size={normalize(18)} color="#c7c7cc" strokeWidth={2} style={{ transform: [{ rotate: open ? '180deg' : '0deg' }] }} />
      </Pressable>

      {open && (
        <View style={{ paddingHorizontal: normalize(14), paddingBottom: normalize(14) }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: normalize(8), marginBottom: normalize(2) }}>
            <View style={{ height: normalize(20), paddingHorizontal: normalize(8), borderRadius: normalize(10), backgroundColor: 'rgba(227,27,89,0.1)', alignItems: 'center', justifyContent: 'center' }}>
              <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_2XS, letterSpacing: -0.1, color: ACCENT }}>
                {history.variant === 'first' ? '집계 전' : '어제 집계'}
              </Text>
            </View>
            {history.periodLabel && (
              <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_2XS, letterSpacing: -0.1, color: SUB }}>
                {history.periodLabel}
              </Text>
            )}
          </View>

          {history.variant === 'first' ? (
            <View style={{ marginTop: normalize(12), paddingVertical: normalize(22), paddingHorizontal: normalize(14), borderRadius: normalize(12), backgroundColor: '#fff', alignItems: 'center', gap: normalize(10) }}>
              <Clock size={normalize(18)} color="#c7c7cc" strokeWidth={1.8} />
              <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_SM, letterSpacing: -0.2, color: SUB }}>
                첫 집계는 내일 자정에 나와요
              </Text>
            </View>
          ) : (
            <View style={{ marginTop: normalize(12), height: graphHeight }}>
              <Svg width="100%" height={graphHeight} viewBox={`0 0 ${VIEW_W} ${geo.height}`} preserveAspectRatio="none">
                {[1, 2, 3].map((rank) => (
                  <Line key={rank} x1={geo.xStart} y1={RANK_Y[rank]} x2={geo.xEnd} y2={RANK_Y[rank]} stroke="#e9e9ed" strokeWidth={1} />
                ))}
                {history.variant === 'out' ? (
                  <Line x1={geo.xStart} y1={BAND_Y} x2={geo.xEnd} y2={BAND_Y} stroke="#d2d2d8" strokeWidth={1} strokeDasharray="2 3" />
                ) : (
                  /* 오늘 자리를 세로 점선으로 표시 — 마지막 집계가 어제라는 걸 알린다.
                     1~3위 원 중심 사이로만 긋는다 — 그래프 높이 전체로 그으면 3위 원 아래로 꼬리가 남는다 */
                  <Line x1={geo.xEnd} y1={RANK_Y[1]} x2={geo.xEnd} y2={RANK_Y[3]} stroke={ACCENT} strokeWidth={1} strokeDasharray="3 3" opacity={0.5} />
                )}

                {history.series.map((series, seriesIndex) =>
                  series.points.slice(1).map((point, i) => {
                    const prev = series.points[i];
                    // 순위를 모르는 구간(권외)은 점선 — 그 날 실제 등수는 공개되지 않는다
                    const known = prev.rank != null && point.rank != null;
                    return (
                      <Line
                        key={`${seriesIndex}-${i}`}
                        x1={xAt(i)}
                        y1={yAt(prev.rank)}
                        x2={xAt(i + 1)}
                        y2={yAt(point.rank)}
                        stroke={series.strokeColor}
                        strokeWidth={series.strokeWidth}
                        strokeDasharray={known ? undefined : '4 4'}
                        strokeLinecap="round"
                      />
                    );
                  }),
                )}

                {/* 순위권에 새로 진입한 지점을 점으로 찍는다(12a) */}
                {history.series.map((series, seriesIndex) => {
                  const enterIndex = series.points.findIndex((p, i) => i > 0 && p.rank != null && series.points[i - 1].rank == null);
                  if (enterIndex < 0) return null;
                  const cx = xAt(enterIndex);
                  const cy = yAt(series.points[enterIndex].rank);
                  return (
                    <React.Fragment key={seriesIndex}>
                      <Circle cx={cx} cy={cy} r={6} fill={FILL} />
                      <Circle cx={cx} cy={cy} r={4.5} fill={series.strokeColor} />
                    </React.Fragment>
                  );
                })}
              </Svg>

              {/* 마지막 점에만 30px 썸네일 — 전부 찍으면 겹쳐서 못 읽는다.
                  X는 %(SVG와 함께 늘어남) · Y는 px(viewBox와 1:1)로 둬야 원형이 유지된다. */}
              {history.series.map((series, seriesIndex) => {
                const lastIndex = series.points.length - 1;
                const last = series.points[lastIndex];
                if (last.rank == null) return null;
                // 계열이 중간에 끝나면 마지막 날이 아니라 그 지점에 썸네일을 놓는다
                const leftPercent: `${number}%` = `${(xAt(lastIndex) / VIEW_W) * 100}%`;
                return (
                  <View
                    key={seriesIndex}
                    pointerEvents="none"
                    style={{
                      position: 'absolute',
                      left: leftPercent,
                      marginLeft: -normalize(THUMB / 2 + RING),
                      top: normalize(yAt(last.rank) - THUMB / 2 - RING),
                      width: normalize(THUMB + RING * 2),
                      height: normalize(THUMB + RING * 2),
                      borderRadius: normalize(THUMB / 2 + RING),
                      backgroundColor: series.strokeColor,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <View
                      style={{
                        width: normalize(THUMB),
                        height: normalize(THUMB),
                        borderRadius: normalize(THUMB / 2),
                        borderWidth: RING,
                        borderColor: FILL,
                        backgroundColor: series.gradient[0],
                      }}
                    />
                  </View>
                );
              })}

              {history.variant === 'out' && (
                <Text
                  allowFontScaling={false}
                  style={{ position: 'absolute', left: 0, top: normalize(BAND_Y - 8), fontFamily: 'Pretendard-Medium', fontSize: FONT_2XS, letterSpacing: -0.1, color: '#c7c7cc' }}
                >
                  권외
                </Text>
              )}
            </View>
          )}

          {history.days.length > 0 && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: normalize(4), marginTop: normalize(10) }}>
              {history.days.map((day, i) => {
                const isLast = i === history.days.length - 1;
                return (
                  <View key={day} style={{ flex: 1, height: normalize(32), borderRadius: normalize(16), alignItems: 'center', justifyContent: 'center', backgroundColor: isLast ? '#fff' : 'transparent' }}>
                    <Text allowFontScaling={false} style={{ fontFamily: isLast ? 'Pretendard-SemiBold' : 'Pretendard-Regular', fontSize: FONT_SM, letterSpacing: -0.2, color: isLast ? INK : SUB }}>
                      {day}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}

          {history.legend.length > 0 && (
            <View style={{ marginTop: normalize(14), paddingTop: normalize(14), borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.07)', gap: normalize(12) }}>
              {history.legend.map((entry) => (
                <Pressable key={entry.id} onPress={() => onOpenEntry(entry.id)} style={{ flexDirection: 'row', alignItems: 'center', gap: normalize(12) }}>
                  <View style={{ width: normalize(40), height: normalize(40), borderRadius: normalize(11), backgroundColor: entry.gradient[0], flexShrink: 0 }} />
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: normalize(6) }}>
                      <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_SM, letterSpacing: -0.2, color: INK }}>
                        {entry.author}
                      </Text>
                      {entry.isNew && (
                        <View style={{ height: normalize(18), paddingHorizontal: normalize(6), borderRadius: normalize(9), backgroundColor: 'rgba(227,27,89,0.1)', alignItems: 'center', justifyContent: 'center' }}>
                          <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_2XS, letterSpacing: -0.1, color: ACCENT }}>
                            NEW
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text allowFontScaling={false} numberOfLines={1} style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_XS, letterSpacing: -0.1, color: SUB, marginTop: normalize(2) }}>
                      {entry.meta}
                    </Text>
                  </View>
                  <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_SM, letterSpacing: -0.2, color: INK }}>
                    {`${entry.rank}위`}
                  </Text>
                  <ChevronRight size={normalize(16)} color="#c7c7cc" strokeWidth={2} />
                </Pressable>
              ))}
            </View>
          )}
        </View>
      )}
    </View>
  );
}
