import React from 'react';
import type { ComponentType } from 'react';
import { View, Text } from 'react-native';
import {
  Trees,
  Umbrella,
  Mountain,
  House,
  TreePine,
  Landmark,
  Coffee,
  Building2,
  MoonStar,
  Calendar,
  Flower2,
  Sunset,
  Sparkles,
  MapPin,
  type LucideProps,
} from 'lucide-react-native';
import { FONT_XS, FONT_SM, FONT_XL } from '@/constants/layout';
import { normalize } from '@/utils/normalize';

const PINK = '#E31B59';
const WATERMARK = '#111111';

type CategoryGroup = 'PLACE' | 'SCENE' | 'ETC';

interface CategoryMeta {
  Icon: ComponentType<LucideProps>;
  label: string | null;
  group: CategoryGroup;
}

// 카테고리 → { 아이콘, 표시 라벨 }
// 장소형(TourAPI cat3 매핑, 신뢰도 높음) · 장면형(name/overview 키워드 추출, 오탐 가능 → 소재형 라벨)
export const SPOT_CATEGORY_MAP: Record<string, CategoryMeta> = {
  PARK: { Icon: Trees, label: '공원', group: 'PLACE' },
  BEACH: { Icon: Umbrella, label: '해변', group: 'PLACE' },
  MOUNTAIN: { Icon: Mountain, label: '산', group: 'PLACE' },
  HANOK: { Icon: House, label: '한옥', group: 'PLACE' },
  FOREST: { Icon: TreePine, label: '숲', group: 'PLACE' },
  HERITAGE: { Icon: Landmark, label: '문화유산', group: 'PLACE' },
  CAFE: { Icon: Coffee, label: '카페', group: 'SCENE' },
  CITY: { Icon: Building2, label: '도심 풍경', group: 'SCENE' },
  NIGHT_VIEW: { Icon: MoonStar, label: '야경', group: 'SCENE' },
  FESTIVAL: { Icon: Calendar, label: '축제', group: 'SCENE' },
  FLOWER: { Icon: Flower2, label: '꽃', group: 'SCENE' },
  SUNRISE_SUNSET: { Icon: Sunset, label: '일출 · 일몰', group: 'SCENE' },
  MILKY_WAY: { Icon: Sparkles, label: '은하수', group: 'SCENE' },
  ETC: { Icon: MapPin, label: null, group: 'ETC' },
};

const PLACE_ORDER = ['PARK', 'BEACH', 'MOUNTAIN', 'HANOK', 'FOREST', 'HERITAGE'];

// 카테고리 배열 → 노출할 항목 1개.
// 장소형 우선(PLACE_ORDER 순서), 없으면 장면형 배열 첫 번째, 둘 다 없으면 ETC.
export function pickSpotCategory(categories: string[] | undefined | null): string {
  const list = (categories ?? []).filter((c) => SPOT_CATEGORY_MAP[c]);
  const place = PLACE_ORDER.find((code) => list.includes(code));
  if (place) return place;
  const scene = list.find((c) => SPOT_CATEGORY_MAP[c].group === 'SCENE');
  if (scene) return scene;
  return 'ETC';
}

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
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.07)',
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

// ponytail: dev 전용 self-check — 카테고리 선택 우선순위 회귀 방지 (프로덕션 no-op)
if (__DEV__) {
  console.assert(pickSpotCategory(['CAFE', 'PARK']) === 'PARK', '장소형 우선순위 오류');
  console.assert(pickSpotCategory(['MOUNTAIN', 'BEACH']) === 'BEACH', '장소형 내부 우선순위(PLACE_ORDER) 오류');
  console.assert(pickSpotCategory(['CAFE', 'NIGHT_VIEW']) === 'CAFE', '장소형 없을 때 장면형 첫 항목 오류');
  console.assert(pickSpotCategory(['UNKNOWN_CODE']) === 'ETC', '미매핑 코드 → ETC 오류');
  console.assert(pickSpotCategory([]) === 'ETC', '빈 배열 → ETC 오류');
  console.assert(pickSpotCategory(undefined) === 'ETC', 'undefined → ETC 오류');
}

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
