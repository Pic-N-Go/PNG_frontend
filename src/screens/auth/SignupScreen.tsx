import React, { useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useMutation } from '@tanstack/react-query';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '@/navigation/AuthStack';
import { useAuthStore } from '@/store/useAuthStore';
import { authApi } from '@/api/auth';
import Toast from '@/components/auth/Toast';
import AuthInput from '@/components/auth/AuthInput';
import AuthCheckbox from '@/components/auth/AuthCheckbox';
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
  INPUT_HEIGHT,
  INPUT_RADIUS,
  SPACING_MD,
  SPACING_LG,
  SPACING_XL,
} from '@/constants/layout';

type Props = NativeStackScreenProps<AuthStackParamList, 'Signup'>;

const HERO_RATIO = 160 / 844;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NICK_RE = /^[가-힣a-zA-Z0-9]{2,10}$/;

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

const STRENGTH_COLORS = ['rgba(0,0,0,0.06)', '#FF453A', '#FF9F0A', '#34C759', '#34C759'];

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
  const [selectedThemes, setSelectedThemes] = useState<Set<string>>(new Set());
  const [term1, setTerm1] = useState(false);
  const [term2, setTerm2] = useState(false);
  const [term3, setTerm3] = useState(false);
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
    mutationFn: () => authApi.register(email.trim(), pw1, nickname.trim()),
    onSuccess: (data) => setAuth(data.accessToken, data.user),
    onError: (err: Error) => showToast(err.message || '회원가입에 실패했어요. 다시 시도해주세요.'),
  });

  const verifyEmailMutation = useMutation({
    mutationFn: () => authApi.sendEmailVerification(email.trim()),
    onSuccess: () => {
      setEmailCodeSent(true);
      setVerifyCode('');
      showToast('인증 코드를 이메일로 발송했어요.');
    },
    onError: (err: Error) => showToast(err.message || '인증 코드 발송에 실패했어요.'),
  });

  const confirmEmailMutation = useMutation({
    mutationFn: () => authApi.confirmEmailVerification(email.trim(), verifyCode),
    onSuccess: () => {
      setEmailVerified(true);
      setEmailCodeSent(false);
    },
    onError: (err: Error) => showToast(err.message || '인증 코드가 올바르지 않아요.'),
  });

  const emailOk = EMAIL_RE.test(email.trim());
  const pwLevel = pw1.length > 0 ? getPwStrength(pw1) : 0;
  const pwOk = pwLevel >= 2;
  const matchOk = pw1.length > 0 && pw1 === pw2;
  const nickOk = NICK_RE.test(nickname.trim());
  const allOk = emailOk && emailVerified && pwOk && matchOk && term1 && term2 && nickOk;

  function toggleTheme(t: string) {
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
            <Text style={labelStyle}>이메일</Text>
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
                    ? '#34C759'
                    : emailOk ? '#E31B59' : 'rgba(0,0,0,0.06)',
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

            {/* ── Email Code Input ── */}
            {emailCodeSent && !emailVerified && (
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 8, marginBottom: 4 }}>
                <View
                  style={{
                    flex: 1,
                    height: INPUT_HEIGHT,
                    borderRadius: INPUT_RADIUS,
                    borderWidth: 1.5,
                    borderColor: codeFocused ? '#E31B59' : 'transparent',
                    backgroundColor: codeFocused ? '#fff' : '#F5F5F7',
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
                    backgroundColor: verifyCode.length === 6 ? '#E31B59' : 'rgba(0,0,0,0.06)',
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
                <Feather name="check-circle" size={13} color="#34C759" />
                <Text style={{ fontSize: FONT_XS, color: '#34C759', fontFamily: 'Pretendard-Regular', letterSpacing: -0.1 }}>
                  이메일 인증이 완료됐어요.
                </Text>
              </View>
            )}

            {/* ── Password ── */}
            <Text style={[labelStyle, { marginTop: 14 }]}>비밀번호</Text>
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
            <Text style={[labelStyle, { marginTop: 14 }]}>비밀번호 확인</Text>
            <AuthInput
              icon="shield"
              value={pw2}
              onChangeText={setPw2}
              placeholder="비밀번호를 다시 입력하세요"
              secureTextEntry
              isInvalid={showMatchErr}
            />
            {showMatchErr && <ErrorText style={{ marginTop: 4 }}>비밀번호가 일치하지 않아요.</ErrorText>}

            {/* ── Nickname ── */}
            <Text style={[labelStyle, { marginTop: 14 }]}>닉네임</Text>
            <View style={{ position: 'relative' }}>
              <AuthInput
                icon="user"
                value={nickname}
                onChangeText={setNickname}
                placeholder="2~10자 한글, 영문, 숫자"
                maxLength={10}
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
            {showNickErr && <ErrorText style={{ marginTop: 4 }}>닉네임은 2~10자 한글, 영문, 숫자만 사용할 수 있어요.</ErrorText>}

            {/* Divider */}
            <View style={{ height: 0.5, backgroundColor: 'rgba(0,0,0,0.08)', marginVertical: SPACING_LG }} />

            {/* ── Interest Themes ── */}
            <Text style={labelStyle}>
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
                  borderBottomWidth: 0.5,
                  borderBottomColor: 'rgba(0,0,0,0.08)',
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
              />
              {/* Term 2 */}
              <TermItem
                checked={term2}
                onToggle={() => setTerm2((v) => !v)}
                label="[필수] 개인정보 수집 · 이용 동의"
              />
              {/* Term 3 */}
              <TermItem
                checked={term3}
                onToggle={() => setTerm3((v) => !v)}
                label="[선택] 마케팅 정보 수신 동의"
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
                backgroundColor: allOk ? '#E31B59' : 'rgba(0,0,0,0.06)',
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
              <Text style={{ fontSize: FONT_MD, color: 'rgba(0,0,0,0.4)', letterSpacing: -0.15, fontFamily: 'Pretendard-Regular' }}>
                이미 계정이 있으신가요?
              </Text>
              <Pressable onPress={() => navigation.goBack()}>
                <Text style={{ fontSize: FONT_MD, color: '#E31B59', letterSpacing: -0.15, marginLeft: 4, fontFamily: 'Pretendard-SemiBold' }}>
                  로그인
                </Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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

function TermItem({ checked, onToggle, label }: { checked: boolean; onToggle: () => void; label: string }) {
  return (
    <Pressable
      onPress={onToggle}
      style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 6 }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <AuthCheckbox checked={checked} size="sm" />
        <Text style={{ fontSize: FONT_SM, color: 'rgba(0,0,0,0.45)', letterSpacing: -0.1, fontFamily: 'Pretendard-Regular' }}>
          {label}
        </Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
        <Text style={{ fontSize: FONT_XS, color: 'rgba(0,0,0,0.2)', fontFamily: 'Pretendard-Regular' }}>보기</Text>
        <Feather name="chevron-right" size={12} color="rgba(0,0,0,0.2)" />
      </View>
    </Pressable>
  );
}
