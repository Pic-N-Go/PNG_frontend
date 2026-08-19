import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { IconEdit, IconTrash } from '@tabler/icons-react-native';
import BottomSheet from '@/components/common/BottomSheet';
import { FONT_LG, GRID_PADDING } from '@/constants/layout';
import { normalize, normalizeFontSize } from '@/utils/normalize';

interface Props {
  visible: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

// 흰 배경 위 등가 명도. 반투명(rgba)으로 두면 획이 교차하는 지점에서 알파가 겹쳐 얼룩이 생긴다.
const ICON_GRAY = '#808080';
const DESTRUCTIVE = '#ff453a';

/**
 * 내 리뷰 액션 메뉴. 스팟 상세 리뷰 탭과 마이페이지 내 리뷰 두 곳에서 쓴다.
 * OptionSheet는 "N개 중 하나 고르기"용(체크 표시·selected 필수)이라 액션 메뉴엔 맞지 않아
 * BottomSheet에 항목만 얹었다. 구성은 다른 시트의 제목+행 패턴을 따른다.
 */
export default function ReviewActionSheet({ visible, onClose, onEdit, onDelete }: Props) {
  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View style={{ paddingHorizontal: GRID_PADDING, paddingTop: normalize(16), paddingBottom: normalize(12) }}>
        {/* 다른 시트들은 18px을 쓰지만 18은 폰트 토큰 밖이라 FONT_LG(17)로 맞췄다. */}
        <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_LG, color: '#000', letterSpacing: -0.35 }}>
          내 리뷰
        </Text>
      </View>
      <View style={{ paddingHorizontal: GRID_PADDING, paddingBottom: normalize(12) }}>
        <Pressable
          onPress={onEdit}
          accessibilityRole="button"
          accessibilityLabel="리뷰 수정하기"
          style={{ flexDirection: 'row', alignItems: 'center', gap: normalize(12), paddingVertical: normalize(14) }}
        >
          <IconEdit size={normalize(20)} color={ICON_GRAY} strokeWidth={2} />
          <Text allowFontScaling={false} style={{ flex: 1, fontSize: normalizeFontSize(14), color: '#000', letterSpacing: -0.15 }}>
            수정하기
          </Text>
        </Pressable>
        <Pressable
          onPress={onDelete}
          accessibilityRole="button"
          accessibilityLabel="리뷰 삭제하기"
          style={{ flexDirection: 'row', alignItems: 'center', gap: normalize(12), paddingVertical: normalize(14) }}
        >
          <IconTrash size={normalize(20)} color={DESTRUCTIVE} strokeWidth={2} />
          <Text allowFontScaling={false} style={{ flex: 1, fontSize: normalizeFontSize(14), color: DESTRUCTIVE, letterSpacing: -0.15 }}>
            삭제하기
          </Text>
        </Pressable>
      </View>
    </BottomSheet>
  );
}
