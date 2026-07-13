import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { LinearGradient as ExpoLinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { IconAtom, IconCalendarEvent, IconChevronDown, IconClock, IconFlowerFilled, IconSun, IconWind } from '@tabler/icons-react-native';
import OptionSheet from '@/components/common/OptionSheet';
import Skeleton from '@/components/common/Skeleton';
import TimePickerSheet from '@/components/spot/TimePickerSheet';
import { useSpotPhotogenicScore } from '@/hooks/useSpot';
import { GRID_PADDING } from '@/constants/layout';
import { normalize, normalizeFontSize } from '@/utils/normalize';
import type { PhotogenicFactor } from '@/types/spot';

const COLORS = {
  accent: '#E31B59',
  card: '#F7F6F4',
  input: '#F5F5F7',
  text: '#1F1E1D',
  textSub: '#37352F',
  label: '#8B8680',
  muted: '#A39E98',
  chevron: '#B5B0AA',
  track: '#E7E4E0',
  golden: { bg: '#FEF3E2', icon: '#E8890B', text: '#7A5A1E', strong: '#B4700C' },
};

// 등급별 배지 색 (좋음류=핑크, 보통=주황, 그 외=회색)
const GRADE_COLOR: Record<string, { fg: string; bg: string }> = {
  '매우 좋음': { fg: '#E31B59', bg: '#FDEBEF' },
  좋음: { fg: '#E31B59', bg: '#FDEBEF' },
  보통: { fg: '#E8890B', bg: '#FDF0E0' },
  비추천: { fg: '#9A9A9A', bg: '#EFEFEF' },
};
const gradeColor = (g: string) => GRADE_COLOR[g] ?? { fg: '#E31B59', bg: '#FDEBEF' };

const FACTOR_ICONS: Record<PhotogenicFactor['key'], React.ComponentType<{ size: number; color: string; strokeWidth?: number }>> = {
  weather: IconSun,
  goldenHour: IconSun,
  dust: IconWind,
  ozone: IconAtom,
  season: IconFlowerFilled,
};

// ponytail: 기기 로컬시간 기준으로 date/time 파라미터를 만든다. 국내(KST) 기기 가정.
// TODO(타임존): 비-KST 기기에서 잘못된 날짜/시각을 조회할 수 있음 → 필요 시 Asia/Seoul 기준으로 정규화.
const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];
const pad = (n: number) => String(n).padStart(2, '0');
const isoDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const dateLabel = (d: Date) => `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())} ${WEEKDAYS[d.getDay()]}`;
const hhmm = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;

function formatTimeLabel(date: Date): string {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const period = hours < 12 ? '오전' : '오후';
  const displayHour = hours % 12 === 0 ? 12 : hours % 12;
  return `${period} ${displayHour}:${String(minutes).padStart(2, '0')}`;
}

// 등급(백엔드 grade)에 맞춘 추천 문구. 배지와 같은 소스라 문구가 등급과 모순되지 않음.
const GRADE_MESSAGE: Record<string, string> = {
  '매우 좋음': '방문하기 최적인 시간대예요',
  좋음: '방문하기 좋은 시간대예요',
  보통: '방문하기 무난한 시간대예요',
  비추천: '방문을 추천하지 않는 시간대예요',
};
// ponytail: 미확인 등급은 중립 문구로 폴백. 백엔드 등급 추가 시 위 맵에 한 줄만 추가.
const gradeMessage = (grade: string) => GRADE_MESSAGE[grade] ?? '방문 정보를 확인해보세요';

// 원형 게이지 (그라데이션 트랙)
const GAUGE_SIZE = normalize(184);
const GAUGE_R = 79;
const GAUGE_STROKE = 14;
const GAUGE_CIRC = 2 * Math.PI * GAUGE_R;

function SelectorPill({ Icon, label, active, onPress }: { Icon: React.ComponentType<{ size: number; color: string; strokeWidth?: number }>; label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: normalize(8),
        backgroundColor: COLORS.input,
        borderRadius: normalize(12),
        borderWidth: 1.5,
        borderColor: active ? COLORS.accent : 'transparent',
        paddingVertical: normalize(12),
        paddingHorizontal: normalize(13),
      }}
    >
      <Icon size={normalize(17)} color={active ? COLORS.accent : COLORS.label} strokeWidth={2} />
      <Text allowFontScaling={false} numberOfLines={1} style={{ flex: 1, fontFamily: 'Pretendard-SemiBold', fontSize: normalizeFontSize(14.5), color: COLORS.text, letterSpacing: -0.2 }}>
        {label}
      </Text>
      <IconChevronDown size={normalize(16)} color={active ? COLORS.accent : COLORS.chevron} strokeWidth={2} />
    </Pressable>
  );
}

// 카드 레이아웃(게이지·문구·배너·점수구성) 모양의 스켈레톤 — 초기 로딩용
function PhotogenicSkeleton() {
  const tint = { backgroundColor: COLORS.track };
  return (
    <View>
      <View style={{ position: 'absolute', top: 0, right: 0 }}>
        <Skeleton width={normalize(60)} height={normalize(26)} borderRadius={normalize(999)} style={tint} />
      </View>
      <View style={{ alignItems: 'center', marginTop: normalize(8) }}>
        <Skeleton width={GAUGE_SIZE} height={GAUGE_SIZE} borderRadius={GAUGE_SIZE / 2} style={tint} />
      </View>
      <View style={{ alignItems: 'center', marginTop: normalize(18), gap: normalize(9) }}>
        <Skeleton width="60%" height={normalize(16)} style={tint} />
        <Skeleton width="45%" height={normalize(16)} style={tint} />
      </View>
      <Skeleton width="100%" height={normalize(44)} borderRadius={normalize(12)} style={{ ...tint, marginTop: normalize(16) }} />
      <View style={{ marginTop: normalize(18), paddingTop: normalize(16), borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.06)', gap: normalize(16) }}>
        {[0, 1, 2, 3].map((i) => (
          <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: normalize(12) }}>
            <Skeleton width={normalize(38)} height={normalize(38)} borderRadius={normalize(10)} style={tint} />
            <View style={{ flex: 1, gap: normalize(6) }}>
              <Skeleton width={normalize(44)} height={normalize(11)} style={tint} />
              <Skeleton width={normalize(72)} height={normalize(15)} style={tint} />
            </View>
            <Skeleton width={normalize(28)} height={normalize(15)} style={tint} />
          </View>
        ))}
      </View>
    </View>
  );
}

interface Props {
  spotId: string;
  spotName: string;
}

export default function PhotogenicScoreCard({ spotId, spotName }: Props) {
  // 날짜 옵션: 오늘 ~ +2일 (동적)
  const dateOptions = useMemo(() => {
    return [0, 1, 2].map((offset) => {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() + offset);
      return { label: dateLabel(d), iso: isoDate(d) };
    });
  }, []);

  const [selectedDateLabel, setSelectedDateLabel] = useState(dateOptions[0].label);
  const [selectedTime, setSelectedTime] = useState(() => new Date());
  const [dateSheetVisible, setDateSheetVisible] = useState(false);
  const [timeSheetVisible, setTimeSheetVisible] = useState(false);

  const dateParam = dateOptions.find((o) => o.label === selectedDateLabel)?.iso;
  const timeParam = hhmm(selectedTime);

  const { data, isError, isFetching } = useSpotPhotogenicScore(spotId, dateParam, timeParam);

  const gh = data?.goldenHour;
  // 골든아워는 배너가 대표 → 점수 구성 행에서는 제외
  const factors = data ? data.factors.filter((f) => f.key !== 'goldenHour') : [];
  const gauge = data ? gradeColor(data.grade) : null;
  const ratio = data ? Math.max(0, Math.min(1, data.score / data.maxScore)) : 0;

  return (
    <View style={{ paddingHorizontal: GRID_PADDING, paddingTop: normalize(24) }}>
      <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: normalizeFontSize(20), color: COLORS.text, letterSpacing: -0.4, marginBottom: normalize(16) }}>
        포토제닉 지수
      </Text>

      {/* 날짜 / 시간 셀렉터 */}
      <View style={{ flexDirection: 'row', gap: normalize(10), marginBottom: normalize(14) }}>
        <SelectorPill Icon={IconCalendarEvent} label={selectedDateLabel} active={dateSheetVisible} onPress={() => setDateSheetVisible(true)} />
        <SelectorPill Icon={IconClock} label={formatTimeLabel(selectedTime)} active={timeSheetVisible} onPress={() => setTimeSheetVisible(true)} />
      </View>

      {/* 점수 히어로 카드 (무테/무그림자) */}
      <View style={{ backgroundColor: COLORS.card, borderRadius: normalize(20), paddingHorizontal: normalize(18), paddingTop: normalize(24), paddingBottom: normalize(18), minHeight: normalize(240), justifyContent: 'center' }}>
        {!data ? (
          isError ? (
            <View style={{ alignItems: 'center' }}>
              <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: normalizeFontSize(14), color: 'rgba(0,0,0,0.4)', letterSpacing: -0.2 }}>
                포토제닉 지수를 불러오지 못했어요.
              </Text>
            </View>
          ) : (
            <PhotogenicSkeleton />
          )
        ) : (
          <>
            {/* 등급 배지 */}
            <View style={{ position: 'absolute', top: normalize(18), right: normalize(18), flexDirection: 'row', alignItems: 'center', gap: normalize(5), backgroundColor: gauge!.bg, borderRadius: normalize(999), paddingVertical: normalize(6), paddingHorizontal: normalize(12) }}>
              <View style={{ width: normalize(6), height: normalize(6), borderRadius: normalize(3), backgroundColor: gauge!.fg }} />
              <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: normalizeFontSize(13), color: gauge!.fg }}>
                {data.grade}
              </Text>
            </View>

            {/* 게이지 */}
            <View style={{ width: GAUGE_SIZE, height: GAUGE_SIZE, alignSelf: 'center', marginTop: normalize(8) }}>
              <Svg width={GAUGE_SIZE} height={GAUGE_SIZE} viewBox="0 0 184 184">
                <Defs>
                  <LinearGradient id="pgGauge" x1="0" y1="1" x2="1" y2="0">
                    <Stop offset="0" stopColor="#FF7A00" />
                    <Stop offset="1" stopColor="#E31B59" />
                  </LinearGradient>
                </Defs>
                <Circle cx={92} cy={92} r={GAUGE_R} fill="none" stroke={COLORS.track} strokeWidth={GAUGE_STROKE} />
                <Circle
                  cx={92}
                  cy={92}
                  r={GAUGE_R}
                  fill="none"
                  stroke="url(#pgGauge)"
                  strokeWidth={GAUGE_STROKE}
                  strokeLinecap="round"
                  strokeDasharray={GAUGE_CIRC}
                  strokeDashoffset={GAUGE_CIRC * (1 - ratio)}
                  transform="rotate(-90 92 92)"
                />
              </Svg>
              <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }}>
                <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: normalizeFontSize(11), letterSpacing: 1.5, color: COLORS.muted }}>SCORE</Text>
                <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: normalizeFontSize(56), lineHeight: normalizeFontSize(60), color: COLORS.accent, letterSpacing: -1 }}>{data.score}</Text>
                <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: normalizeFontSize(14), color: COLORS.muted }}>{`/ ${data.maxScore}점`}</Text>
              </View>
            </View>

            {/* 안내 문구 (히어로 예외: 중앙 정렬) */}
            <Text allowFontScaling={false} style={{ marginTop: normalize(14), textAlign: 'center', fontSize: normalizeFontSize(17), lineHeight: normalizeFontSize(25), color: COLORS.textSub }}>
              지금 <Text style={{ fontFamily: 'Pretendard-SemiBold', color: COLORS.text }}>{spotName}</Text>에{'\n'}{gradeMessage(data.grade)}
            </Text>

            {/* 골든아워 배너 */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: normalize(9), marginTop: normalize(16), backgroundColor: COLORS.golden.bg, borderRadius: normalize(12), paddingVertical: normalize(12), paddingHorizontal: normalize(14) }}>
              <IconSun size={normalize(18)} color={COLORS.golden.icon} strokeWidth={2} />
              <Text allowFontScaling={false} style={{ flex: 1, fontFamily: 'Pretendard-Regular', fontSize: normalizeFontSize(14), color: COLORS.golden.text }}>
                {gh && gh.minutesUntilStart != null ? (
                  <>
                    골든아워 <Text style={{ fontFamily: 'Pretendard-SemiBold', color: COLORS.golden.strong }}>{gh.minutesUntilStart}분 후</Text> 시작{gh.startTime ? ` · ${gh.startTime}` : ''}
                  </>
                ) : gh && gh.isActive ? (
                  <>
                    골든아워 <Text style={{ fontFamily: 'Pretendard-SemiBold', color: COLORS.golden.strong }}>진행 중</Text>
                  </>
                ) : (
                  <>
                    골든아워 <Text style={{ fontFamily: 'Pretendard-SemiBold', color: COLORS.golden.strong }}>{gh?.label ?? '정보 없음'}</Text>
                  </>
                )}
              </Text>
            </View>

            {/* 점수 구성 */}
            <View style={{ marginTop: normalize(18), paddingTop: normalize(16), borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.06)' }}>
              <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: normalizeFontSize(13), color: COLORS.text, marginBottom: normalize(6) }}>점수 구성</Text>

              {factors.map((factor, i) => {
                const Icon = FACTOR_ICONS[factor.key];
                const showBar = factor.barPercent < 100; // 만점이면 바 생략 (부분 점수만 표시)
                const showDivider = i < factors.length - 1;
                return (
                  <View key={factor.key} style={{ paddingTop: normalize(11), paddingBottom: showBar ? normalize(2) : normalize(11), borderBottomWidth: showDivider ? 1 : 0, borderBottomColor: 'rgba(0,0,0,0.05)' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: normalize(12) }}>
                      <View style={{ width: normalize(38), height: normalize(38), borderRadius: normalize(10), backgroundColor: factor.iconBg, alignItems: 'center', justifyContent: 'center' }}>
                        <Icon size={normalize(20)} color={factor.iconColor} strokeWidth={2} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Medium', fontSize: normalizeFontSize(12), color: COLORS.label, marginBottom: normalize(1) }}>{factor.label}</Text>
                        <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: normalizeFontSize(15.5), color: factor.valueColor }}>{factor.value}</Text>
                      </View>
                      <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: normalizeFontSize(15), color: COLORS.textSub }}>+{factor.score}</Text>
                    </View>
                    {showBar && (
                      <View style={{ height: normalize(6), borderRadius: normalize(999), backgroundColor: COLORS.track, marginTop: normalize(10), overflow: 'hidden' }}>
                        <ExpoLinearGradient
                          colors={['#FF7A00', '#E31B59']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={{ width: `${factor.barPercent}%`, height: '100%', borderRadius: normalize(999) }}
                        />
                      </View>
                    )}
                  </View>
                );
              })}
            </View>

            {/* 재조회 로딩 오버레이 */}
            {isFetching && (
              <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: normalize(20), backgroundColor: 'rgba(247,246,244,0.72)', alignItems: 'center', justifyContent: 'center' }}>
                <ActivityIndicator color={COLORS.accent} />
              </View>
            )}
          </>
        )}
      </View>

      <OptionSheet
        visible={dateSheetVisible}
        title="날짜 선택"
        options={dateOptions.map((o) => o.label)}
        selected={selectedDateLabel}
        onSelect={setSelectedDateLabel}
        onClose={() => setDateSheetVisible(false)}
      />
      <TimePickerSheet
        visible={timeSheetVisible}
        value={selectedTime}
        onConfirm={setSelectedTime}
        onClose={() => setTimeSheetVisible(false)}
      />
    </View>
  );
}
