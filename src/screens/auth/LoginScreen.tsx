import React, { useEffect, useRef, useState } from 'react';
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
import { Feather } from '@expo/vector-icons';
import { useMutation } from '@tanstack/react-query';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { login as kakaoLogin } from '@react-native-seoul/kakao-login';
import { AuthStackParamList } from '@/navigation/AuthStack';
import { useAuthStore } from '@/store/useAuthStore';
import { authApi, toErrorMessage } from '@/api/auth';
import AuthInput from '@/components/auth/AuthInput';
import Toast from '@/components/auth/Toast';
import { normalizeFontSize } from '@/utils/normalize';
import {
  BUTTON_HEIGHT,
  BUTTON_RADIUS,
  CONTENT_PADDING,
  FONT_LG,
  FONT_MD,
  FONT_SM,
  FONT_XS,
  FONT_2XL,
  FONT_XL,
  INPUT_HEIGHT,
  INPUT_RADIUS,
  SOCIAL_BUTTON_HEIGHT,
  SOCIAL_BUTTON_RADIUS,
  SPACING_LG,
  SPACING_MD,
  SPACING_XL,
} from '@/constants/layout';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

const HERO_COLORS = ['#1a1530', '#2d1b4e', '#8b4a6b', '#d4856a', '#e8a87c', '#f0c89a'] as const;
const HERO_RATIO = 380 / 844;
const HERO_LOCS = [0, 0.25, 0.5, 0.7, 0.85, 1.0] as const;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function formatTimer(sec: number) {
  const m = Math.floor(sec / 60);
  const s = String(sec % 60).padStart(2, '0');
  return `재발송 (${m}:${s})`;
}

export default function LoginScreen({ navigation }: Props) {
  const setAuth = useAuthStore((s) => s.setAuth);

  const { height: SCREEN_H } = useWindowDimensions();
  const initialHeroHeightRef = useRef<number | null>(null);
  const computedHeroHeight = Math.min(Math.max(SCREEN_H * HERO_RATIO, 300), 440);
  if (initialHeroHeightRef.current == null) {
    initialHeroHeightRef.current = computedHeroHeight;
  }
  const heroHeight = initialHeroHeightRef.current;

  // Main form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pwVisible, setPwVisible] = useState(false);

  // Bottom sheet state
  const [sheetVisible, setSheetVisible] = useState(false);
  const [sheetStep, setSheetStep] = useState<1 | 2 | 3>(1);
  const [sheetEmail, setSheetEmail] = useState('');
  const [sheetCode, setSheetCode] = useState('');
  const [newPw1, setNewPw1] = useState('');
  const [newPw2, setNewPw2] = useState('');
  const [newPwVisible, setNewPwVisible] = useState(false);
  const [timerSec, setTimerSec] = useState(180);
  const [timerDone, setTimerDone] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Toast state
  const [toastMsg, setToastMsg] = useState('');
  const [toastVisible, setToastVisible] = useState(false);

  const canLogin = email.trim().length > 0 && password.length > 0;

  const loginMutation = useMutation({
    mutationFn: () => authApi.login(email.trim(), password),
    onSuccess: (data) => setAuth(data.accessToken, data.user),
    onError: (err: unknown) => showToast(toErrorMessage(err, '로그인에 실패했어요. 다시 시도해주세요.')),
  });

  const kakaoLoginMutation = useMutation({
    mutationFn: async () => {
      const token = await kakaoLogin();
      return authApi.loginWithKakao(token.accessToken);
    },
    onSuccess: (data) => setAuth(data.accessToken, data.user),
    onError: (e: unknown) => {
      if ((e as { code?: string })?.code === 'E_CANCELLED') return;
      showToast(toErrorMessage(e, '카카오 로그인에 실패했어요'));
    },
  });

  const sendResetCodeMutation = useMutation({
    mutationFn: () => authApi.sendPasswordResetCode(sheetEmail.trim()),
    onSuccess: () => {
      setSheetStep(2);
      setSheetCode('');
      startTimer();
      showToast('인증 코드를 이메일로 발송했어요.');
    },
    onError: (err: unknown) => showToast(toErrorMessage(err, '인증 코드 발송에 실패했어요.')),
  });

  const resetPasswordMutation = useMutation({
    mutationFn: () => authApi.resetPassword(sheetEmail.trim(), sheetCode, newPw1),
    onSuccess: () => {
      closeSheet();
      toastTimeoutRef.current = setTimeout(() => showToast('비밀번호가 변경됐어요'), 350);
    },
    onError: (err: unknown) => showToast(toErrorMessage(err, '비밀번호 변경에 실패했어요.')),
  });

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    };
  }, []); // timerRef, toastTimeoutRef는 useRef — dep array 제외 의도적

  function openSheet() {
    setSheetStep(1);
    setSheetEmail('');
    setSheetCode('');
    setNewPw1('');
    setNewPw2('');
    setTimerDone(false);
    setSheetVisible(true);
  }

  function closeSheet() {
    if (timerRef.current) clearInterval(timerRef.current);
    setSheetVisible(false);
  }

  function startTimer() {
    if (timerRef.current) clearInterval(timerRef.current);
    setTimerSec(180);
    setTimerDone(false);
    let remaining = 180;
    timerRef.current = setInterval(() => {
      remaining -= 1;
      setTimerSec(remaining);
      if (remaining <= 0) {
        if (timerRef.current) clearInterval(timerRef.current);
        setTimerDone(true);
      }
    }, 1000);
  }

  function handleResend() {
    if (!timerDone || sendResetCodeMutation.isPending) return;
    sendResetCodeMutation.mutate();
  }

  function showToast(msg: string) {
    setToastMsg(msg);
    setToastVisible(true);
  }

  const sheetEmailOk = EMAIL_RE.test(sheetEmail.trim());
  const sheetCodeOk = sheetCode.replace(/\D/g, '').length === 6;
  const newPwOk = newPw1.length >= 8 && newPw1.length <= 64 && newPw1 === newPw2;

  return (
    <View className="flex-1 bg-white">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView bounces={false} showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>
          {/* ── Hero ── */}
          <View style={{ height: heroHeight }}>
            <LinearGradient
              colors={HERO_COLORS}
              locations={HERO_LOCS}
              style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
            />

            {/* Stars */}
            {[
              { top: 75, left: 80 },
              { top: 55, left: 150, opacity: 0.3 },
              { top: 90, left: 220, opacity: 0.25 },
              { top: 70, left: 340, opacity: 0.3 },
              { top: 115, left: 180, opacity: 0.2 },
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

            {/* Sun */}
            <View
              style={{
                position: 'absolute',
                top: 130,
                right: 70,
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: 'rgba(248,216,176,0.75)',
              }}
            />

            {/* Logo — hero 중앙 배치 (HTML: justify-content:center + padding-top:20) */}
            <View style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, alignItems: 'center', justifyContent: 'center', paddingTop: 20 }}>
              <Text
                allowFontScaling={false}
                style={{
                  fontFamily: 'FugazOne_400Regular',
                  fontSize: normalizeFontSize(40),
                  fontWeight: '400',
                  color: '#fff',
                  letterSpacing: -1,
                  lineHeight: 48,
                }}
              >
                P N G
              </Text>
              <Text
                allowFontScaling={false}
                style={{
                  fontFamily: 'Pretendard-Regular',
                  fontSize: FONT_XS,
                  fontWeight: '400',
                  color: 'rgba(255,255,255,0.6)',
                  letterSpacing: 3.5,
                  marginTop: 4,
                }}
              >
                PIC N GO
              </Text>
            </View>
          </View>

          {/* Fade hero → white */}
          <LinearGradient
            colors={['#f0c89a', '#ffffff']}
            style={{ height: 40, marginTop: -1 }}
          />

          {/* ── Content ── */}
          <View style={{ paddingHorizontal: CONTENT_PADDING, paddingTop: SPACING_XL - 8 }}>
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
              {'당신만의 포토스팟을\n발견하세요.'}
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
              촬영 조건, 날씨, 골든아워까지 한눈에.
            </Text>

            {/* Email */}
            <View style={{ marginBottom: SPACING_MD }}>
              <AuthInput
                icon="mail"
                value={email}
                onChangeText={setEmail}
                placeholder="이메일"
                autoComplete="email"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            {/* Password */}
            <View style={{ marginBottom: 6 }}>
              <AuthInput
                icon="lock"
                value={password}
                onChangeText={setPassword}
                placeholder="비밀번호"
                autoComplete="current-password"
                secureTextEntry={!pwVisible}
                rightElement={
                  <Pressable onPress={() => setPwVisible((v) => !v)} hitSlop={8}>
                    <Feather
                      name={pwVisible ? 'eye-off' : 'eye'}
                      size={20}
                      color="rgba(0,0,0,0.2)"
                    />
                  </Pressable>
                }
              />
            </View>

            {/* Forgot */}
            <Pressable onPress={openSheet} style={{ alignSelf: 'flex-end', marginBottom: SPACING_LG }}>
              <Text
                style={{
                  fontSize: FONT_SM,
                  color: '#E31B59',
                  letterSpacing: -0.1,
                  fontFamily: 'Pretendard-Regular',
                }}
              >
                비밀번호를 잊으셨나요?
              </Text>
            </Pressable>

            {/* Login Button */}
            <Pressable
              onPress={() => loginMutation.mutate()}
              disabled={!canLogin || loginMutation.isPending}
              style={{
                height: BUTTON_HEIGHT,
                borderRadius: BUTTON_RADIUS,
                backgroundColor: canLogin ? '#E31B59' : 'rgba(0,0,0,0.06)',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: loginMutation.isPending ? 0.6 : 1,
              }}
            >
              <Text
                style={{
                  fontSize: FONT_LG,
                  color: canLogin ? '#fff' : 'rgba(0,0,0,0.3)',
                  letterSpacing: -0.3,
                  fontFamily: 'Pretendard-Medium',
                }}
              >
                {loginMutation.isPending ? '로그인 중...' : '로그인'}
              </Text>
            </Pressable>

            {/* Divider */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginVertical: SPACING_LG }}>
              <View style={{ flex: 1, height: 0.5, backgroundColor: 'rgba(0,0,0,0.1)' }} />
              <Text
                style={{
                  fontSize: normalizeFontSize(12),
                  color: 'rgba(0,0,0,0.25)',
                  letterSpacing: 0.3,
                  fontFamily: 'Pretendard-Regular',
                }}
              >
                또는
              </Text>
              <View style={{ flex: 1, height: 0.5, backgroundColor: 'rgba(0,0,0,0.1)' }} />
            </View>

            {/* Social */}
            <View style={{ flexDirection: 'row', gap: 14 }}>
              <Pressable
                onPress={() => kakaoLoginMutation.mutate()}
                disabled={kakaoLoginMutation.isPending}
                style={{
                  flex: 1,
                  height: SOCIAL_BUTTON_HEIGHT,
                  borderRadius: SOCIAL_BUTTON_RADIUS,
                  backgroundColor: '#FEE500',
                  opacity: kakaoLoginMutation.isPending ? 0.6 : 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                }}
              >
                <Text style={{ fontSize: normalizeFontSize(14), fontWeight: '700', color: '#391B1B' }}>K</Text>
                <Text
                  style={{
                    fontSize: FONT_MD,
                    color: '#391B1B',
                    letterSpacing: -0.2,
                    fontFamily: 'Pretendard-Medium',
                  }}
                >
                  카카오
                </Text>
              </Pressable>

              {/* Apple 로그인 — 카카오 우선 진행으로 잠정 보류, 재개 시 주석 해제
              <Pressable
                onPress={() => navigation.navigate('Onboarding', { provider: 'apple' })}
                style={{
                  flex: 1,
                  height: SOCIAL_BUTTON_HEIGHT,
                  borderRadius: SOCIAL_BUTTON_RADIUS,
                  backgroundColor: '#000',
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                }}
              >
                <Feather name="smartphone" size={14} color="#fff" />
                <Text
                  style={{
                    fontSize: FONT_MD,
                    color: '#fff',
                    letterSpacing: -0.2,
                    fontFamily: 'Pretendard-Medium',
                  }}
                >
                  Apple
                </Text>
              </Pressable>
              */}
            </View>

            {/* Signup link */}
            <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: SPACING_XL, paddingBottom: SPACING_XL }}>
              <Text
                style={{
                  fontSize: FONT_MD,
                  color: 'rgba(0,0,0,0.4)',
                  letterSpacing: -0.15,
                  fontFamily: 'Pretendard-Regular',
                }}
              >
                계정이 없으신가요?
              </Text>
              <Pressable onPress={() => navigation.navigate('Signup')}>
                <Text
                  style={{
                    fontSize: FONT_MD,
                    color: '#E31B59',
                    letterSpacing: -0.15,
                    marginLeft: 4,
                    fontFamily: 'Pretendard-SemiBold',
                  }}
                >
                  회원가입
                </Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ── Forgot Password Bottom Sheet ── */}
      <Modal
        visible={sheetVisible}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={closeSheet}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <Pressable
            style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }}
            onPress={closeSheet}
          >
            <Pressable
              onPress={() => {}}
              style={{
                backgroundColor: '#fff',
                borderTopLeftRadius: 20,
                borderTopRightRadius: 20,
                paddingBottom: 40,
              }}
            >
              {/* Handle */}
              <View style={{ alignItems: 'center', paddingTop: 12, paddingBottom: 4 }}>
                <View style={{ width: 36, height: 5, borderRadius: 2.5, backgroundColor: 'rgba(0,0,0,0.1)' }} />
              </View>

              {/* Header */}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING_LG, paddingVertical: 8 }}>
                <Text style={{ fontSize: normalizeFontSize(20), letterSpacing: -0.4, color: '#000', fontFamily: 'Pretendard-SemiBold' }}>
                  {sheetStep === 1 ? '비밀번호 찾기' : sheetStep === 2 ? '인증코드 확인' : '새 비밀번호 설정'}
                </Text>
                <Pressable
                  onPress={closeSheet}
                  hitSlop={8}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: '#F5F5F7',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Feather name="x" size={14} color="rgba(0,0,0,0.4)" />
                </Pressable>
              </View>

              {/* Step 1 */}
              {sheetStep === 1 && (
                <View>
                  <Text
                    style={{
                      fontSize: FONT_MD,
                      color: 'rgba(0,0,0,0.45)',
                      lineHeight: 22,
                      letterSpacing: -0.15,
                      paddingHorizontal: SPACING_LG,
                      paddingBottom: 20,
                      fontFamily: 'Pretendard-Regular',
                    }}
                  >
                    {'가입하신 이메일을 입력하면\n인증코드를 보내드려요.'}
                  </Text>
                  <View style={{ paddingHorizontal: SPACING_LG }}>
                    <Text style={{ fontSize: normalizeFontSize(12), color: 'rgba(0,0,0,0.4)', marginBottom: 6, fontFamily: 'Pretendard-Medium' }}>
                      이메일
                    </Text>
                    <TextInput
                      value={sheetEmail}
                      onChangeText={setSheetEmail}
                      placeholder="가입한 이메일 주소"
                      placeholderTextColor="rgba(0,0,0,0.28)"
                      autoComplete="email"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoFocus
                      style={{
                        height: INPUT_HEIGHT,
                        borderRadius: INPUT_RADIUS,
                        borderWidth: 1.5,
                        borderColor: 'transparent',
                        backgroundColor: '#F5F5F7',
                        paddingHorizontal: SPACING_MD,
                        fontSize: FONT_MD,
                        color: '#000',
                        letterSpacing: -0.3,
                        fontFamily: 'Pretendard-Regular',
                        marginBottom: 14,
                      }}
                    />
                    <Pressable
                      onPress={sheetEmailOk && !sendResetCodeMutation.isPending ? () => sendResetCodeMutation.mutate() : undefined}
                      style={{
                        height: BUTTON_HEIGHT,
                        borderRadius: BUTTON_RADIUS,
                        backgroundColor: sheetEmailOk ? '#E31B59' : 'rgba(0,0,0,0.06)',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginTop: 8,
                        opacity: sendResetCodeMutation.isPending ? 0.6 : 1,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: FONT_LG,
                          color: sheetEmailOk ? '#fff' : 'rgba(0,0,0,0.3)',
                          letterSpacing: -0.3,
                          fontFamily: 'Pretendard-Medium',
                        }}
                      >
                        {sendResetCodeMutation.isPending ? '발송 중...' : '인증코드 발송'}
                      </Text>
                    </Pressable>
                  </View>
                </View>
              )}

              {/* Step 2 */}
              {sheetStep === 2 && (
                <View>
                  <Text
                    style={{
                      fontSize: FONT_MD,
                      color: 'rgba(0,0,0,0.45)',
                      lineHeight: 22,
                      letterSpacing: -0.15,
                      paddingHorizontal: SPACING_LG,
                      paddingBottom: 20,
                      fontFamily: 'Pretendard-Regular',
                    }}
                  >
                    {`${sheetEmail} 으로\n인증코드를 발송했어요.`}
                  </Text>
                  <View style={{ paddingHorizontal: SPACING_LG }}>
                    <Text style={{ fontSize: normalizeFontSize(12), color: 'rgba(0,0,0,0.4)', marginBottom: 6, fontFamily: 'Pretendard-Medium' }}>
                      인증코드 6자리
                    </Text>
                    <TextInput
                      value={sheetCode}
                      onChangeText={(t) => setSheetCode(t.replace(/\D/g, '').slice(0, 6))}
                      placeholder="000000"
                      placeholderTextColor="rgba(0,0,0,0.28)"
                      keyboardType="number-pad"
                      autoComplete="one-time-code"
                      maxLength={6}
                      autoFocus
                      style={{
                        height: INPUT_HEIGHT,
                        borderRadius: INPUT_RADIUS,
                        borderWidth: 1.5,
                        borderColor: 'transparent',
                        backgroundColor: '#F5F5F7',
                        paddingHorizontal: SPACING_MD,
                        fontSize: FONT_XL,
                        color: '#000',
                        letterSpacing: 8,
                        textAlign: 'center',
                        fontFamily: 'Pretendard-SemiBold',
                        marginBottom: 8,
                      }}
                    />
                    <View style={{ flexDirection: 'row', marginBottom: 14 }}>
                      <Text style={{ fontSize: normalizeFontSize(12), color: 'rgba(0,0,0,0.35)', fontFamily: 'Pretendard-Regular' }}>
                        코드를 받지 못하셨나요?{'  '}
                      </Text>
                      <Pressable onPress={handleResend} disabled={!timerDone}>
                        <Text
                          style={{
                            fontSize: normalizeFontSize(12),
                            color: '#E31B59',
                            fontFamily: 'Pretendard-Medium',
                          }}
                        >
                          {timerDone ? '재발송' : formatTimer(timerSec)}
                        </Text>
                      </Pressable>
                    </View>
                    <Pressable
                      onPress={sheetCodeOk ? () => {
                        if (timerRef.current) {
                          clearInterval(timerRef.current);
                          timerRef.current = null;
                        }
                        setSheetStep(3);
                      } : undefined}
                      style={{
                        height: BUTTON_HEIGHT,
                        borderRadius: BUTTON_RADIUS,
                        backgroundColor: sheetCodeOk ? '#E31B59' : 'rgba(0,0,0,0.06)',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginTop: 8,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: FONT_LG,
                          color: sheetCodeOk ? '#fff' : 'rgba(0,0,0,0.3)',
                          letterSpacing: -0.3,
                          fontFamily: 'Pretendard-Medium',
                        }}
                      >
                        확인
                      </Text>
                    </Pressable>
                  </View>
                </View>
              )}

              {/* Step 3 */}
              {sheetStep === 3 && (
                <View>
                  <Text
                    style={{
                      fontSize: FONT_MD,
                      color: 'rgba(0,0,0,0.45)',
                      lineHeight: 22,
                      letterSpacing: -0.15,
                      paddingHorizontal: SPACING_LG,
                      paddingBottom: 20,
                      fontFamily: 'Pretendard-Regular',
                    }}
                  >
                    {'새로 사용할 비밀번호를\n입력해주세요.'}
                  </Text>
                  <View style={{ paddingHorizontal: SPACING_LG }}>
                    <Text style={{ fontSize: normalizeFontSize(12), color: 'rgba(0,0,0,0.4)', marginBottom: 6, fontFamily: 'Pretendard-Medium' }}>
                      새 비밀번호 (8~64자)
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F5F7', borderRadius: INPUT_RADIUS, marginBottom: 10, paddingRight: SPACING_MD }}>
                      <TextInput
                        value={newPw1}
                        onChangeText={setNewPw1}
                        placeholder="새 비밀번호"
                        placeholderTextColor="rgba(0,0,0,0.28)"
                        secureTextEntry={!newPwVisible}
                        autoComplete="new-password"
                        autoFocus
                        style={{
                          flex: 1,
                          height: INPUT_HEIGHT,
                          paddingHorizontal: SPACING_MD,
                          fontSize: FONT_MD,
                          color: '#000',
                          letterSpacing: -0.3,
                          fontFamily: 'Pretendard-Regular',
                        }}
                      />
                      <Pressable onPress={() => setNewPwVisible((v) => !v)} hitSlop={8}>
                        <Feather name={newPwVisible ? 'eye-off' : 'eye'} size={20} color="rgba(0,0,0,0.2)" />
                      </Pressable>
                    </View>
                    <TextInput
                      value={newPw2}
                      onChangeText={setNewPw2}
                      placeholder="새 비밀번호 확인"
                      placeholderTextColor="rgba(0,0,0,0.28)"
                      secureTextEntry={!newPwVisible}
                      autoComplete="new-password"
                      style={{
                        height: INPUT_HEIGHT,
                        borderRadius: INPUT_RADIUS,
                        backgroundColor: '#F5F5F7',
                        paddingHorizontal: SPACING_MD,
                        fontSize: FONT_MD,
                        color: '#000',
                        letterSpacing: -0.3,
                        fontFamily: 'Pretendard-Regular',
                        marginBottom: 14,
                      }}
                    />
                    <Pressable
                      onPress={newPwOk && !resetPasswordMutation.isPending ? () => resetPasswordMutation.mutate() : undefined}
                      style={{
                        height: BUTTON_HEIGHT,
                        borderRadius: BUTTON_RADIUS,
                        backgroundColor: newPwOk ? '#E31B59' : 'rgba(0,0,0,0.06)',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginTop: 8,
                        opacity: resetPasswordMutation.isPending ? 0.6 : 1,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: FONT_LG,
                          color: newPwOk ? '#fff' : 'rgba(0,0,0,0.3)',
                          letterSpacing: -0.3,
                          fontFamily: 'Pretendard-Medium',
                        }}
                      >
                        {resetPasswordMutation.isPending ? '변경 중...' : '비밀번호 변경'}
                      </Text>
                    </Pressable>
                  </View>
                </View>
              )}
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>

      <Toast message={toastMsg} visible={toastVisible} onHide={() => setToastVisible(false)} />
    </View>
  );
}
