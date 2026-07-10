import React from 'react';
import { View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { normalize, normalizeFontSize } from '@/utils/normalize';
import { FONT_SM, FONT_XS } from '@/constants/layout';

const CHART_DATA = [
  { week: '1주차', score: 78 },
  { week: '2주차', score: 84 },
  { week: '3주차', score: 91, isBest: true },
  { week: '4주차', score: 82 },
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
          backgroundColor: '#fff',
          padding: normalize(20),
          position: 'relative',
          overflow: 'hidden',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 5,
          elevation: 2,
        }}
      >
        <LinearGradient
          colors={['rgba(227, 27, 89, 0.06)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ position: 'absolute', inset: 0 }}
        />
        
        <Text className="tracking-tight" style={{ fontSize: normalizeFontSize(12), color: 'rgba(0,0,0,0.4)', marginBottom: normalize(6) }}>
          이번 달 평균
        </Text>
        
        <View className="flex-row items-baseline mb-5" style={{ gap: normalize(8) }}>
          <Text className="font-semibold tracking-tight" style={{ fontSize: normalizeFontSize(32), color: '#e31b59', lineHeight: normalizeFontSize(32) }}>
            84.2
          </Text>
          <Text className="tracking-tight" style={{ fontSize: normalizeFontSize(16), color: 'rgba(0,0,0,0.25)' }}>
            /100
          </Text>
          <View
            style={{
              height: normalize(22),
              paddingHorizontal: normalize(10),
              borderRadius: normalize(11),
              backgroundColor: 'rgba(52, 199, 89, 0.1)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text className="font-medium tracking-tight" style={{ fontSize: FONT_XS, color: '#34c759' }}>
              전월 대비 ▲ 3.1점
            </Text>
          </View>
        </View>

        <View className="flex-row" style={{ gap: normalize(16) }}>
          <View className="flex-1">
            <Text className="tracking-tight" style={{ fontSize: FONT_XS, color: 'rgba(0,0,0,0.3)', marginBottom: normalize(6) }}>
              주차별 평균 포토제닉 점수
            </Text>
            
            <View className="flex-row" style={{ gap: normalize(6), marginBottom: normalize(4) }}>
              {CHART_DATA.map((item, idx) => (
                <Text
                  key={idx}
                  className="flex-1 text-center tracking-tight"
                  style={{
                    fontSize: normalizeFontSize(10),
                    color: item.isBest ? '#e31b59' : 'rgba(0,0,0,0.25)',
                    fontWeight: item.isBest ? '600' : 'normal',
                  }}
                >
                  {item.score}{item.isBest && '★'}
                </Text>
              ))}
            </View>

            <View className="flex-row items-end" style={{ gap: normalize(6), height: normalize(56) }}>
              {CHART_DATA.map((item, idx) => (
                <View key={idx} className="flex-1 h-full justify-end">
                  <View
                    style={{
                      width: '100%',
                      height: `${(item.score / 100) * 100}%`,
                      backgroundColor: item.isBest ? '#e31b59' : 'rgba(0,0,0,0.06)',
                      borderRadius: normalize(4),
                    }}
                  />
                </View>
              ))}
            </View>
            
            <View className="flex-row mt-1.5" style={{ gap: normalize(6) }}>
              {CHART_DATA.map((item, idx) => (
                <Text key={idx} className="flex-1 text-center tracking-tight" style={{ fontSize: normalizeFontSize(9), color: 'rgba(0,0,0,0.25)' }}>
                  {item.week}
                </Text>
              ))}
            </View>
          </View>

          <View style={{ width: normalize(120) }}>
            <Text className="tracking-tight" style={{ fontSize: FONT_XS, color: 'rgba(0,0,0,0.3)', marginBottom: normalize(8) }}>
              이달의 베스트 스팟
            </Text>
            <View
              style={{
                padding: normalize(12),
                borderRadius: normalize(10),
                backgroundColor: '#fff',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 3,
                elevation: 1,
              }}
            >
              <Text className="font-semibold text-black tracking-tight" style={{ fontSize: FONT_SM, marginBottom: normalize(2) }}>
                제주 사려니숲
              </Text>
              <Text className="tracking-tight" style={{ fontSize: FONT_XS, color: 'rgba(0,0,0,0.35)', marginBottom: normalize(8) }}>
                2026.05.15
              </Text>
              <View
                style={{
                  alignSelf: 'flex-start',
                  height: normalize(18),
                  paddingHorizontal: normalize(8),
                  borderRadius: normalize(9),
                  backgroundColor: 'rgba(227, 27, 89, 0.08)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text className="font-semibold tracking-tight" style={{ fontSize: normalizeFontSize(10), color: '#e31b59' }}>
                  94점
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}
