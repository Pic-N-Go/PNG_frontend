import React, { useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useMutation } from '@tanstack/react-query';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '@/navigation/AuthStack';
import { useAuthStore } from '@/store/useAuthStore';
import { authApi, toErrorMessage } from '@/api/auth';
import Toast from '@/components/common/Toast';
import AuthInput from '@/components/auth/AuthInput';
import AuthCheckbox from '@/components/auth/AuthCheckbox';
import ThemePill from '@/components/auth/ThemePill';
import { THEMES, THEME_CATEGORY_MAP } from '@/constants/themes';
import { BORDER_CONTROL, BUTTON_HEIGHT, BUTTON_RADIUS, CONTENT_PADDING, FONT_2XL, FONT_LG, FONT_MD, FONT_SM, FONT_XS, HAIRLINE_WIDTH, INPUT_HEIGHT, INPUT_RADIUS, SPACING_LG, SPACING_MD, SPACING_XL } from '@/constants/layout';
import { NICK_RE, NICK_MAX, nicknameError, passwordError } from '@/constants/validation';
import { BRAND, CARD, HAIRLINE, TEXT_SUB } from '@/constants/colors';

type Props = NativeStackScreenProps<AuthStackParamList, 'Signup'>;

const HERO_RATIO = 160 / 844;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getPwStrength(val: string): number {
  if (val.length < 4) return 0;
  const hasLetter = /[a-zA-Z]/.test(val);
  const hasDigit = /[0-9]/.test(val);
  const hasSpecial = /[^a-zA-Z0-9]/.test(val);
  if (val.length >= 12 && hasLetter && hasDigit && hasSpecial) return 4;
  if (val.length >= 8 && hasLetter && hasDigit && hasSpecial) return 3;
  if (val.length >= 8 && hasLetter && hasDigit) return 2;
  return 1;
}

// 성공 상태(인증 완료·안전한 비밀번호). iOS 시스템 그린(#34C759)은 채도가 높아 흑·백·핑크
// 팔레트에서 혼자 튀어, 의미는 유지하고 톤만 낮춘 딥 그린을 쓴다.
const SUCCESS = '#2A9D6E';
const STRENGTH_COLORS = ['rgba(0,0,0,0.06)', '#FF453A', '#FF9F0A', SUCCESS, SUCCESS];

type TermModalType = 'service' | 'privacy' | 'marketing';

const TERMS_CONTENT: Record<TermModalType, { title: string; subtitle: string; body: string[] }> = {
  service: {
    title: '이용약관',
    subtitle: 'PNG 서비스 이용을 위한 기본 약관입니다.',
    body: [
      '제1조 (목적)\n본 약관은 PNG(이하 "회사")가 제공하는 피크닉 및 사진 명소 추천 서비스(이하 "서비스")의 이용과 관련하여 회사와 이용자 간의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.',
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
      '1. 개인정보 수집 및 이용 목적\n• 회원 식별, 본인 확인, 회원제 서비스 제공 및 고객 상담\n• 위치 기반 주변 명소/피크닉 스팟 추천 및 길안내 연동\n• 사진 업로드 및 포토 리뷰 커뮤니티 서비스 제공\n• 서비스 부정 이용 방지 및 계정 보호',
      '2. 수집하는 개인정보 항목\n• [필수] 이메일 주소, 비밀번호, 닉네임\n• [선택] 프로필 사진, 위치 정보(GPS), 업로드 사진 및 EXIF 메타데이터\n• [자동 생성] 기기 식별자(FCM 푸시 토큰), 접속 로그, 서비스 이용 기록',
      '3. 개인정보의 보유 및 이용 기간\n• 회원 탈퇴 시 계정을 즉시 비활성화하며, 계정 복구 지원을 위해 탈퇴일로부터 30일간 보관 후 영구 파기합니다.\n• 단, 전자상거래법 등 관계 법령에 따라 보존 의무가 있는 경우 해당 법정 기간 동안 보관합니다.',
      '4. 동의를 거부할 권리 및 거부 시 불이익\n• 귀하는 본 개인정보 수집 및 이용에 대한 동의를 거부할 권리가 있습니다.\n• 단, 필수 항목에 대한 동의를 거부할 경우 회원가입 및 서비스 이용이 제한될 수 있습니다.'
    ]
  },
  marketing: {
    title: '마케팅 정보 수신 동의 (선택)',
    subtitle: '이벤트 및 맞춤형 혜택 정보를 받아보실 수 있습니다.',
    body: [
      '1. 마케팅 및 광고 활용 목적\n• 신규 피크닉 명소 추천, 시즌별 테마 이벤트, 프로모션 및 혜택 정보 안내\n• 서비스 관련 설문 조사 및 맞춤형 콘텐츠 제공',
      '2. 수신 안내 매체\n• 앱 푸시(Push) 알림, 이메일',
      '3. 동의 철회 안내\n• 귀하는 본 동의를 거부할 권리가 있으며, 동의하지 않더라도 PNG의 기본 서비스 이용에는 아무런 제한이 없습니다.\n• 수신 동의는 앱 내 [마이페이지 > 설정]에서 언제든지 자유롭게 변경 또는 철회할 수 있습니다.'
    ]
  }
};

export default function SignupScreen({ navigation }: Props) {
  const setAuth = useAuthStore((s) => s.setAuth);
  const insets = useSafeAreaInsets();
  const { height: SCREEN_H } = useWindowDimensions();
  const initialHeroHeightRef = useRef<number | null>(null);
  const computedHeroHeight = Math.min(Math.max(SCREEN_H * HERO_RATIO, 130), 200);
  if (initialHeroHeightRef.current == null) {
    initialHeroHeightRef.current = computedHeroHeight;
  }
  const heroHeight = initialHeroHeightRef.current;

  const [email, setEmail] = useState('');
  const [pw1, setPw1] = useState('');
  const [pw2, setPw2] = useState('');
  const [pw1Visible, setPw1Visible] = useState(false);
  const [nickname, setNickname] = useState('');
  const [selectedThemes, setSelectedThemes] = useState<Set<keyof typeof THEME_CATEGORY_MAP>>(new Set());
  const [term1, setTerm1] = useState(false);
  const [term2, setTerm2] = useState(false);
  const [term3, setTerm3] = useState(false);
  const [activeTermModal, setActiveTermModal] = useState<TermModalType | null>(null);
  const [attempted, setAttempted] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const [emailCodeSent, setEmailCodeSent] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [verifyCode, setVerifyCode] = useState('');
  const [codeFocused, setCodeFocused] = useState(false);

  function showToast(msg: string) {
    setToastMsg(msg);
    setToastVisible(true);
  }

  function handleEmailChange(val: string) {
    setEmail(val);
    if (emailCodeSent || emailVerified) {
      setEmailCodeSent(false);
      setEmailVerified(false);
      setVerifyCode('');
    }
  }

  const registerMutation = useMutation({
    mutationFn: () =>
      authApi.register(
        email.trim(),
        pw1,
        nickname.trim(),
        Array.from(selectedThemes, (t) => THEME_CATEGORY_MAP[t]),
      ),
    onSuccess: (data) => setAuth(data),
    onError: (err: unknown) => showToast(toErrorMessage(err, '회원가입에 실패했어요. 다시 시도해주세요.')),
  });

  const verifyEmailMutation = useMutation({
    mutationFn: () => authApi.sendEmailVerification(email.trim()),
    onSuccess: () => {
      setEmailCodeSent(true);
      setVerifyCode('');
      showToast('인증 코드를 이메일로 발송했어요.');
    },
    onError: (err: unknown) => showToast(toErrorMessage(err, '인증 코드 발송에 실패했어요.')),
  });

  const confirmEmailMutation = useMutation({
    mutationFn: () => authApi.confirmEmailVerification(email.trim(), verifyCode),
    onSuccess: () => {
      setEmailVerified(true);
      setEmailCodeSent(false);
    },
    onError: (err: unknown) => showToast(toErrorMessage(err, '인증 코드가 올바르지 않아요.')),
  });

  const emailOk = EMAIL_RE.test(email.trim());
  const pwLevel = pw1.length > 0 ? getPwStrength(pw1) : 0;
  // 강도 바는 4단계로 보여주되, 통과 판정은 설정 화면과 같은 기준을 쓴다.
  const pwOk = passwordError(pw1) === null;
  const matchOk = pw1.length > 0 && pw1 === pw2;
  const nickOk = NICK_RE.test(nickname.trim());
  const allOk = emailOk && emailVerified && pwOk && matchOk && term1 && term2 && nickOk;

  function toggleTheme(t: keyof typeof THEME_CATEGORY_MAP) {
    setSelectedThemes((prev) => {
      const next = new Set(prev);
      if (next.has(t)) { next.delete(t); } else { next.add(t); }
      return next;
    });
  }

  function toggleAll() {
    const next = !(term1 && term2 && term3);
    setTerm1(next);
    setTerm2(next);
    setTerm3(next);
  }

  function handleSignup() {
    setAttempted(true);
    if (!allOk) return;
    registerMutation.mutate();
  }

  const showEmailErr = (attempted || email.length > 0) && !emailOk;
  const showEmailVerificationErr = attempted && emailOk && !emailVerified;
  const showPwErr = (attempted || pw1.length > 0) && !pwOk;
  const showMatchErr = (attempted || pw2.length > 0) && !matchOk;
  const showNickErr = (attempted || nickname.length > 0) && !nickOk;
  const showTermsErr = attempted && !(term1 && term2);

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
              colors={['#2d1b4e', '#8b4a6b', '#d4856a']}
              locations={[0, 0.6, 1]}
              style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
            />
            {/* Landscape silhouette placeholder */}
            <View
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: 24,
                backgroundColor: 'rgba(0,0,0,0.1)',
                borderTopLeftRadius: 8,
                borderTopRightRadius: 8,
              }}
            />
            {/* Back Button */}
            <View style={{ position: 'absolute', top: insets.top + 8, left: 12, right: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Pressable
                onPress={() => navigation.goBack()}
                hitSlop={8}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: 'rgba(0,0,0,0.2)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Feather name="chevron-left" size={18} color="#fff" strokeWidth={2} />
              </Pressable>
              <View style={{ width: 32 }} />
            </View>
          </View>

          {/* Fade */}
          <LinearGradient colors={['#d4856a', '#ffffff']} style={{ height: 32, marginTop: -1 }} />

          {/* ── Content ── */}
          <View style={{ paddingHorizontal: CONTENT_PADDING, paddingTop: SPACING_XL, paddingBottom: 40 }}>
            <Text
              style={{
                fontSize: FONT_2XL,
                color: '#000',
                letterSpacing: -0.6,
                lineHeight: 38,
                marginBottom: 6,
                fontFamily: 'Pretendard-SemiBold',
              }}
            >
              회원가입
            </Text>
            <Text
              style={{
                fontSize: FONT_MD,
                color: 'rgba(0,0,0,0.45)',
                letterSpacing: -0.2,
                marginBottom: SPACING_XL,
                fontFamily: 'Pretendard-Regular',
              }}
            >
              기본 정보를 입력하고 시작하세요
            </Text>

            {/* ── Email ── */}
            <Text className="font-normal" style={labelStyle}>이메일</Text>
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 4 }}>
              <View style={{ flex: 1 }}>
                <AuthInput
                  icon="mail"
                  value={email}
                  onChangeText={handleEmailChange}
                  placeholder="이메일 주소"
                  autoComplete="email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  isInvalid={showEmailErr}
                  editable={!emailVerified}
                />
              </View>
              <Pressable
                onPress={() => verifyEmailMutation.mutate()}
                disabled={!emailOk || emailVerified || verifyEmailMutation.isPending}
                style={{
                  width: 80,
                  height: INPUT_HEIGHT,
                  borderRadius: 12,
                  backgroundColor: emailVerified
                    ? SUCCESS
                    : emailOk ? BRAND : 'rgba(0,0,0,0.06)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: verifyEmailMutation.isPending ? 0.6 : 1,
                }}
              >
                <Text
                  style={{
                    fontSize: FONT_MD,
                    color: emailVerified || emailOk ? '#fff' : 'rgba(0,0,0,0.3)',
                    fontFamily: 'Pretendard-Medium',
                  }}
                >
                  {emailVerified ? '완료' : verifyEmailMutation.isPending ? '발송 중' : emailCodeSent ? '재발송' : '인증하기'}
                </Text>
              </Pressable>
            </View>
            {showEmailErr && <ErrorText>올바른 이메일 형식으로 입력해 주세요.</ErrorText>}
            {showEmailVerificationErr && <ErrorText>이메일 인증을 완료해 주세요.</ErrorText>}

            {/* ── Email Code Input ── */}
            {emailCodeSent && !emailVerified && (
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 8, marginBottom: 4 }}>
                <View
                  style={{
                    flex: 1,
                    height: INPUT_HEIGHT,
                    borderRadius: INPUT_RADIUS,
                    borderWidth: BORDER_CONTROL,
                    borderColor: codeFocused ? BRAND : 'transparent',
                    backgroundColor: codeFocused ? '#fff' : CARD,
                    flexDirection: 'row',
                    alignItems: 'center',
                  }}
                >
                  <TextInput
                    value={verifyCode}
                    onChangeText={(t) => setVerifyCode(t.replace(/\D/g, '').slice(0, 6))}
                    placeholder="인증코드 6자리"
                    placeholderTextColor="rgba(0,0,0,0.28)"
                    keyboardType="number-pad"
                    autoComplete="one-time-code"
                    textContentType="oneTimeCode"
                    maxLength={6}
                    autoFocus
                    onFocus={() => setCodeFocused(true)}
                    onBlur={() => setCodeFocused(false)}
                    style={{
                      flex: 1,
                      paddingHorizontal: SPACING_MD,
                      fontSize: FONT_MD,
                      color: '#000',
                      letterSpacing: -0.3,
                      fontFamily: 'Pretendard-Regular',
                    }}
                  />
                </View>
                <Pressable
                  onPress={() => confirmEmailMutation.mutate()}
                  disabled={verifyCode.length < 6 || confirmEmailMutation.isPending}
                  style={{
                    width: 80,
                    height: INPUT_HEIGHT,
                    borderRadius: 12,
                    backgroundColor: verifyCode.length === 6 ? BRAND : 'rgba(0,0,0,0.06)',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: confirmEmailMutation.isPending ? 0.6 : 1,
                  }}
                >
                  <Text
                    style={{
                      fontSize: FONT_MD,
                      color: verifyCode.length === 6 ? '#fff' : 'rgba(0,0,0,0.3)',
                      fontFamily: 'Pretendard-Medium',
                    }}
                  >
                    {confirmEmailMutation.isPending ? '확인 중' : '확인'}
                  </Text>
                </Pressable>
              </View>
            )}

            {/* ── Email Verified Indicator ── */}
            {emailVerified && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4, marginBottom: 4 }}>
                <Feather name="check-circle" size={13} color={SUCCESS} />
                <Text style={{ fontSize: FONT_XS, color: SUCCESS, fontFamily: 'Pretendard-Regular', letterSpacing: -0.1 }}>
                  이메일 인증이 완료됐어요.
                </Text>
              </View>
            )}

            {/* ── Password ── */}
            <Text className="font-normal" style={[labelStyle, { marginTop: 14 }]}>비밀번호</Text>
            <AuthInput
              icon="lock"
              value={pw1}
              onChangeText={setPw1}
              placeholder="8자 이상, 영문/숫자/특수문자"
              secureTextEntry={!pw1Visible}
              isInvalid={showPwErr}
              rightElement={
                <Pressable onPress={() => setPw1Visible((v) => !v)} hitSlop={8}>
                  <Feather name={pw1Visible ? 'eye-off' : 'eye'} size={20} color="rgba(0,0,0,0.2)" />
                </Pressable>
              }
            />

            {/* Strength bars */}
            <View style={{ flexDirection: 'row', gap: 4, marginTop: 6, marginBottom: 4, paddingHorizontal: 4 }}>
              {[0, 1, 2, 3].map((i) => (
                <View
                  key={i}
                  style={{
                    flex: 1,
                    height: 2.5,
                    borderRadius: 1.25,
                    backgroundColor: i < pwLevel ? STRENGTH_COLORS[pwLevel] : 'rgba(0,0,0,0.06)',
                  }}
                />
              ))}
            </View>
            {showPwErr && <ErrorText>비밀번호는 8자 이상이며 영문과 숫자를 포함해야 해요.</ErrorText>}

            {/* ── Password Confirm ── */}
            <Text className="font-normal" style={[labelStyle, { marginTop: 14 }]}>비밀번호 확인</Text>
            <AuthInput
              icon="lock"
              value={pw2}
              onChangeText={setPw2}
              placeholder="비밀번호를 다시 입력하세요"
              secureTextEntry
              isInvalid={showMatchErr}
            />
            {showMatchErr && <ErrorText style={{ marginTop: 4 }}>비밀번호가 일치하지 않아요.</ErrorText>}

            {/* ── Nickname ── */}
            <Text className="font-normal" style={[labelStyle, { marginTop: 14 }]}>닉네임</Text>
            <View style={{ position: 'relative' }}>
              <AuthInput
                icon="user"
                value={nickname}
                onChangeText={setNickname}
                placeholder="2~10자 한글, 영문, 숫자"
                maxLength={NICK_MAX}
                isInvalid={showNickErr}
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
            {showNickErr && <ErrorText style={{ marginTop: 4 }}>{nicknameError(nickname)}</ErrorText>}

            {/* Divider */}
            <View style={{ height: 0.5, backgroundColor: 'rgba(0,0,0,0.08)', marginVertical: SPACING_LG }} />

            {/* ── Interest Themes ── */}
            <Text className="font-normal" style={labelStyle}>
              관심 테마{' '}
              <Text style={{ color: 'rgba(0,0,0,0.35)', fontFamily: 'Pretendard-Regular' }}>(선택, 복수가능)</Text>
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8, marginBottom: SPACING_LG }}>
              {THEMES.map((t) => (
                <ThemePill
                  key={t}
                  label={t}
                  selected={selectedThemes.has(t)}
                  onPress={() => toggleTheme(t)}
                />
              ))}
            </View>

            {/* Divider */}
            <View style={{ height: 0.5, backgroundColor: 'rgba(0,0,0,0.08)', marginBottom: SPACING_LG }} />

            {/* ── Terms ── */}
            <View style={{ marginBottom: SPACING_LG }}>
              {/* All agree */}
              <Pressable
                onPress={toggleAll}
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

              {/* Term 1 */}
              <TermItem
                checked={term1}
                onToggle={() => setTerm1((v) => !v)}
                label="[필수] 이용약관 동의"
                onPressView={() => setActiveTermModal('service')}
              />
              {/* Term 2 */}
              <TermItem
                checked={term2}
                onToggle={() => setTerm2((v) => !v)}
                label="[필수] 개인정보 수집 · 이용 동의"
                onPressView={() => setActiveTermModal('privacy')}
              />
              {/* Term 3 */}
              <TermItem
                checked={term3}
                onToggle={() => setTerm3((v) => !v)}
                label="[선택] 마케팅 정보 수신 동의"
                onPressView={() => setActiveTermModal('marketing')}
              />
            </View>
            {showTermsErr && <ErrorText style={{ marginTop: -8, marginBottom: 12 }}>필수 약관 2개 모두 동의해 주세요.</ErrorText>}

            {/* ── Signup Button ── */}
            <Pressable
              onPress={handleSignup}
              disabled={registerMutation.isPending}
              style={{
                height: BUTTON_HEIGHT,
                borderRadius: BUTTON_RADIUS,
                backgroundColor: allOk ? BRAND : 'rgba(0,0,0,0.06)',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: registerMutation.isPending ? 0.6 : 1,
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
                {registerMutation.isPending ? '가입 중...' : '가입하기'}
              </Text>
            </Pressable>

            {/* Login link */}
            <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: SPACING_LG }}>
              <Text style={{ fontSize: FONT_MD, color: TEXT_SUB, letterSpacing: -0.15, fontFamily: 'Pretendard-Regular' }}>
                이미 계정이 있으신가요?
              </Text>
              <Pressable onPress={() => navigation.goBack()}>
                <Text style={{ fontSize: FONT_MD, color: BRAND, letterSpacing: -0.15, marginLeft: 4, fontFamily: 'Pretendard-SemiBold' }}>
                  로그인
                </Text>
              </Pressable>
            </View>
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

      <Toast message={toastMsg} visible={toastVisible} onHide={() => setToastVisible(false)} />
    </View>
  );
}

/* ── Sub-components ── */

const labelStyle = {
  fontSize: FONT_SM,
  color: 'rgba(0,0,0,0.5)',
  letterSpacing: -0.08,
  marginBottom: 4,
  paddingLeft: 4,
  fontFamily: 'Pretendard-Medium',
};

function ErrorText({ children, style }: { children: React.ReactNode; style?: object }) {
  return (
    <Text
      style={[
        {
          fontSize: FONT_XS,
          color: '#FF3B30',
          letterSpacing: -0.1,
          lineHeight: 18,
          paddingLeft: 4,
          marginBottom: 14,
          fontFamily: 'Pretendard-Regular',
        },
        style,
      ]}
    >
      {children}
    </Text>
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
