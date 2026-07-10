import React from 'react';
import { View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { normalize, normalizeFontSize } from '@/utils/normalize';
import { FONT_SM, FONT_XS } from '@/constants/layout';

const CHART_DATA = [
  { week: '1주', score: 78 },
  { week: '2주', score: 84 },
  { week: '3주', score: 91, isBest: true },
  { week: '4주', score: 82 },
];

export default function PhotogenicReport() {
  return (
    <View className="mb-10 px-5">
      <View className="mb-3">
        <Text className="font-semibold tracking-tight text-black" style={{ fontSize: normalizeFontSize(20) }}>
          5월 포토제닉 리포트
        </Text>
      </View>

      <View
        style={{
          borderRadius: normalize(16),
          backgroundColor: '#f8f8f9', // 아주 옅은 회색 배경
          padding: normalize(20),
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <LinearGradient
          colors={['rgba(227, 27, 89, 0.08)', 'transparent']}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={{ position: 'absolute', inset: 0 }}
        />
        
        <Text className="tracking-tight" style={{ fontSize: normalizeFontSize(12), color: 'rgba(0,0,0,0.4)', marginBottom: normalize(6) }}>
          이번 달 평균
        </Text>
        
        <View className="flex-row items-baseline mb-6" style={{ gap: normalize(8) }}>
          <Text className="font-bold tracking-tight" style={{ fontSize: normalizeFontSize(36), color: '#E31B59', lineHeight: normalizeFontSize(38) }}>
            84.2
          </Text>
          <Text className="tracking-tight" style={{ fontSize: normalizeFontSize(16), color: 'rgba(0,0,0,0.25)' }}>
            /100
          </Text>
          <View
            style={{
              height: normalize(26),
              paddingHorizontal: normalize(12),
              borderRadius: normalize(13),
              backgroundColor: '#e6f4ea',
              alignItems: 'center',
              justifyContent: 'center',
              marginLeft: normalize(4)
            }}
          >
            <Text className="font-medium tracking-tight" style={{ fontSize: normalizeFontSize(13), color: '#1e8e3e' }}>
              전월 대비 ▲ 3.1점
            </Text>
          </View>
        </View>

        {/* 주차별 차트 */}
        <View className="mb-6">
          <Text className="tracking-tight" style={{ fontSize: FONT_XS, color: 'rgba(0,0,0,0.3)', marginBottom: normalize(12) }}>
            주차별 평균 포토제닉 점수
          </Text>
          
          <View className="flex-row" style={{ gap: normalize(10), marginBottom: normalize(6) }}>
            {CHART_DATA.map((item, idx) => (
              <Text
                key={idx}
                className="flex-1 text-center tracking-tight"
                style={{
                  fontSize: normalizeFontSize(11),
                  color: item.isBest ? '#E31B59' : 'rgba(0,0,0,0.3)',
                  fontWeight: item.isBest ? '700' : '500',
                }}
              >
                {item.score}{item.isBest && '★'}
              </Text>
            ))}
          </View>

          <View className="flex-row items-end" style={{ gap: normalize(10), height: normalize(50) }}>
            {CHART_DATA.map((item, idx) => (
              <View key={idx} className="flex-1 h-full justify-end">
                <View
                  style={{
                    width: '100%',
                    height: `${(item.score / 100) * 100}%`,
                    backgroundColor: item.isBest ? '#ec407a' : 'rgba(236, 64, 122, 0.3)',
                    borderTopLeftRadius: normalize(6),
                    borderTopRightRadius: normalize(6),
                    borderBottomLeftRadius: normalize(4),
                    borderBottomRightRadius: normalize(4),
                  }}
                />
              </View>
            ))}
          </View>
          
          <View className="flex-row mt-2" style={{ gap: normalize(10) }}>
            {CHART_DATA.map((item, idx) => (
              <Text key={idx} className="flex-1 text-center tracking-tight" style={{ fontSize: normalizeFontSize(10), color: 'rgba(0,0,0,0.3)' }}>
                {item.week}
              </Text>
            ))}
          </View>
        </View>

        {/* 베스트 스팟 */}
        <View>
          <Text className="tracking-tight" style={{ fontSize: FONT_XS, color: 'rgba(0,0,0,0.3)', marginBottom: normalize(8) }}>
            이달의 베스트
          </Text>
          <View
            style={{
              padding: normalize(14),
              borderRadius: normalize(12),
              backgroundColor: '#fff',
              alignSelf: 'flex-start',
              minWidth: normalize(140),
            }}
          >
            <Text className="font-semibold text-black tracking-tight" style={{ fontSize: normalizeFontSize(14), marginBottom: normalize(2) }}>
              광안리
            </Text>
            <Text className="tracking-tight" style={{ fontSize: normalizeFontSize(11), color: 'rgba(0,0,0,0.4)', marginBottom: normalize(12) }}>
              야경 · 3회 방문
            </Text>
            <View
              style={{
                alignSelf: 'flex-start',
                height: normalize(22),
                paddingHorizontal: normalize(10),
                borderRadius: normalize(11),
                backgroundColor: 'rgba(227, 27, 89, 0.08)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text className="font-bold tracking-tight" style={{ fontSize: normalizeFontSize(11), color: '#E31B59' }}>
                91점
              </Text>
            </View>
          </View>
        </View>

      </View>
    </View>
  );
}
