import React, { useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '@/navigation/AuthStack';
import AuthInput from '@/components/auth/AuthInput';
import AuthCheckbox from '@/components/auth/AuthCheckbox';
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
  HAIRLINE_WIDTH,
  SPACING_LG,
  SPACING_XL,
} from '@/constants/layout';
import { NICK_RE, NICK_MAX, nicknameError } from '@/constants/validation';
import { BRAND, CARD, HAIRLINE, TEXT_SUB } from '@/constants/colors';

type Props = NativeStackScreenProps<AuthStackParamList, 'Onboarding'>;

const HERO_RATIO = 200 / 844;


type TermModalType = 'service' | 'privacy' | 'marketing';

const TERMS_CONTENT: Record<TermModalType, { title: string; subtitle: string; body: string[] }> = {
  service: {
    title: '이용약관',
    subtitle: 'PNG 서비스 이용을 위한 기본 약관입니다.',
    body: [
      '제1조 (목적)\n본 약관은 PNG(이하 "회사")가 제공하는 스마트 출사 플래너 및 사진 촬영 명소 추천 서비스(이하 "서비스")의 이용과 관련하여 회사와 이용자 간의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.',
      '제2조 (정의)\n1. "서비스"란 회사가 제공하는 장소 정보, 지도 기반 추천, 포토 리뷰, 커뮤니티 등의 모든 제반 서비스를 의미합니다.\n2. "이용자"란 본 약관에 동의하고 서비스를 이용하는 회원 및 비회원을 말합니다.',
      '제3조 (약관의 효력 및 변경)\n회사는 필요한 경우 관련 법령을 위배하지 않는 범위 내에서 본 약관을 변경할 수 있으며, 변경된 약관은 앱 내 공지사항을 통해 공지함으로써 효력이 발생합니다.',
      '제4조 (회원가입 및 계정 관리)\n1. 이용자는 회사가 정한 양식에 따라 정보를 입력하고 본 약관에 동의함으로써 회원가입을 신청합니다.\n2. 회원은 자신의 계정 및 비밀번호를 안전하게 관리할 책임이 있으며, 타인에게 양도하거나 대여할 수 없습니다.',
      '제5조 (서비스의 제공 및 제한)\n회사는 연중무휴 24시간 서비스 제공을 원칙으로 하나, 시스템 점검 또는 통신 장애 등의 부득이한 사유가 있는 경우 서비스 제공을 일시적으로 중단할 수 있습니다.',
      '제6조 (게시물의 권리 및 책임)\n1. 회원이 서비스 내에 게시한 게시물의 저작권은 해당 게시자에게 있습니다.\n2. 회원은 타인의 명예를 훼손하거나 저작권 등 권리를 침해하는 게시물을 등록해서는 안 되며, 이로 인한 모든 책임은 회원 본인에게 있습니다.'
    ]
  },
  privacy: {
    title: '개인정보 수집 및 이용 동의',
    subtitle: '원활한 서비스 제공을 위해 최소한의 개인정보를 수집합니다.',
    body: [
      '1. 개인정보 수집 및 이용 목적\n• 회원 식별, 본인 확인, 회원제 서비스 제공 및 고객 상담\n• 위치 기반 주변 출사지 및 사진 촬영 명소 추천, 길안내 연동\n• 사진 업로드 및 포토 리뷰 커뮤니티 서비스 제공\n• 서비스 부정 이용 방지 및 계정 보호',
      '2. 수집하는 개인정보 항목\n• [필수] 이메일 주소, 닉네임, 카카오 계정 고유 식별자\n• [선택] 프로필 사진, 위치 정보(GPS), 업로드 사진 및 EXIF 메타데이터\n• [자동 생성] 기기 식별자(FCM 푸시 토큰), 접속 로그, 서비스 이용 기록',
      '3. 개인정보의 보유 및 이용 기간\n• 회원 탈퇴 시 계정을 즉시 비활성화하며, 계정 복구 지원을 위해 탈퇴일로부터 30일간 보관 후 영구 파기합니다.\n• 단, 전자상거래법 등 관계 법령에 따라 보존 의무가 있는 경우 해당 법정 기간 동안 보관합니다.',
      '4. 동의를 거부할 권리 및 거부 시 불이익\n• 귀하는 본 개인정보 수집 및 이용에 대한 동의를 거부할 권리가 있습니다.\n• 단, 필수 항목에 대한 동의를 거부할 경우 회원가입 및 서비스 이용이 제한될 수 있습니다.'
    ]
  },
  marketing: {
    title: '마케팅 정보 수신 동의 (선택)',
    subtitle: '이벤트 및 맞춤형 혜택 정보를 받아보실 수 있습니다.',
    body: [
      '1. 마케팅 및 광고 활용 목적\n• 신규 출사지 및 촬영 명소 추천, 시즌별 테마 이벤트, 프로모션 및 혜택 정보 안내\n• 서비스 관련 설문 조사 및 맞춤형 콘텐츠 제공',
      '2. 수신 안내 매체\n• 앱 푸시(Push) 알림, 이메일',
      '3. 동의 철회 안내\n• 귀하는 본 동의를 거부할 권리가 있으며, 동의하지 않더라도 PNG의 기본 서비스 이용에는 아무런 제한이 없습니다.\n• 수신 동의는 앱 내 [마이페이지 > 설정]에서 언제든지 자유롭게 변경 또는 철회할 수 있습니다.'
    ]
  }
};

export default function OnboardingScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const { provider, tokens } = route.params;
  const accessToken = tokens?.accessToken;
  const user = tokens?.user;
  const setAuth = useAuthStore((s) => s.setAuth);

  const { height: SCREEN_H } = useWindowDimensions();
  const initialHeroHeightRef = useRef<number | null>(null);
  const computedHeroHeight = Math.min(Math.max(SCREEN_H * HERO_RATIO, 160), 250);
  if (initialHeroHeightRef.current == null) {
    initialHeroHeightRef.current = computedHeroHeight;
  }
  const heroHeight = initialHeroHeightRef.current;

  const [nickname, setNickname] = useState(user?.nickname ?? '');
  const [selectedThemes, setSelectedThemes] = useState<Set<string>>(new Set());
  const [term1, setTerm1] = useState(false);
  const [term2, setTerm2] = useState(false);
  const [term3, setTerm3] = useState(false);
  const [activeTermModal, setActiveTermModal] = useState<TermModalType | null>(null);
  const [showTermsErr, setShowTermsErr] = useState(false);
  const [nickError, setNickError] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const nickOk = NICK_RE.test(nickname.trim());
  const termsOk = term1 && term2;
  const allOk = nickOk && termsOk;

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
    if (!termsOk) {
      setShowTermsErr(true);
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
      await setAuth({ ...tokens!, user: updated });
    } catch (err) {
      setSubmitError(
        err instanceof ApiError ? err.message : '저장하지 못했어요. 잠시 후 다시 시도해 주세요.',
      );
      setSubmitting(false);
    }
  }

  function toggleAllTerms() {
    if (term1 && term2 && term3) {
      setTerm1(false);
      setTerm2(false);
      setTerm3(false);
    } else {
      setTerm1(true);
      setTerm2(true);
      setTerm3(true);
      setShowTermsErr(false);
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
          <View style={{ height: heroHeight }}>
            <LinearGradient
              colors={['#1a1530', '#2d1b4e', '#8b4a6b', '#d4856a']}
              locations={[0, 0.3, 0.7, 1]}
              style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
            />
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
                    <Text style={{ fontSize: FONT_XS, fontFamily: 'Pretendard-SemiBold', color: '#391B1B' }}>K</Text>
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
            <View style={{ position: 'absolute', bottom: 16, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 5 }}>
              <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: 'rgba(255,255,255,0.35)' }} />
              <View style={{ width: 16, height: 5, borderRadius: 2.5, backgroundColor: 'rgba(255,255,255,0.9)' }} />
            </View>
          </View>
          <LinearGradient colors={['#d4856a', '#ffffff']} style={{ height: 40, marginTop: -1 }} />
          <View style={{ paddingHorizontal: CONTENT_PADDING, paddingTop: SPACING_XL + 12, paddingBottom: 48 }}>
            <Text
              style={{
                fontSize: FONT_XS,
                color: BRAND,
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
            {!!user && (
              <View className="items-center" style={{ marginBottom: SPACING_XL }}>
                <Avatar userId={user.id} nickname={user.nickname} imageUrl={user.profileImageUrl} size={80} />
              </View>
            )}
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
              <Text className="font-normal" style={{ color: BRAND }}>*</Text>
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
            <View style={{ height: 0.5, backgroundColor: 'rgba(0,0,0,0.08)', marginVertical: SPACING_LG }} />
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
            <View style={{ height: 0.5, backgroundColor: 'rgba(0,0,0,0.08)', marginVertical: SPACING_LG }} />
            <Text
              style={{
                fontSize: FONT_SM,
                color: 'rgba(0,0,0,0.5)',
                letterSpacing: -0.08,
                marginBottom: 10,
                paddingLeft: 2,
                fontFamily: 'Pretendard-Medium',
              }}
            >
              약관 동의
            </Text>
            <View
              style={{
                backgroundColor: CARD,
                borderRadius: 14,
                padding: 14,
                marginBottom: showTermsErr ? 10 : SPACING_XL,
              }}
            >
              <Pressable
                onPress={toggleAllTerms}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                  paddingBottom: 14,
                  borderBottomWidth: HAIRLINE_WIDTH,
                  borderBottomColor: HAIRLINE,
                  marginBottom: 14,
                }}
              >
                <AuthCheckbox checked={term1 && term2 && term3} size="md" />
                <Text style={{ fontSize: FONT_MD, color: '#000', letterSpacing: -0.2, fontFamily: 'Pretendard-Medium' }}>
                  전체 동의
                </Text>
              </Pressable>
              <TermItem
                checked={term1}
                onToggle={() => {
                  setTerm1((v) => !v);
                  setShowTermsErr(false);
                }}
                label="[필수] 이용약관 동의"
                onPressView={() => setActiveTermModal('service')}
              />
              <TermItem
                checked={term2}
                onToggle={() => {
                  setTerm2((v) => !v);
                  setShowTermsErr(false);
                }}
                label="[필수] 개인정보 수집 · 이용 동의"
                onPressView={() => setActiveTermModal('privacy')}
              />
              <TermItem
                checked={term3}
                onToggle={() => setTerm3((v) => !v)}
                label="[선택] 마케팅 정보 수신 동의"
                onPressView={() => setActiveTermModal('marketing')}
              />
            </View>
            {showTermsErr && (
              <Text
                style={{
                  fontSize: FONT_XS,
                  color: '#FF3B30',
                  letterSpacing: -0.1,
                  paddingLeft: 4,
                  marginBottom: SPACING_XL,
                  fontFamily: 'Pretendard-Regular',
                }}
              >
                필수 약관 2개 모두 동의해 주세요.
              </Text>
            )}
            <Pressable
              onPress={handleStart}
              disabled={submitting}
              className="items-center justify-center"
              style={{
                height: BUTTON_HEIGHT,
                borderRadius: BUTTON_RADIUS,
                backgroundColor: allOk ? BRAND : 'rgba(0,0,0,0.06)',
                opacity: submitting ? 0.6 : 1,
              }}
            >
              <Text
                style={{
                  fontSize: FONT_LG,
                  color: allOk ? '#fff' : 'rgba(0,0,0,0.3)',
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

      {/* ── Terms Detail Modal ── */}
      <Modal
        visible={activeTermModal !== null}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setActiveTermModal(null)}
      >
        {activeTermModal && (
          <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }} edges={['top', 'left', 'right', 'bottom']}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingHorizontal: CONTENT_PADDING,
                paddingVertical: 16,
                borderBottomWidth: HAIRLINE_WIDTH,
                borderBottomColor: HAIRLINE,
              }}
            >
              <Text style={{ fontSize: FONT_LG, color: '#000', fontFamily: 'Pretendard-SemiBold' }}>
                {TERMS_CONTENT[activeTermModal].title}
              </Text>
              <Pressable onPress={() => setActiveTermModal(null)} hitSlop={12} style={{ padding: 4 }}>
                <Feather name="x" size={24} color="#000" />
              </Pressable>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={true}
              contentContainerStyle={{ padding: CONTENT_PADDING, paddingBottom: 30 }}
            >
              <Text style={{ fontSize: FONT_SM, color: TEXT_SUB, marginBottom: 16, fontFamily: 'Pretendard-Regular' }}>
                {TERMS_CONTENT[activeTermModal].subtitle}
              </Text>

              {TERMS_CONTENT[activeTermModal].body.map((paragraph, index) => (
                <View
                  key={index}
                  style={{
                    backgroundColor: CARD,
                    borderRadius: 12,
                    padding: 16,
                    marginBottom: 12,
                  }}
                >
                  <Text style={{ fontSize: FONT_SM, color: '#333', lineHeight: 22, fontFamily: 'Pretendard-Regular' }}>
                    {paragraph}
                  </Text>
                </View>
              ))}
            </ScrollView>

            <View
              style={{
                padding: CONTENT_PADDING,
                borderTopWidth: HAIRLINE_WIDTH,
                borderTopColor: HAIRLINE,
                backgroundColor: '#fff',
              }}
            >
              <Pressable
                onPress={() => {
                  if (activeTermModal === 'service') setTerm1(true);
                  if (activeTermModal === 'privacy') setTerm2(true);
                  if (activeTermModal === 'marketing') setTerm3(true);
                  setShowTermsErr(false);
                  setActiveTermModal(null);
                }}
                style={{
                  height: BUTTON_HEIGHT,
                  borderRadius: BUTTON_RADIUS,
                  backgroundColor: BRAND,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ fontSize: FONT_MD, color: '#fff', fontFamily: 'Pretendard-Medium' }}>
                  동의하고 닫기
                </Text>
              </Pressable>
            </View>
          </SafeAreaView>
        )}
      </Modal>
    </View>
  );
}

function TermItem({
  checked,
  onToggle,
  label,
  onPressView,
}: {
  checked: boolean;
  onToggle: () => void;
  label: string;
  onPressView: () => void;
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 6,
      }}
    >
      <Pressable
        onPress={onToggle}
        hitSlop={4}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}
      >
        <AuthCheckbox checked={checked} size="sm" />
        <Text
          style={{
            fontSize: FONT_SM,
            color: 'rgba(0,0,0,0.65)',
            letterSpacing: -0.1,
            fontFamily: 'Pretendard-Regular',
            flex: 1,
          }}
        >
          {label}
        </Text>
      </Pressable>
      <Pressable
        onPress={onPressView}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 2,
          paddingVertical: 4,
          paddingHorizontal: 8,
          backgroundColor: 'rgba(0,0,0,0.04)',
          borderRadius: 6,
        }}
      >
        <Text style={{ fontSize: FONT_XS, color: 'rgba(0,0,0,0.45)', fontFamily: 'Pretendard-Medium' }}>보기</Text>
        <Feather name="chevron-right" size={12} color="rgba(0,0,0,0.45)" />
      </Pressable>
    </View>
  );
}
