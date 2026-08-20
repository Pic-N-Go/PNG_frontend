import React from 'react';
import { View, Text } from 'react-native';
import { SPOT_CATEGORY_MAP, pickSpotCategory } from '@/constants/spotCategories';
import { FONT_SM, FONT_XL, FONT_XS, HAIRLINE_WIDTH } from '@/constants/layout';
import { normalize } from '@/utils/normalize';
import { BRAND, HAIRLINE } from '@/constants/colors';

// 카테고리 라벨·아이콘·선택 규칙은 @/constants/spotCategories가 단일 출처다.
// 다른 화면(회원가입·지도·홈·마이페이지)도 같은 파일을 본다.
export { SPOT_CATEGORY_MAP, pickSpotCategory };

const PINK = BRAND;
const WATERMARK = '#111111';

interface Props {
  /** 백엔드 카테고리 배열. 없거나 미매핑이면 ETC로 처리 */
  categories?: string[] | null;
  /** ETC일 때 라벨로 쓰는 행정구역 (예: '서울 중구'). 없으면 라벨 줄 생략 */
  regionLabel?: string | null;
  /** 히어로 높이. 이미지 있을 때와 동일해야 함 */
  height?: number;
  headerLeft?: React.ReactNode;
  headerRight?: React.ReactNode;
}

// 대표 이미지가 없을 때의 스팟 상세 히어로 (카테고리 워터마크)
export default function SpotHeroPlaceholder({
  categories,
  regionLabel,
  height = normalize(365), // 폴백용 원본 핸드오프 수치 — 실제 호출부(SpotHero)는 항상 HERO_HEIGHT를 명시로 넘김
  headerLeft = null,
  headerRight = null,
}: Props) {
  const key = pickSpotCategory(categories);
  const { Icon, label } = SPOT_CATEGORY_MAP[key];
  const displayLabel = key === 'ETC' ? regionLabel || null : label;

  return (
    <View
      style={{
        height,
        backgroundColor: '#ffffff',
        borderBottomWidth: HAIRLINE_WIDTH,
        borderBottomColor: HAIRLINE,
        overflow: 'hidden',
      }}
    >
      <View
        pointerEvents="none"
        style={{ position: 'absolute', right: -24, bottom: -28, opacity: 0.05 }}
      >
        <Icon size={260} color={WATERMARK} strokeWidth={1} />
      </View>

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: 52,
          paddingHorizontal: 20,
        }}
      >
        <View>{headerLeft}</View>
        <View style={{ flexDirection: 'row', gap: 10 }}>{headerRight}</View>
      </View>

      <View
        style={{
          flex: 1,
          justifyContent: 'flex-end',
          paddingHorizontal: 28,
          paddingBottom: 32,
          gap: 12,
        }}
      >
        <Text
          allowFontScaling={false}
          style={{
            fontFamily: 'Pretendard-SemiBold',
            fontSize: FONT_XS,
            color: '#b7b3ad',
            letterSpacing: 3,
          }}
        >
          NO MAIN PHOTO
        </Text>

        {displayLabel ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}>
            <Icon size={17} color={PINK} strokeWidth={1.8} />
            <Text
              allowFontScaling={false}
              style={{
                fontFamily: 'Pretendard-SemiBold',
                fontSize: FONT_XL,
                color: '#111111',
                letterSpacing: -0.5,
              }}
            >
              {displayLabel}
            </Text>
          </View>
        ) : null}

        <Text
          allowFontScaling={false}
          style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_SM, color: '#8e8a85', letterSpacing: -0.2 }}
        >
          사진이 등록되면 이 자리에 표시돼요
        </Text>
      </View>
    </View>
  );
}

// self-check는 pickSpotCategory와 함께 @/constants/spotCategories로 옮겼다.

// 밝은 히어로 전용 상단 액션 버튼. 검정 아이콘 + rgba(0,0,0,.05) 배경.
// (이미지가 있을 때의 흰 아이콘 + 검정 스크림 버전과 짝을 이룸 — SpotHero.tsx)
export function HeroActionButton({ children }: { children: React.ReactNode }) {
  return (
    <View
      style={{
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(0,0,0,0.05)',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {children}
    </View>
  );
}
