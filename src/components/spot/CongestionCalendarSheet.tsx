import React from 'react';
import { Pressable, ScrollView, Text, useWindowDimensions, View } from 'react-native';
import { IconX } from '@tabler/icons-react-native';
import BottomSheet from '@/components/common/BottomSheet';
import type { CongestionLevel, SpotCongestionResponse } from '@/types/spot';
import { BRAND, BRAND_TINT, CARD, HAIRLINE, TEXT_SUB } from '@/constants/colors';
import { HAIRLINE_WIDTH } from '@/constants/layout';
import { normalize, normalizeFontSize } from '@/utils/normalize';

export const CONGESTION_LEVEL_CONFIG: Record<
  CongestionLevel,
  { label: string; fg: string; bg: string; bar: string; desc: string }
> = {
  RELAXED: {
    label: '여유',
    fg: '#007AFF',
    bg: '#EBF5FF',
    bar: '#007AFF',
    desc: '인파가 적어 여유롭게 촬영할 수 있어요',
  },
  NORMAL: {
    label: '보통',
    fg: '#FF9500',
    bg: '#FFF6E8',
    bar: '#FF9500',
    desc: '적당한 방문객이 있어 관람하기 무난해요',
  },
  CROWDED: {
    label: '혼잡',
    fg: '#FF6B00',
    bg: '#FFF0EB',
    bar: '#FF6B00',
    desc: '방문객이 많아 포토존 대기가 발생할 수 있어요',
  },
  VERY_CROWDED: {
    label: '매우 혼잡',
    fg: '#FF3B30',
    bg: '#FFEBEA',
    bar: '#FF3B30',
    desc: '매우 붐벼요. 이른 아침이나 일몰 후 방문을 추천해요',
  },
};

interface Props {
  visible: boolean;
  onClose: () => void;
  spotName: string;
  congestionData: SpotCongestionResponse | null;
  targetDate?: string;
}

export default function CongestionCalendarSheet({
  visible,
  onClose,
  spotName,
  congestionData,
  targetDate,
}: Props) {
  const { height: windowHeight } = useWindowDimensions();
  const days = congestionData?.days || [];
  const bestDay = congestionData?.bestCleanDay;
  const sheetHeight = Math.round(windowHeight * 0.72);

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View style={{ height: sheetHeight }}>
        {/* 헤더 */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: normalize(20),
            paddingTop: normalize(12),
            paddingBottom: normalize(14),
            borderBottomWidth: HAIRLINE_WIDTH,
            borderBottomColor: HAIRLINE,
          }}
        >
          <View style={{ flex: 1, paddingRight: normalize(12) }}>
            <Text
              allowFontScaling={false}
              style={{
                fontFamily: 'Pretendard-SemiBold',
                fontSize: normalizeFontSize(18),
                color: '#000',
                letterSpacing: -0.3,
              }}
            >
              30일 혼잡도 추이
            </Text>
            <Text
              allowFontScaling={false}
              numberOfLines={1}
              style={{
                fontFamily: 'Pretendard-Regular',
                fontSize: normalizeFontSize(13),
                color: TEXT_SUB,
                marginTop: normalize(2),
                letterSpacing: -0.2,
              }}
            >
              {congestionData?.matchedAttractionName && congestionData.matchedAttractionName !== spotName
                ? `${spotName}이(가) 위치한 ${congestionData.matchedAttractionName} 기준 30일 추이예요`
                : `${spotName}의 향후 30일간 일별 예상 혼잡도예요`}
            </Text>
          </View>
          <Pressable
            onPress={onClose}
            hitSlop={8}
            style={{
              width: normalize(32),
              height: normalize(32),
              borderRadius: normalize(16),
              backgroundColor: CARD,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <IconX size={normalize(18)} color="#000" strokeWidth={2} />
          </Pressable>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingHorizontal: normalize(20),
            paddingTop: normalize(16),
            paddingBottom: normalize(32),
          }}
          showsVerticalScrollIndicator={true}
          keyboardShouldPersistTaps="handled"
          nestedScrollEnabled={true}
        >
          {/* 최적의 출사일 추천 배너 */}
          {bestDay && (
            <View
              style={{
                backgroundColor: '#F0F7FF',
                borderRadius: normalize(14),
                padding: normalize(14),
                marginBottom: normalize(16),
                borderWidth: 1,
                borderColor: '#D4E8FF',
              }}
            >
              <View style={{ marginBottom: normalize(6) }}>
                <Text
                  allowFontScaling={false}
                  style={{
                    fontFamily: 'Pretendard-SemiBold',
                    fontSize: normalizeFontSize(13),
                    color: '#007AFF',
                  }}
                >
                  30일 중 가장 한적한 출사 추천일
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text
                  allowFontScaling={false}
                  style={{
                    fontFamily: 'Pretendard-SemiBold',
                    fontSize: normalizeFontSize(15),
                    color: '#007AFF',
                    letterSpacing: -0.2,
                  }}
                >
                  {bestDay.date} ({bestDay.dayOfWeek}) · {bestDay.rate.toFixed(1)}% (여유)
                </Text>
              </View>
            </View>
          )}

          {/* 범례 가이드 */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: CARD,
              borderRadius: normalize(10),
              paddingVertical: normalize(8),
              paddingHorizontal: normalize(12),
              marginBottom: normalize(14),
            }}
          >
            {(['RELAXED', 'NORMAL', 'CROWDED', 'VERY_CROWDED'] as CongestionLevel[]).map((lvl) => {
              const cfg = CONGESTION_LEVEL_CONFIG[lvl];
              return (
                <View key={lvl} style={{ flexDirection: 'row', alignItems: 'center', gap: normalize(4) }}>
                  <View
                    style={{
                      width: normalize(7),
                      height: normalize(7),
                      borderRadius: normalize(4),
                      backgroundColor: cfg.bar,
                    }}
                  />
                  <Text
                    allowFontScaling={false}
                    style={{
                      fontFamily: 'Pretendard-Medium',
                      fontSize: normalizeFontSize(11.5),
                      color: TEXT_SUB,
                    }}
                  >
                    {cfg.label}
                  </Text>
                </View>
              );
            })}
          </View>

          {/* 30일 리스트 */}
          {days.length === 0 ? (
            <View style={{ paddingVertical: normalize(32), alignItems: 'center' }}>
              <Text
                allowFontScaling={false}
                style={{
                  fontFamily: 'Pretendard-Regular',
                  fontSize: normalizeFontSize(14),
                  color: TEXT_SUB,
                }}
              >
                예측 데이터가 없습니다.
              </Text>
            </View>
          ) : (
            days.map((item, idx) => {
              const cfg = CONGESTION_LEVEL_CONFIG[item.level] || CONGESTION_LEVEL_CONFIG.NORMAL;
              const isTarget = targetDate === item.date;
              const isBest = bestDay?.date === item.date;
              const barWidth = Math.min(100, Math.max(8, item.rate));

              return (
                <View
                  key={item.date}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: normalize(11),
                    paddingHorizontal: normalize(10),
                    borderRadius: normalize(10),
                    backgroundColor: isTarget ? BRAND_TINT : 'transparent',
                    borderBottomWidth: idx < days.length - 1 ? HAIRLINE_WIDTH : 0,
                    borderBottomColor: HAIRLINE,
                  }}
                >
                  {/* 날짜 열 */}
                  <View style={{ width: normalize(96) }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: normalize(4) }}>
                      <Text
                        allowFontScaling={false}
                        style={{
                          fontFamily: isTarget ? 'Pretendard-SemiBold' : 'Pretendard-Medium',
                          fontSize: normalizeFontSize(13.5),
                          color: isTarget ? BRAND : '#000',
                          letterSpacing: -0.2,
                        }}
                      >
                        {item.date.slice(5).replace('-', '.')} ({item.dayOfWeek})
                      </Text>
                      {isBest && (
                        <View
                          style={{
                            backgroundColor: '#EBF5FF',
                            paddingHorizontal: normalize(4),
                            paddingVertical: normalize(1),
                            borderRadius: normalize(4),
                          }}
                        >
                          <Text
                            allowFontScaling={false}
                            style={{
                              fontFamily: 'Pretendard-SemiBold',
                              fontSize: normalizeFontSize(9.5),
                              color: '#007AFF',
                            }}
                          >
                            최저
                          </Text>
                        </View>
                      )}
                      {isTarget && !isBest && (
                        <View
                          style={{
                            backgroundColor: BRAND,
                            paddingHorizontal: normalize(4),
                            paddingVertical: normalize(1),
                            borderRadius: normalize(4),
                          }}
                        >
                          <Text
                            allowFontScaling={false}
                            style={{
                              fontFamily: 'Pretendard-SemiBold',
                              fontSize: normalizeFontSize(9.5),
                              color: '#fff',
                            }}
                          >
                            일정
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>

                  {/* 게이지 바 */}
                  <View style={{ flex: 1, marginHorizontal: normalize(10) }}>
                    <View
                      style={{
                        height: normalize(8),
                        backgroundColor: CARD,
                        borderRadius: normalize(4),
                        overflow: 'hidden',
                      }}
                    >
                      <View
                        style={{
                          width: `${barWidth}%`,
                          height: '100%',
                          backgroundColor: cfg.bar,
                          borderRadius: normalize(4),
                        }}
                      />
                    </View>
                  </View>

                  {/* 수치 & 뱃지 */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: normalize(6), width: normalize(78), justifyContent: 'flex-end' }}>
                    <Text
                      allowFontScaling={false}
                      style={{
                        fontFamily: 'Pretendard-Regular',
                        fontSize: normalizeFontSize(12),
                        color: TEXT_SUB,
                      }}
                    >
                      {item.rate.toFixed(1)}%
                    </Text>
                    <View
                      style={{
                        backgroundColor: cfg.bg,
                        paddingHorizontal: normalize(6),
                        paddingVertical: normalize(2),
                        borderRadius: normalize(6),
                      }}
                    >
                      <Text
                        allowFontScaling={false}
                        style={{
                          fontFamily: 'Pretendard-SemiBold',
                          fontSize: normalizeFontSize(11),
                          color: cfg.fg,
                        }}
                      >
                        {cfg.label}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      </View>
    </BottomSheet>
  );
}
