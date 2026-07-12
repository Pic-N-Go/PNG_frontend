import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { LinearGradient as ExpoLinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { IconAtom, IconCalendar, IconChevronDown, IconClock, IconCloud, IconFlowerFilled, IconSun, IconWind } from '@tabler/icons-react-native';
import OptionSheet from '@/components/common/OptionSheet';
import TimePickerSheet from '@/components/spot/TimePickerSheet';
import { useSpotPhotogenicScore } from '@/hooks/useSpot';
import { FONT_XL, GRID_PADDING } from '@/constants/layout';
import { normalize, normalizeFontSize } from '@/utils/normalize';
import type { PhotogenicFactor } from '@/types/spot';

const RING_SIZE = normalize(160);
const RING_RADIUS = 68;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

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

const FACTOR_ICONS: Record<PhotogenicFactor['key'], React.ComponentType<{ size: number; color: string; strokeWidth?: number }>> = {
  weather: IconCloud,
  goldenHour: IconSun,
  dust: IconWind,
  ozone: IconAtom,
  season: IconFlowerFilled,
};

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

  const progress = data ? data.score / data.maxScore : 0;
  const dash = RING_CIRCUMFERENCE * progress;
  const gap = RING_CIRCUMFERENCE - dash;

  const gh = data?.goldenHour;

  return (
    <View style={{ paddingHorizontal: GRID_PADDING, paddingTop: normalize(24) }}>
      <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_XL, color: '#000', letterSpacing: -0.4, marginBottom: normalize(16) }}>
        포토제닉 지수
      </Text>

      <View style={{ flexDirection: 'row', gap: normalize(10), marginBottom: normalize(16) }}>
        <Pressable
          onPress={() => setDateSheetVisible(true)}
          style={{ flex: 1, height: normalize(40), borderRadius: normalize(10), backgroundColor: '#F5F5F7', flexDirection: 'row', alignItems: 'center', gap: normalize(8), paddingHorizontal: normalize(12) }}
        >
          <IconCalendar size={normalize(16)} color="rgba(0,0,0,0.6)" strokeWidth={2} />
          <Text allowFontScaling={false} numberOfLines={1} style={{ flex: 1, fontFamily: 'Pretendard-Regular', fontSize: normalizeFontSize(14), color: 'rgba(0,0,0,0.6)', letterSpacing: -0.15 }}>
            {selectedDateLabel}
          </Text>
          <IconChevronDown size={normalize(10)} color="rgba(0,0,0,0.2)" strokeWidth={2} />
        </Pressable>
        <Pressable
          onPress={() => setTimeSheetVisible(true)}
          style={{ flex: 1, height: normalize(40), borderRadius: normalize(10), backgroundColor: '#F5F5F7', flexDirection: 'row', alignItems: 'center', gap: normalize(8), paddingHorizontal: normalize(12) }}
        >
          <IconClock size={normalize(16)} color="rgba(0,0,0,0.6)" strokeWidth={2} />
          <Text allowFontScaling={false} numberOfLines={1} style={{ flex: 1, fontFamily: 'Pretendard-Regular', fontSize: normalizeFontSize(14), color: 'rgba(0,0,0,0.6)', letterSpacing: -0.15 }}>
            {formatTimeLabel(selectedTime)}
          </Text>
          <IconChevronDown size={normalize(10)} color="rgba(0,0,0,0.2)" strokeWidth={2} />
        </Pressable>
      </View>

      <View style={{ borderRadius: normalize(20), backgroundColor: '#F5F5F7', paddingTop: normalize(24), paddingBottom: normalize(20), paddingHorizontal: GRID_PADDING, alignItems: 'center', minHeight: normalize(240), justifyContent: 'center' }}>
        {!data ? (
          isError ? (
            <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: normalizeFontSize(14), color: 'rgba(0,0,0,0.4)', letterSpacing: -0.2 }}>
              포토제닉 지수를 불러오지 못했어요.
            </Text>
          ) : (
            <ActivityIndicator color="#E31B59" />
          )
        ) : (
          <>
            <View
              style={{
                position: 'absolute',
                top: normalize(18),
                right: normalize(18),
                backgroundColor: 'rgba(227,27,89,0.1)',
                paddingHorizontal: normalize(10),
                paddingVertical: normalize(4),
                borderRadius: normalize(20),
              }}
            >
              <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: normalizeFontSize(11), color: '#E31B59', letterSpacing: -0.1 }}>
                {data.grade}
              </Text>
            </View>

            <View style={{ width: RING_SIZE, height: RING_SIZE, marginBottom: normalize(16) }}>
              <Svg width={RING_SIZE} height={RING_SIZE} viewBox="0 0 160 160">
                <Defs>
                  <LinearGradient id="pgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <Stop offset="0%" stopColor="#FF9500" />
                    <Stop offset="100%" stopColor="#E31B59" />
                  </LinearGradient>
                </Defs>
                <Circle cx={80} cy={80} r={RING_RADIUS} fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth={8} />
                <Circle
                  cx={80}
                  cy={80}
                  r={RING_RADIUS}
                  fill="none"
                  stroke="url(#pgGrad)"
                  strokeWidth={8}
                  strokeDasharray={`${dash} ${gap}`}
                  strokeLinecap="round"
                  rotation={-90}
                  origin="80,80"
                />
              </Svg>
              <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }}>
                <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: normalizeFontSize(11), color: 'rgba(0,0,0,0.3)', letterSpacing: 0.4, marginBottom: normalize(2) }}>
                  SCORE
                </Text>
                <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: normalizeFontSize(56), letterSpacing: -3, color: '#E31B59', lineHeight: normalizeFontSize(56) }}>
                  {data.score}
                </Text>
                <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: normalizeFontSize(12), color: 'rgba(0,0,0,0.25)', marginTop: normalize(3) }}>
                  {`/ ${data.maxScore}점`}
                </Text>
              </View>
            </View>

            <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: normalizeFontSize(14), color: 'rgba(0,0,0,0.5)', letterSpacing: -0.2, textAlign: 'center', lineHeight: normalizeFontSize(14) * 1.55, marginBottom: normalize(14) }}>
              지금 <Text style={{ fontFamily: 'Pretendard-SemiBold', color: '#000' }}>{spotName}</Text>에{'\n'}방문하기 최적인 시간대예요
            </Text>

            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: normalize(8),
                backgroundColor: 'rgba(255,159,10,0.1)',
                borderRadius: normalize(12),
                paddingVertical: normalize(10),
                paddingHorizontal: normalize(14),
                width: '100%',
                marginBottom: normalize(18),
              }}
            >
              <IconSun size={normalize(18)} color="#FF9500" strokeWidth={2} />
              <Text allowFontScaling={false} style={{ flex: 1, fontFamily: 'Pretendard-Regular', fontSize: normalizeFontSize(13), color: 'rgba(0,0,0,0.6)', letterSpacing: -0.15 }}>
                {gh && gh.minutesUntilStart != null ? (
                  <>
                    골든아워 <Text style={{ fontFamily: 'Pretendard-SemiBold', color: '#C77700' }}>{gh.minutesUntilStart}분 후</Text> 시작{gh.startTime ? ` · ${gh.startTime}` : ''}
                  </>
                ) : gh && gh.isActive ? (
                  <>
                    골든아워 <Text style={{ fontFamily: 'Pretendard-SemiBold', color: '#C77700' }}>진행 중</Text>
                  </>
                ) : (
                  <>
                    골든아워 <Text style={{ fontFamily: 'Pretendard-SemiBold', color: '#C77700' }}>{gh?.label ?? '정보 없음'}</Text>
                  </>
                )}
              </Text>
            </View>

            <View style={{ width: '100%', height: 1, backgroundColor: 'rgba(0,0,0,0.06)', marginBottom: normalize(16) }} />

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', width: '100%', gap: normalize(8) }}>
              {data.factors.map((factor) => {
                const Icon = FACTOR_ICONS[factor.key];
                if (factor.wide) {
                  return (
                    <View key={factor.key} style={{ width: '100%', backgroundColor: '#fff', borderRadius: normalize(14), padding: normalize(14), paddingBottom: normalize(12) }}>
                      <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: normalize(6) }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: normalize(10) }}>
                          <View style={{ width: normalize(34), height: normalize(34), borderRadius: normalize(10), backgroundColor: factor.iconBg, alignItems: 'center', justifyContent: 'center' }}>
                            <Icon size={normalize(18)} color={factor.iconColor} />
                          </View>
                          <View>
                            <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Medium', fontSize: normalizeFontSize(11), color: 'rgba(0,0,0,0.38)', letterSpacing: -0.1 }}>
                              {factor.label}
                            </Text>
                            <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: normalizeFontSize(15), color: factor.valueColor, letterSpacing: -0.3 }}>
                              {factor.value}
                            </Text>
                          </View>
                        </View>
                        <View style={{ backgroundColor: 'rgba(227,27,89,0.08)', borderRadius: normalize(20), paddingHorizontal: normalize(6), paddingVertical: normalize(1) }}>
                          <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: normalizeFontSize(10), color: '#E31B59' }}>
                            {`+${factor.score}`}
                          </Text>
                        </View>
                      </View>
                      <View style={{ height: 3, borderRadius: 2, backgroundColor: 'rgba(0,0,0,0.06)', overflow: 'hidden', marginTop: normalize(6) }}>
                        <ExpoLinearGradient
                          colors={['#FF9500', '#E31B59']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={{ width: `${factor.barPercent}%`, height: '100%', borderRadius: 2 }}
                        />
                      </View>
                    </View>
                  );
                }
                return (
                  <View key={factor.key} style={{ flexBasis: '31%', flexGrow: 1, backgroundColor: '#fff', borderRadius: normalize(14), padding: normalize(14), paddingBottom: normalize(12), gap: normalize(5) }}>
                    <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: normalize(2) }}>
                      <View style={{ width: normalize(34), height: normalize(34), borderRadius: normalize(10), backgroundColor: factor.iconBg, alignItems: 'center', justifyContent: 'center' }}>
                        <Icon size={normalize(18)} color={factor.iconColor} />
                      </View>
                      <View style={{ backgroundColor: 'rgba(227,27,89,0.08)', borderRadius: normalize(20), paddingHorizontal: normalize(6), paddingVertical: normalize(1) }}>
                        <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: normalizeFontSize(10), color: '#E31B59' }}>
                          {`+${factor.score}`}
                        </Text>
                      </View>
                    </View>
                    <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Medium', fontSize: normalizeFontSize(11), color: 'rgba(0,0,0,0.38)', letterSpacing: -0.1 }}>
                      {factor.label}
                    </Text>
                    <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: normalizeFontSize(15), color: factor.valueColor, letterSpacing: -0.3 }}>
                      {factor.value}
                    </Text>
                    <View style={{ height: 3, borderRadius: 2, backgroundColor: 'rgba(0,0,0,0.06)', overflow: 'hidden', marginTop: normalize(2) }}>
                      <View style={{ width: `${factor.barPercent}%`, height: '100%', borderRadius: 2, backgroundColor: factor.barColor }} />
                    </View>
                  </View>
                );
              })}
            </View>

            {/* 재조회 로딩 오버레이 */}
            {isFetching && (
              <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: normalize(20), backgroundColor: 'rgba(245,245,247,0.72)', alignItems: 'center', justifyContent: 'center' }}>
                <ActivityIndicator color="#E31B59" />
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
