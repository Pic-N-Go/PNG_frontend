import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { normalize, normalizeFontSize } from '@/utils/normalize';
import { CARD_RADIUS, FONT_MD, FONT_SM, FONT_XL, GRID_PADDING, SPACING_XS } from '@/constants/layout';
import type { CalendarEvent } from '@/types/spot';

// TODO: API 연동 시 GET /calendar/events 로 교체
const MOCK_EVENTS: CalendarEvent[] = [
  {
    id: '1',
    dateRange: '5월 12일 ~ 5월 20일',
    eventName: '장미 축제',
    place: '에버랜드 장미원',
    tip: '만개 시기 · 오전 촬영 추천',
    photoScore: 92,
    tag: '맑음 · 미세먼지 좋음',
    headerColor: '#000',
  },
  {
    id: '2',
    dateRange: '5월 중 · 매일 새벽',
    eventName: '은하수 시즌',
    place: '영월 별마로천문대',
    tip: '새벽 2~4시 · 삼각대 필수',
    photoScore: 85,
    tag: '구름 없음 · 광해 최소',
    headerColor: '#1d1d1f',
  },
];

interface Props {
  // TODO: 스팟 상세 네비게이션 파라미터 확정 후 onEventPress 연결
  onEventPress?: (id: string) => void;
}

export default function CalendarSection({ onEventPress }: Props) {
  return (
    <View style={{ paddingHorizontal: GRID_PADDING, marginTop: normalize(28) }}>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          marginBottom: SPACING_XS,
        }}
      >
        <Text
          allowFontScaling={false}
          style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_XL, color: '#000', letterSpacing: -0.4 }}
        >
          이달의 출사 캘린더
        </Text>
      </View>
      <Text
        allowFontScaling={false}
        style={{
          fontFamily: 'Pretendard-Regular',
          fontSize: FONT_SM,
          color: 'rgba(0,0,0,0.4)',
          letterSpacing: -0.1,
          marginBottom: normalize(14),
        }}
      >
        시기별 추천 포토스팟을 놓치지 마세요
      </Text>

      <View style={{ flexDirection: 'row', gap: normalize(12) }}>
        {MOCK_EVENTS.map((event) => (
          <View key={event.id} style={{ flex: 1, borderRadius: CARD_RADIUS, overflow: 'hidden', backgroundColor: '#F5F5F7' }}>
          <Pressable
            onPress={onEventPress ? () => onEventPress(event.id) : undefined}
            style={({ pressed }) => ({
              flex: 1,
              opacity: onEventPress && pressed ? 0.95 : 1,
              transform: [{ scale: onEventPress && pressed ? 0.98 : 1 }],
            })}
          >
            {/* 헤더 */}
            <View style={{ backgroundColor: event.headerColor, paddingVertical: normalize(10), paddingHorizontal: normalize(14) }}>
              <Text
                allowFontScaling={false}
                style={{
                  fontFamily: 'Pretendard-SemiBold',
                  fontSize: normalizeFontSize(10),
                  color: 'rgba(255,255,255,0.5)',
                  letterSpacing: 1,
                  marginBottom: normalize(4),
                }}
              >
                {event.dateRange}
              </Text>
              <Text
                allowFontScaling={false}
                style={{
                  fontFamily: 'Pretendard-SemiBold',
                  fontSize: FONT_MD,
                  color: '#fff',
                }}
              >
                {event.eventName}
              </Text>
            </View>

            {/* 바디 */}
            <View style={{ paddingTop: normalize(12), paddingHorizontal: normalize(14), paddingBottom: normalize(14) }}>
              <Text
                allowFontScaling={false}
                style={{
                  fontFamily: 'Pretendard-Medium',
                  fontSize: FONT_SM,
                  color: '#000',
                  marginBottom: normalize(2),
                }}
                numberOfLines={1}
              >
                {event.place}
              </Text>
              <Text
                allowFontScaling={false}
                style={{
                  fontFamily: 'Pretendard-Regular',
                  fontSize: normalizeFontSize(12),
                  color: 'rgba(0,0,0,0.4)',
                  marginBottom: normalize(10),
                }}
                numberOfLines={1}
              >
                {event.tip}
              </Text>

              {/* 포토제닉 지수 */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  height: normalize(32),
                  paddingHorizontal: normalize(10),
                  borderRadius: normalize(8),
                  backgroundColor: '#fff',
                  marginBottom: normalize(8),
                }}
              >
                <Text
                  allowFontScaling={false}
                  style={{ fontFamily: 'Pretendard-Regular', fontSize: normalizeFontSize(11), color: 'rgba(0,0,0,0.4)' }}
                >
                  포토제닉 지수
                </Text>
                <Text allowFontScaling={false}>
                  <Text style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_MD, color: '#E31B59' }}>
                    {event.photoScore}
                  </Text>
                  <Text style={{ fontFamily: 'Pretendard-Regular', fontSize: normalizeFontSize(10), color: 'rgba(0,0,0,0.2)' }}>
                    /100
                  </Text>
                </Text>
              </View>

              {/* 태그 */}
              <View
                style={{
                  alignSelf: 'flex-start',
                  height: normalize(22),
                  paddingHorizontal: normalize(10),
                  borderRadius: normalize(11),
                  backgroundColor: '#fff',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text
                  allowFontScaling={false}
                  style={{
                    fontFamily: 'Pretendard-Regular',
                    fontSize: normalizeFontSize(10),
                    color: 'rgba(0,0,0,0.4)',
                  }}
                  numberOfLines={1}
                >
                  {event.tag}
                </Text>
              </View>
            </View>
          </Pressable>
          </View>
        ))}
      </View>
    </View>
  );
}
