import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IconChevronLeft } from '@tabler/icons-react-native';
import { normalize } from '@/utils/normalize';
import { FONT_LG, FONT_SM, FONT_XS, HAIRLINE_WIDTH } from '@/constants/layout';
import UserRow from '@/components/common/UserRow';
import Toast from '@/components/common/Toast';
import ConfirmModal from '@/components/common/ConfirmModal';
import { useBlockedUsers, useToggleBlock } from '@/hooks/useCommunity';
import { toErrorMessage } from '@/api/auth';
import type { BlockedUserDTO } from '@/types/community';
import { BRAND, CARD, HAIRLINE, iconGray } from '@/constants/colors';

/**
 * 설정 > 차단 목록. App Store 가이드라인 1.2는 차단 수단과 함께 되돌릴 방법도 요구한다 —
 * 게시글 액션시트에서 차단만 되고 해제할 곳이 없으면 심사에서 걸린다.
 *
 * 행을 눌러 프로필로 보내지 않는다. 차단한 사람의 프로필로 들어가는 동선은 목적에 어긋난다.
 */
export default function BlockedUsersScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();

  const { data: blocked = [], isLoading } = useBlockedUsers();
  const toggleBlock = useToggleBlock();

  const [pendingUnblock, setPendingUnblock] = useState<BlockedUserDTO | null>(null);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setToastVisible(true);
  };

  const handleConfirmUnblock = () => {
    if (!pendingUnblock || toggleBlock.isPending) return;
    const { id, nickname } = pendingUnblock;
    toggleBlock.mutate(
      { userId: id, next: false },
      {
        onSuccess: () => {
          setPendingUnblock(null);
          showToast(`${nickname}님 차단을 해제했어요`);
        },
        onError: (err) => {
          setPendingUnblock(null);
          showToast(toErrorMessage(err, '차단을 해제하지 못했어요'));
        },
      },
    );
  };

  const renderItem = (user: BlockedUserDTO) => (
    <UserRow
      key={user.id}
      // 차단 목록 응답에는 자기소개가 없다 — UserRow는 bio가 비면 그 줄을 그리지 않는다.
      user={{ id: user.id, nickname: user.nickname, profileImageUrl: user.profileImageUrl, bio: null }}
      action={
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setPendingUnblock(user)}
          disabled={toggleBlock.isPending}
          style={{
            height: normalize(30),
            paddingHorizontal: normalize(14),
            borderRadius: normalize(15),
            backgroundColor: CARD,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: toggleBlock.isPending ? 0.5 : 1,
          }}
        >
          <Text style={{ fontSize: FONT_XS, fontFamily: 'Pretendard-Medium', color: 'rgba(0,0,0,0.45)' }}>
            차단 해제
          </Text>
        </TouchableOpacity>
      }
    />
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#fff', paddingTop: insets.top }}>
      <View
        className="flex-row items-center justify-between"
        style={{
          height: normalize(54),
          paddingHorizontal: normalize(20),
          borderBottomWidth: HAIRLINE_WIDTH,
          borderBottomColor: HAIRLINE,
        }}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{
            width: normalize(36),
            height: normalize(36),
            alignItems: 'center',
            justifyContent: 'center',
            marginLeft: -normalize(8),
          }}
        >
          <IconChevronLeft size={normalize(24)} color={iconGray(0.5)} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={{ fontSize: FONT_LG, fontFamily: 'Pretendard-SemiBold', color: '#000', letterSpacing: -0.3 }}>
          차단 목록
        </Text>
        <View style={{ width: normalize(36) }} />
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: normalize(20),
          paddingTop: normalize(4),
          paddingBottom: normalize(40),
        }}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <View style={{ paddingVertical: normalize(40), alignItems: 'center' }}>
            <ActivityIndicator size="small" color={BRAND} />
          </View>
        ) : blocked.length > 0 ? (
          blocked.map(renderItem)
        ) : (
          <View style={{ paddingVertical: normalize(40), alignItems: 'center' }}>
            <Text style={{ fontSize: FONT_SM, fontFamily: 'Pretendard-Regular', color: 'rgba(0,0,0,0.3)' }}>
              차단한 사용자가 없어요
            </Text>
          </View>
        )}
      </ScrollView>

      <ConfirmModal
        visible={!!pendingUnblock}
        title={pendingUnblock ? `${pendingUnblock.nickname}님 차단을 해제할까요?` : '차단을 해제할까요?'}
        body="해제하면 이 사용자의 게시글이 다시 보여요. 끊긴 팔로우는 돌아오지 않아요."
        confirmLabel="해제"
        cancelLabel="취소"
        onConfirm={handleConfirmUnblock}
        onCancel={() => setPendingUnblock(null)}
      />

      <Toast visible={toastVisible} message={toastMessage} onHide={() => setToastVisible(false)} />
    </View>
  );
}
