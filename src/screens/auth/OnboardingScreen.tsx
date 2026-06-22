import React, { useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '@/navigation/AuthStack';
import { useAuthStore } from '@/store/useAuthStore';
import AuthInput from '@/components/auth/AuthInput';
import ThemePill from '@/components/auth/ThemePill';
import { THEMES } from '@/constants/themes';
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

type Props = NativeStackScreenProps<AuthStackParamList, 'Onboarding'>;

const HERO_RATIO = 200 / 844;

const NICK_RE = /^[가-힣a-zA-Z0-9]{2,10}$/;

export default function OnboardingScreen({ navigation, route }: Props) {
  const { provider } = route.params;
  const setLoggedIn = useAuthStore((s) => s.setLoggedIn);

  const { height: SCREEN_H } = useWindowDimensions();
  const initialHeroHeightRef = useRef<number | null>(null);
  const computedHeroHeight = Math.min(Math.max(SCREEN_H * HERO_RATIO, 160), 250);
  if (initialHeroHeightRef.current == null) {
    initialHeroHeightRef.current = computedHeroHeight;
  }
  const heroHeight = initialHeroHeightRef.current;

  const [nickname, setNickname] = useState('');
  const [selectedThemes, setSelectedThemes] = useState<Set<string>>(new Set());
  const [nickError, setNickError] = useState(false);

  const nickOk = NICK_RE.test(nickname.trim());

  function toggleTheme(t: string) {
    setSelectedThemes((prev) => {
      const next = new Set(prev);
      if (next.has(t)) { next.delete(t); } else { next.add(t); }
      return next;
    });
  }

  function handleStart() {
    if (!nickOk) {
      setNickError(true);
      return;
    }
    // TODO: API 연동 시 OAuth 온보딩 API 호출
    setLoggedIn(true);
  }

  const isKakao = provider === 'kakao';

  return (
    <View className="flex-1 bg-white">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
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
            <View style={{ position: 'absolute', top: 70, left: 0, right: 0, alignItems: 'center' }}>
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
                    <Text style={{ fontSize: 11, fontWeight: '700', color: '#391B1B' }}>K</Text>
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
                }}
                placeholder="2~10자 한글, 영문, 숫자"
                maxLength={10}
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
            {nickError && !nickOk && (
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
                닉네임은 2~10자 한글, 영문, 숫자만 사용할 수 있어요.
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
              style={{
                height: BUTTON_HEIGHT,
                borderRadius: BUTTON_RADIUS,
                backgroundColor: nickOk ? '#E31B59' : 'rgba(0,0,0,0.06)',
                alignItems: 'center',
                justifyContent: 'center',
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
                시작하기
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
