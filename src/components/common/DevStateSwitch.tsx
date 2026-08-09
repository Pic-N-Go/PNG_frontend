import React from 'react';
import { Pressable, ScrollView, Text } from 'react-native';
import { FONT_2XS } from '@/constants/layout';
import { normalize } from '@/utils/normalize';

/**
 * 목업 확인용 상태 전환 바 — 목업의 `.phase-switch` / `.state-switch`와 같은 역할.
 *
 * 서버가 phase를 내려주기 전까지는 투표 기간·결과 발표·빈 상태 같은 분기에 도달할 경로가 없어서,
 * 코드만 있고 눈으로 확인할 수 없는 화면이 대부분이다. 이 바가 그 분기를 열어준다.
 * 릴리즈 빌드에는 렌더되지 않는다(`__DEV__` 가드). 실제 화면에는 없는 요소다.
 */

interface Props<T extends string> {
  options: { key: T; label: string }[];
  value: T;
  onChange: (key: T) => void;
}

export default function DevStateSwitch<T extends string>({ options, value, onChange }: Props<T>) {
  if (!__DEV__) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={{ flexGrow: 0, backgroundColor: '#000' }}
      contentContainerStyle={{ paddingVertical: normalize(6), paddingHorizontal: normalize(8), gap: normalize(4) }}
    >
      {options.map((option) => {
        const isActive = option.key === value;
        return (
          <Pressable
            key={option.key}
            onPress={() => onChange(option.key)}
            style={{
              paddingVertical: normalize(4),
              paddingHorizontal: normalize(7),
              borderRadius: normalize(6),
              backgroundColor: isActive ? '#fff' : 'rgba(255,255,255,0.12)',
            }}
          >
            <Text
              allowFontScaling={false}
              style={{ fontFamily: 'Pretendard-Medium', fontSize: FONT_2XS, color: isActive ? '#000' : 'rgba(255,255,255,0.55)' }}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
