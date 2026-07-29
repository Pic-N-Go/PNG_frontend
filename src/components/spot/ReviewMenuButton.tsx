import React from 'react';
import { Pressable } from 'react-native';
import { IconDotsVertical } from '@tabler/icons-react-native';
import { normalize } from '@/utils/normalize';

interface Props {
  onPress: () => void;
}

// 흰 배경 위 등가 명도(기존 rgba(0,0,0,0.35)). 반투명은 획이 교차하는 지점에서 알파가 겹쳐 얼룩이 생긴다.
const ICON_COLOR = '#A6A6A6';

/**
 * 내 리뷰 액션 메뉴를 여는 ⋯ 버튼. 스팟 상세 리뷰 탭과 마이페이지 내 리뷰가 같은 모양이어야 해서
 * 스타일을 한 곳에 둔다(각자 두면 크기·배경이 어긋난다 — 실제로 어긋났다).
 */
export default function ReviewMenuButton({ onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel="내 리뷰 관리"
      style={{
        width: normalize(28),
        height: normalize(28),
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <IconDotsVertical size={normalize(18)} color={ICON_COLOR} strokeWidth={2} />
    </Pressable>
  );
}
