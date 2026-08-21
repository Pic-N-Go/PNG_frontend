import React from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { IconChevronRight } from '@tabler/icons-react-native';
import { normalize } from '@/utils/normalize';
import { CARD_RADIUS, FONT_MD, FONT_SM } from '@/constants/layout';
import { CARD, TEXT_SUB } from '@/constants/colors';
import { CollectionIcon, palOf } from '@/components/common/collectionStyle';
import { toHttps } from '@/utils/spotMappers';
import type { BookmarkCollectionDTO, SpotResponse } from '@/types/spot';
import { FALLBACK_GRADIENT } from '@/screens/mypage/components/BookmarkedSpotRow';

/** 겹쳐 보여줄 썸네일 장수. 넘치는 장수는 왼쪽 "외 N곳"이 이미 말해줘서 +n 배지를 두지 않는다. */
const THUMB_COUNT = 3;
// 38→34, 겹침 11→15. 360dp에서 이름 칼럼이 127px(≈9자)뿐이라 스택에서 폭을 20px 돌려받는다.
const THUMB = normalize(34);
/** 겹침 폭. 뒷장이 앞장을 이만큼 덮는다. */
const THUMB_OVERLAP = normalize(15);

interface Props {
  collection: BookmarkCollectionDTO;
  /** 이 컬렉션에 담긴 스팟 (최근 담은 순). 이름 미리보기와 썸네일에 쓴다. */
  spots: SpotResponse[];
  /** spots가 아직 오는 중인지. 서버 spotCount만 믿고 이름 없는 "외 N곳"을 그리지 않기 위해 필요하다. */
  isLoading?: boolean;
  onPress: () => void;
}

/**
 * MY 탭 "북마크한 스팟"의 한 줄 = 컬렉션 하나.
 * 시트에서 만든 색·아이콘을 그대로 써서, 저장할 때 고른 컬렉션이 여기서 다시 보이게 한다.
 */
export default function BookmarkCollectionRow({ collection, spots, isLoading, onPress }: Props) {
  const p = palOf(collection.color);
  // 스팟 목록이 오기 전에는 서버 spotCount로 개수만 말한다. spots.length로 갈아타면 이름이 빈
  // "외 4곳"이 한 프레임 스쳐 보인다(컬렉션 목록이 먼저 오고 스팟이 나중에 오는 구조).
  const count = isLoading ? collection.spotCount : spots.length;
  // 이름은 하나만 — 두 개를 나열하면 폭이 어떻든 두 번째가 잘린다("대구경북디자인진흥원, 강…").
  const firstName = spots[0]?.name ?? '';
  const restCount = Math.max(count - 1, 0);

  return (
    <View style={{ borderRadius: CARD_RADIUS, backgroundColor: CARD, overflow: 'hidden' }}>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`${collection.name} 컬렉션, 스팟 ${count}곳`}
        style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}
      >
        <View className="flex-row items-center" style={{ padding: normalize(10), gap: normalize(12) }}>
          <View
            className="items-center justify-center shrink-0"
            style={{ width: normalize(46), height: normalize(46), borderRadius: normalize(13), backgroundColor: p.t }}
          >
            <CollectionIcon name={collection.icon} size={normalize(22)} color={p.s} />
          </View>

          <View className="flex-1">
            <Text
              allowFontScaling={false}
              numberOfLines={1}
              className="font-semibold text-black tracking-tight"
              style={{ fontSize: FONT_MD, marginBottom: normalize(3) }}
            >
              {collection.name}
            </Text>
            {count === 0 ? (
              <Text allowFontScaling={false} className="font-normal" style={{ fontSize: FONT_SM, color: TEXT_SUB }}>
                아직 담은 스팟이 없어요
              </Text>
            ) : isLoading || !firstName ? (
              <Text allowFontScaling={false} className="font-normal" style={{ fontSize: FONT_SM, color: TEXT_SUB }}>
                {`${count}곳`}
              </Text>
            ) : (
              // 개수를 이름과 같은 Text에 넣으면 이름이 길 때 개수까지 밀려 나간다 — 따로 둬서 개수는 항상 보인다.
              <View className="flex-row items-baseline">
                <Text
                  allowFontScaling={false}
                  numberOfLines={1}
                  className="font-normal shrink"
                  style={{ fontSize: FONT_SM, color: TEXT_SUB }}
                >
                  {firstName}
                </Text>
                {restCount > 0 && (
                  <Text
                    allowFontScaling={false}
                    className="font-normal shrink-0"
                    style={{ fontSize: FONT_SM, color: TEXT_SUB }}
                  >
                    {` 외 ${restCount}곳`}
                  </Text>
                )}
              </View>
            )}
          </View>

          {/* 썸네일 스택 — 무슨 스팟이 들어 있는지 한눈에 보이는 게 이 화면의 목적이다.
              겹쳐서 폭을 아껴 이름 줄에 공간을 넘긴다. 최근 담은 것이 위로 오게 뒤에서부터 그린다. */}
          <View className="flex-row-reverse shrink-0">
            {spots
              .slice(0, THUMB_COUNT)
              .reverse()
              .map((spot, i) => (
                <Thumb
                  key={spot.id}
                  uri={toHttps(spot.thumbnailUrl ?? spot.imageUrl)}
                  // row-reverse라 첫 요소가 맨 오른쪽이다 — 그 칸만 안쪽으로 당기지 않는다.
                  overlap={i === 0 ? 0 : undefined}
                />
              ))}
          </View>

          <IconChevronRight size={normalize(18)} color={TEXT_SUB} strokeWidth={2} />
        </View>
      </Pressable>
    </View>
  );
}

function Thumb({ uri, overlap }: { uri: string | null; overlap?: number }) {
  const [failed, setFailed] = React.useState(false);
  React.useEffect(() => setFailed(false), [uri]);

  return (
    <View
      style={{
        width: THUMB,
        height: THUMB,
        borderRadius: normalize(9),
        overflow: 'hidden',
        marginRight: overlap ?? -THUMB_OVERLAP,
        // 카드 배경색 링 — 겹친 경계가 사진끼리 섞이지 않게 한다.
        borderWidth: normalize(2),
        borderColor: CARD,
      }}
    >
      {uri && !failed ? (
        <Image
          source={{ uri }}
          resizeMode="cover"
          onError={() => setFailed(true)}
          style={{ width: '100%', height: '100%' }}
        />
      ) : (
        <LinearGradient colors={FALLBACK_GRADIENT} style={{ flex: 1 }} />
      )}
    </View>
  );
}
