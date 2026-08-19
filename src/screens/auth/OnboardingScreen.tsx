import React, { useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '@/navigation/AuthStack';
import AuthInput from '@/components/auth/AuthInput';
import ThemePill from '@/components/auth/ThemePill';
import Avatar from '@/components/common/Avatar';
import { THEMES, THEME_CATEGORY_MAP } from '@/constants/themes';
import { userApi } from '@/api/user';
import { ApiError } from '@/api/auth';
import { useAuthStore } from '@/store/useAuthStore';
import {
  BUTTON_HEIGHT,
  BUTTON_RADIUS,
  CONTENT_PADDING,
  FONT_LG,
  FONT_MD,
  FONT_SM,
  FONT_XS,
  FONT_2XL,
  SPACING_LG,
  SPACING_XL,
} from '@/constants/layout';
import { NICK_RE, NICK_MAX, nicknameError } from '@/constants/validation';

type Props = NativeStackScreenProps<AuthStackParamList, 'Onboarding'>;

const HERO_RATIO = 200 / 844;


export default function OnboardingScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const { provider, accessToken, user } = route.params;
  const setAuth = useAuthStore((s) => s.setAuth);

  const { height: SCREEN_H } = useWindowDimensions();
  const initialHeroHeightRef = useRef<number | null>(null);
  const computedHeroHeight = Math.min(Math.max(SCREEN_H * HERO_RATIO, 160), 250);
  if (initialHeroHeightRef.current == null) {
    initialHeroHeightRef.current = computedHeroHeight;
  }
  const heroHeight = initialHeroHeightRef.current;

  // 서버가 카카오 닉네임을 규칙에 맞게 다듬고 중복이면 접미사까지 붙여 내려준다.
  // 그 값을 그대로 채워두고 사용자가 확인·수정하게 한다.
  const [nickname, setNickname] = useState(user?.nickname ?? '');
  const [selectedThemes, setSelectedThemes] = useState<Set<string>>(new Set());
  const [nickError, setNickError] = useState(false);
  /** 서버가 돌려준 실패 사유(중복 등). 형식 오류 문구와 자리를 공유한다. */
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const nickOk = NICK_RE.test(nickname.trim());

  function toggleTheme(t: string) {
    setSelectedThemes((prev) => {
      const next = new Set(prev);
      if (next.has(t)) { next.delete(t); } else { next.add(t); }
      return next;
    });
  }

  async function handleStart() {
    if (!nickOk || submitting) {
      setNickError(true);
      return;
    }
    // 애플은 아직 미연동이라 토큰 없이 들어온다 — setAuth로 가짜 세션을 만들지 말 것.
    if (!accessToken || !user) {
      Alert.alert('준비 중', '아직 지원하지 않는 로그인 방식이에요.');
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    try {
      // 닉네임이 먼저다 — 중복이면 여기서 실패하고, 관심 테마는 저장되지 않아야 한다.
      // PUT /users/me는 전체 교체라 건드리지 않는 값도 함께 보낸다.
      // 사진은 여기서 보내지 않는다 — 서버가 준 값은 presigned URL이라 되돌려 보내면 죽은
      // URL이 저장된다. 카카오 사진은 이미 서버에 있고 그대로 유지된다.
      let updated = await userApi.updateMyProfile(
        { nickname: nickname.trim(), bio: null },
        accessToken,
      );
      if (selectedThemes.size > 0) {
        updated = await userApi.updateSpotCategories(
          Array.from(selectedThemes, (t) => THEME_CATEGORY_MAP[t]),
          accessToken,
        );
      }
      // 여기서 비로소 로그인이 완료된다 → 앱이 MainTab으로 전환된다.
      setAuth(accessToken, updated);
    } catch (err) {
      setSubmitError(
        err instanceof ApiError ? err.message : '저장하지 못했어요. 잠시 후 다시 시도해 주세요.',
      );
      setSubmitting(false);
    }
  }

  const isKakao = provider === 'kakao';

  return (
    <View className="flex-1 bg-white">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView bounces={false} showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>
          {/* ── Hero Header ── */}
          <View style={{ height: heroHeight }}>
            <LinearGradient
              colors={['#1a1530', '#2d1b4e', '#8b4a6b', '#d4856a']}
              locations={[0, 0.3, 0.7, 1]}
              style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
            />

            {/* Stars */}
            {[
              { top: 68, left: 60 },
              { top: 50, left: 140, opacity: 0.3 },
              { top: 80, left: 230, opacity: 0.25 },
              { top: 62, left: 320, opacity: 0.3 },
            ].map((s, i) => (
              <View
                key={i}
                style={{
                  position: 'absolute',
                  top: s.top,
                  left: s.left,
                  width: 2,
                  height: 2,
                  borderRadius: 1,
                  backgroundColor: `rgba(255,255,255,${s.opacity ?? 0.4})`,
                }}
              />
            ))}

            {/* Landscape placeholder */}
            <View
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: 30,
                backgroundColor: 'rgba(0,0,0,0.1)',
                borderTopLeftRadius: 6,
                borderTopRightRadius: 6,
              }}
            />

            {/* Provider Badge */}
            <View style={{ position: 'absolute', top: insets.top + 12, left: 0, right: 0, alignItems: 'center' }}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  backgroundColor: 'rgba(255,255,255,0.15)',
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.25)',
                  borderRadius: 20,
                  paddingVertical: 6,
                  paddingLeft: 10,
                  paddingRight: 14,
                }}
              >
                {/* Provider icon */}
                <View
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 11,
                    backgroundColor: isKakao ? '#FEE500' : '#000',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {isKakao ? (
                    <Text style={{ fontSize: FONT_XS, fontWeight: '700', color: '#391B1B' }}>K</Text>
                  ) : (
                    <Feather name="smartphone" size={12} color="#fff" />
                  )}
                </View>
                <Text
                  style={{
                    fontSize: FONT_SM,
                    color: 'rgba(255,255,255,0.9)',
                    letterSpacing: -0.2,
                    fontFamily: 'Pretendard-Medium',
                  }}
                >
                  {isKakao ? '카카오로 계속하기' : 'Apple로 계속하기'}
                </Text>
              </View>
            </View>

            {/* Step dots */}
            <View style={{ position: 'absolute', bottom: 16, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 5 }}>
              <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: 'rgba(255,255,255,0.35)' }} />
              <View style={{ width: 16, height: 5, borderRadius: 2.5, backgroundColor: 'rgba(255,255,255,0.9)' }} />
            </View>
          </View>

          {/* Fade */}
          <LinearGradient colors={['#d4856a', '#ffffff']} style={{ height: 40, marginTop: -1 }} />

          {/* ── Content ── */}
          <View style={{ paddingHorizontal: CONTENT_PADDING, paddingTop: SPACING_XL + 12, paddingBottom: 48 }}>
            <Text
              style={{
                fontSize: FONT_XS,
                color: '#E31B59',
                letterSpacing: 0.5,
                textTransform: 'uppercase',
                marginBottom: 6,
                fontFamily: 'Pretendard-Medium',
              }}
            >
              마지막 단계
            </Text>
            <Text
              style={{
                fontSize: FONT_2XL,
                color: '#000',
                letterSpacing: -0.7,
                lineHeight: 36,
                marginBottom: 6,
                fontFamily: 'Pretendard-SemiBold',
              }}
            >
              거의 다 왔어요!
            </Text>
            <Text
              style={{
                fontSize: FONT_MD,
                color: 'rgba(0,0,0,0.45)',
                letterSpacing: -0.2,
                lineHeight: 22,
                marginBottom: SPACING_XL,
                fontFamily: 'Pretendard-Regular',
              }}
            >
              {'PNG에서 사용할 닉네임을 설정해주세요.\n나중에 프로필에서 변경할 수 있어요.'}
            </Text>

            {/* 카카오 프로필 사진. 서버가 가입 시 저장해 응답에 실어준다(http는 https로 변환됨).
                사진이 없는 계정은 Avatar가 이니셜로 대체한다. 여기서 사진을 바꾸지는 못한다 —
                업로드 엔드포인트가 아직 없어서 버튼을 달면 눌러도 아무 일이 없다. */}
            {!!user && (
              <View style={{ alignItems: 'center', marginBottom: SPACING_XL }}>
                <Avatar userId={user.id} nickname={user.nickname} imageUrl={user.profileImageUrl} size={80} />
              </View>
            )}

            {/* Nickname */}
            <Text
              style={{
                fontSize: FONT_SM,
                color: 'rgba(0,0,0,0.5)',
                letterSpacing: -0.08,
                marginBottom: 6,
                paddingLeft: 2,
                fontFamily: 'Pretendard-Medium',
              }}
            >
              닉네임{' '}
              <Text style={{ color: '#E31B59' }}>*</Text>
            </Text>
            <View style={{ position: 'relative', marginBottom: 6 }}>
              <AuthInput
                icon="user"
                value={nickname}
                onChangeText={(t) => {
                  setNickname(t);
                  setNickError(false);
                  setSubmitError(null);
                }}
                placeholder="2~10자 한글, 영문, 숫자"
                maxLength={NICK_MAX}
                isInvalid={nickError && !nickOk}
              />
              <Text
                style={{
                  position: 'absolute',
                  right: 16,
                  top: '50%',
                  transform: [{ translateY: -8 }],
                  fontSize: FONT_XS,
                  color: 'rgba(0,0,0,0.15)',
                  fontFamily: 'Pretendard-Regular',
                  pointerEvents: 'none',
                }}
              >
                {nickname.length}/10
              </Text>
            </View>
            {((nickError && !nickOk) || !!submitError) && (
              <Text
                style={{
                  fontSize: FONT_XS,
                  color: '#FF3B30',
                  letterSpacing: -0.1,
                  marginBottom: 4,
                  paddingLeft: 4,
                  fontFamily: 'Pretendard-Regular',
                }}
              >
                {nickError && !nickOk ? nicknameError(nickname) : submitError}
              </Text>
            )}

            {/* Divider */}
            <View style={{ height: 0.5, backgroundColor: 'rgba(0,0,0,0.08)', marginVertical: SPACING_LG }} />

            {/* Interest Themes */}
            <Text
              style={{
                fontSize: FONT_SM,
                color: 'rgba(0,0,0,0.5)',
                letterSpacing: -0.08,
                marginBottom: 8,
                paddingLeft: 2,
                fontFamily: 'Pretendard-Medium',
              }}
            >
              관심 테마{' '}
              <Text style={{ color: 'rgba(0,0,0,0.35)', fontFamily: 'Pretendard-Regular' }}>(선택, 복수가능)</Text>
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: SPACING_XL }}>
              {THEMES.map((t) => (
                <ThemePill
                  key={t}
                  label={t}
                  selected={selectedThemes.has(t)}
                  onPress={() => toggleTheme(t)}
                />
              ))}
            </View>

            {/* Start Button */}
            <Pressable
              onPress={handleStart}
              disabled={submitting}
              style={{
                height: BUTTON_HEIGHT,
                borderRadius: BUTTON_RADIUS,
                backgroundColor: nickOk ? '#E31B59' : 'rgba(0,0,0,0.06)',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: submitting ? 0.6 : 1,
              }}
            >
              <Text
                style={{
                  fontSize: FONT_LG,
                  color: nickOk ? '#fff' : 'rgba(0,0,0,0.3)',
                  letterSpacing: -0.3,
                  fontFamily: 'Pretendard-Medium',
                }}
              >
                {submitting ? '저장 중...' : '시작하기'}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
