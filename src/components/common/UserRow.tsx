import React from 'react';
import { Pressable, Text, View } from 'react-native';
import Avatar from '@/components/common/Avatar';
import { FONT_SM, FONT_XS } from '@/constants/layout';
import { normalize } from '@/utils/normalize';
import type { FollowUserResponse } from '@/types/user';

interface Props {
  user: FollowUserResponse;
  /** 행 전체 탭 — 보통 프로필로 이동한다. 없으면 눌리지 않는다. */
  onPress?: () => void;
  /** 오른쪽 버튼(삭제·팔로잉 등). 남의 목록에서는 넘기지 않는다. */
  action?: React.ReactNode;
}

/**
 * 사용자 한 줄. 팔로워·팔로잉 목록과 검색 결과가 같은 것을 쓴다
 * (두 벌로 두면 아바타 폴백처럼 규칙이 갈라진다).
 *
 * 이름 아래는 자기소개다 — 예전에는 `@닉네임`을 한 번 더 쓰고 있었다.
 */
export default function UserRow({ user, onPress, action }: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      className="flex-row items-center"
      style={{
        paddingVertical: normalize(12),
        borderBottomWidth: 0.5,
        borderBottomColor: 'rgba(0,0,0,0.04)',
      }}
    >
      <Avatar userId={user.id} nickname={user.nickname} imageUrl={user.profileImageUrl} size={44} />

      <View style={{ flex: 1, marginLeft: normalize(12), marginRight: normalize(12) }}>
        <Text
          style={{
            fontSize: FONT_SM,
            fontFamily: 'Pretendard-SemiBold',
            color: '#000',
            letterSpacing: -0.2,
            marginBottom: normalize(2),
          }}
        >
          {user.nickname}
        </Text>
        {!!user.bio && (
          <Text
            numberOfLines={1}
            style={{
              fontSize: FONT_XS,
              fontFamily: 'Pretendard-Regular',
              color: 'rgba(0,0,0,0.35)',
              letterSpacing: -0.1,
            }}
          >
            {user.bio}
          </Text>
        )}
      </View>

      {action}
    </Pressable>
  );
}
