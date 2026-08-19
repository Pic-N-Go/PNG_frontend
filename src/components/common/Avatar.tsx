import React from 'react';
import { Image, Text, View } from 'react-native';
import { FONT_2XS, FONT_MD, FONT_XL } from '@/constants/layout';
import { normalize } from '@/utils/normalize';

/**
 * 프로필 사진이 없을 때 쓰는 배경색. 흰 이니셜이 읽히도록 전부 어둡게 골랐다.
 * 이 목록이 유일한 출처다 — 화면마다 팔레트를 따로 두면 같은 사람이 피드와 팔로워 목록에서 다른 색이 된다.
 */
const FALLBACK_COLORS = [
  '#2c5364',
  '#4a3060',
  '#6b3a2a',
  '#1a4a3a',
  '#2a2a5a',
  '#1a3a5a',
  '#3a4a2a',
];

/**
 * 같은 사용자면 항상 같은 색이어야 한다 — 랜덤이면 리렌더마다, 화면마다 색이 바뀐다.
 *
 * 커뮤니티는 문자열 id("42"), 마이페이지·팔로우 목록은 숫자 id(42)를 넘긴다. 그래서 숫자로
 * 읽히는 값은 반드시 숫자로 환산한다 — 문자 코드 합으로 처리하면 "42"와 42가 다른 색이 되어
 * 고치려던 문제(화면마다 색이 다름)가 그대로 남는다.
 */
function colorOf(userId?: string | number | null): string {
  if (userId == null || userId === '') return FALLBACK_COLORS[0];
  const asNumber = Number(userId);
  const seed = Number.isFinite(asNumber)
    ? Math.trunc(asNumber)
    : [...String(userId)].reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return FALLBACK_COLORS[Math.abs(seed) % FALLBACK_COLORS.length];
}

/** 닉네임 앞 글자. 한글은 1글자, 영문은 2글자가 목업과 가장 비슷하다. */
export function initialsOf(nickname?: string | null): string {
  const trimmed = (nickname ?? '').trim();
  if (!trimmed) return '?';
  const isHangul = /[가-힣]/.test(trimmed[0]);
  return (isHangul ? trimmed.slice(0, 1) : trimmed.slice(0, 2)).toUpperCase();
}

/** 원 지름에 맞는 폰트 토큰. 8단계 스케일 밖의 크기를 만들지 않도록 매핑으로 둔다. */
function fontFor(size: number): number {
  if (size <= 34) return FONT_2XS;
  if (size <= 48) return FONT_MD;
  return FONT_XL;
}

interface Props {
  /** 색을 고르는 씨앗. 같은 사용자가 어느 화면에서든 같은 색이 되도록 항상 넘긴다. */
  userId?: string | number | null;
  nickname?: string | null;
  imageUrl?: string | null;
  /** 원 지름(디자인 기준 px). normalize는 내부에서 적용한다. */
  size: number;
}

/**
 * 사용자 아바타. 사진이 있으면 사진, 없으면 userId로 고른 배경색 + 닉네임 이니셜.
 *
 * 이 컴포넌트만 쓸 것. 이전에는 피드·댓글·팔로워 목록·마이페이지가 각자 폴백을 그려서
 * 팔레트 두 벌(5색/7색)과 이니셜 규칙 두 벌이 공존했고, 같은 사람이 화면마다 다르게 보였다.
 */
export default function Avatar({ userId, nickname, imageUrl, size }: Props) {
  const diameter = normalize(size);
  return (
    <View
      className="items-center justify-center overflow-hidden"
      style={{
        width: diameter,
        height: diameter,
        borderRadius: diameter / 2,
        backgroundColor: colorOf(userId),
      }}
    >
      {imageUrl ? (
        <Image source={{ uri: imageUrl }} resizeMode="cover" style={{ width: '100%', height: '100%' }} />
      ) : (
        <Text
          allowFontScaling={false}
          style={{
            fontFamily: 'Pretendard-SemiBold',
            fontSize: fontFor(size),
            color: 'rgba(255,255,255,0.9)',
            letterSpacing: -0.1,
          }}
        >
          {initialsOf(nickname)}
        </Text>
      )}
    </View>
  );
}
