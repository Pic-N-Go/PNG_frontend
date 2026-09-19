import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import {
  IconCalendarEvent,
  IconChevronRight,
  IconInfoCircle,
  IconUsers,
} from '@tabler/icons-react-native';
import Skeleton from '@/components/common/Skeleton';
import CongestionCalendarSheet, { CONGESTION_LEVEL_CONFIG } from '@/components/spot/CongestionCalendarSheet';
import { useSpotCongestion } from '@/hooks/useSpot';
import { BRAND, BRAND_TINT, CARD, HAIRLINE, TEXT_SUB } from '@/constants/colors';
import { FONT_TITLE, GRID_PADDING, HAIRLINE_WIDTH } from '@/constants/layout';
import { normalize, normalizeFontSize } from '@/utils/normalize';

interface Props {
  spotId: string | number;
  spotName: string;
  targetDate?: string; // YYYY-MM-DD
}

export default function SpotCongestionCard({
  spotId,
  spotName,
  targetDate,
}: Props) {
  const [sheetVisible, setSheetVisible] = useState(false);
  const { data: congestion, isLoading } = useSpotCongestion(spotId, targetDate);

  const activeDay = congestion?.targetDay || congestion?.days?.[0] || congestion?.bestCleanDay;
  const bestDay = congestion?.bestCleanDay;
  const cfg = activeDay
    ? CONGESTION_LEVEL_CONFIG[activeDay.level] || CONGESTION_LEVEL_CONFIG.NORMAL
    : CONGESTION_LEVEL_CONFIG.NORMAL;

  const barPercent = activeDay ? Math.min(100, Math.max(5, activeDay.rate)) : 0;

  return (
    <View style={{ paddingHorizontal: GRID_PADDING, marginTop: normalize(24) }}>
      {/* 카드 상단 타이틀 행 */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: normalize(12),
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: normalize(6) }}>
          <Text
            allowFontScaling={false}
            style={{
              fontFamily: 'Pretendard-SemiBold',
              fontSize: FONT_TITLE,
              color: '#000',
              letterSpacing: -0.4,
            }}
          >
            방문 혼잡도 예측
          </Text>
          {congestion?.matchedAttractionName && congestion.matchedAttractionName !== spotName && (
            <View
              style={{
                backgroundColor: 'rgba(0,0,0,0.05)',
                paddingHorizontal: normalize(6),
                paddingVertical: normalize(2),
                borderRadius: normalize(6),
              }}
            >
              <Text
                allowFontScaling={false}
                style={{
                  fontFamily: 'Pretendard-Medium',
                  fontSize: normalizeFontSize(11),
                  color: TEXT_SUB,
                }}
              >
                {congestion.matchedAttractionName} 기준
              </Text>
            </View>
          )}
        </View>

        {congestion?.hasData && (
          <Pressable
            onPress={() => setSheetVisible(true)}
            hitSlop={8}
            style={{ flexDirection: 'row', alignItems: 'center', gap: normalize(2) }}
          >
            <Text
              allowFontScaling={false}
              style={{
                fontFamily: 'Pretendard-Medium',
                fontSize: normalizeFontSize(13.5),
                color: TEXT_SUB,
              }}
            >
              30일 추이
            </Text>
            <IconChevronRight size={normalize(15)} color={TEXT_SUB} strokeWidth={2} />
          </Pressable>
        )}
      </View>

      {/* 카드 본체 */}
      <View
        style={{
          backgroundColor: CARD,
          borderRadius: normalize(20),
          padding: normalize(18),
        }}
      >
        {isLoading ? (
          <View style={{ gap: normalize(12) }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Skeleton width={normalize(120)} height={normalize(18)} borderRadius={normalize(6)} />
              <Skeleton width={normalize(50)} height={normalize(22)} borderRadius={normalize(8)} />
            </View>
            <Skeleton width="100%" height={normalize(10)} borderRadius={normalize(5)} style={{ marginVertical: normalize(6) }} />
            <Skeleton width="70%" height={normalize(16)} borderRadius={normalize(6)} />
          </View>
        ) : !congestion || !congestion.hasData ? (
          // 한국관광공사 예측 대상 외 스팟 (솔직한 안내)
          <View style={{ alignItems: 'center', paddingVertical: normalize(14), gap: normalize(6) }}>
            <View
              style={{
                width: normalize(40),
                height: normalize(40),
                borderRadius: normalize(20),
                backgroundColor: 'rgba(0,0,0,0.04)',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: normalize(4),
              }}
            >
              <IconUsers size={normalize(22)} color="rgba(0,0,0,0.3)" strokeWidth={1.8} />
            </View>
            <Text
              allowFontScaling={false}
              style={{
                fontFamily: 'Pretendard-SemiBold',
                fontSize: normalizeFontSize(14.5),
                color: '#000',
                letterSpacing: -0.2,
              }}
            >
              혼잡도 예측 데이터가 없는 스팟이에요
            </Text>
            <Text
              allowFontScaling={false}
              style={{
                fontFamily: 'Pretendard-Regular',
                fontSize: normalizeFontSize(12.5),
                color: TEXT_SUB,
                textAlign: 'center',
                lineHeight: normalize(18),
                letterSpacing: -0.2,
              }}
            >
              인기 관광지 및 주요 명소 위주로 빅데이터 추이가 제공됩니다.
            </Text>
          </View>
        ) : (
          <>
            {/* 상단 날짜 및 상태 배지 */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: normalize(12),
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: normalize(6) }}>
                <IconCalendarEvent size={normalize(16)} color={BRAND} strokeWidth={2} />
                <Text
                  allowFontScaling={false}
                  style={{
                    fontFamily: 'Pretendard-SemiBold',
                    fontSize: normalizeFontSize(14),
                    color: '#000',
                    letterSpacing: -0.2,
                  }}
                >
                  {targetDate
                    ? `선택한 일정 ${activeDay!.date.slice(5).replace('-', '.')} (${activeDay!.dayOfWeek})`
                    : `오늘 ${activeDay!.date.slice(5).replace('-', '.')} (${activeDay!.dayOfWeek})`}
                </Text>
              </View>

              <View
                style={{
                  backgroundColor: cfg.bg,
                  paddingHorizontal: normalize(8),
                  paddingVertical: normalize(3),
                  borderRadius: normalize(8),
                }}
              >
                <Text
                  allowFontScaling={false}
                  style={{
                    fontFamily: 'Pretendard-SemiBold',
                    fontSize: normalizeFontSize(12),
                    color: cfg.fg,
                  }}
                >
                  {cfg.label}
                </Text>
              </View>
            </View>

            {/* 게이지 바 */}
            <View style={{ marginBottom: normalize(8) }}>
              <View
                style={{
                  height: normalize(10),
                  backgroundColor: HAIRLINE,
                  borderRadius: normalize(5),
                  overflow: 'hidden',
                }}
              >
                <View
                  style={{
                    width: `${barPercent}%`,
                    height: '100%',
                    backgroundColor: cfg.bar,
                    borderRadius: normalize(5),
                  }}
                />
              </View>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  marginTop: normalize(4),
                }}
              >
                <Text
                  allowFontScaling={false}
                  style={{
                    fontFamily: 'Pretendard-Regular',
                    fontSize: normalizeFontSize(11),
                    color: TEXT_SUB,
                  }}
                >
                  여유 0%
                </Text>
                <Text
                  allowFontScaling={false}
                  style={{
                    fontFamily: 'Pretendard-SemiBold',
                    fontSize: normalizeFontSize(11.5),
                    color: cfg.fg,
                  }}
                >
                  집중률 {activeDay!.rate.toFixed(1)}%
                </Text>
                <Text
                  allowFontScaling={false}
                  style={{
                    fontFamily: 'Pretendard-Regular',
                    fontSize: normalizeFontSize(11),
                    color: TEXT_SUB,
                  }}
                >
                  매우 혼잡 100%
                </Text>
              </View>
            </View>

            {/* 상태 가이드 문구 */}
            <Text
              allowFontScaling={false}
              style={{
                fontFamily: 'Pretendard-Regular',
                fontSize: normalizeFontSize(13.5),
                color: '#222',
                lineHeight: normalize(19),
                marginTop: normalize(6),
                letterSpacing: -0.2,
              }}
            >
              {cfg.desc}
            </Text>

            {/* 30일 중 최저 혼잡일 팁 배너 */}
            {bestDay && bestDay.date !== activeDay?.date && (
              <Pressable
                onPress={() => setSheetVisible(true)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: normalize(8),
                  marginTop: normalize(14),
                  paddingTop: normalize(12),
                  borderTopWidth: HAIRLINE_WIDTH,
                  borderTopColor: HAIRLINE,
                }}
              >
                <Text
                  allowFontScaling={false}
                  numberOfLines={1}
                  style={{
                    flex: 1,
                    fontFamily: 'Pretendard-Regular',
                    fontSize: normalizeFontSize(12.5),
                    color: '#333',
                    letterSpacing: -0.2,
                  }}
                >
                  가장 한적한 날: <Text style={{ fontFamily: 'Pretendard-SemiBold', color: '#007AFF' }}>{bestDay.date.slice(5).replace('-', '.')} ({bestDay.dayOfWeek})</Text> · {bestDay.rate.toFixed(1)}%
                </Text>
                <IconChevronRight size={normalize(14)} color={TEXT_SUB} strokeWidth={2} />
              </Pressable>
            )}
          </>
        )}
      </View>

      <CongestionCalendarSheet
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
        spotName={spotName}
        congestionData={congestion ?? null}
        targetDate={targetDate}
      />
    </View>
  );
}
