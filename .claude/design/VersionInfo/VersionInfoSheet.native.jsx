// VersionInfoSheet.native.jsx
// 마이페이지 > 설정 > 버전 정보 (바텀시트)
// - 진입: SettingsScreen 의 "버전 정보" Row tap → 바텀시트 open
// - 구조: 그랩 핸들 + 타이틀 · 앱 메타 카드 · 업데이트 확인 · 약관 및 정책 카드
// - 폰트 토큰: 22(제목) / 15(row 제목) / 13(우측 값/버튼) / 11(캡션)
// - 스타일: 인라인 style + @tabler/icons-react-native + normalize

import React, { useMemo, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Modal,
  Animated,
  Dimensions,
  PanResponder,
  Platform,
  Linking,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
  IconChevronRight,
  IconRefresh,
} from '@tabler/icons-react-native';
import { normalize } from '@/utils/normalize';

const C = {
  bg: '#ffffff',
  card: '#f5f5f7',
  brand: '#e31b59',
  green: '#22a05a',
  metaBg: '#faf9fb',
  text1: '#000000',
  text2: 'rgba(0,0,0,0.55)',
  text3: 'rgba(0,0,0,0.35)',
  divider: 'rgba(0,0,0,0.06)',
  handle: 'rgba(0,0,0,0.18)',
  scrim: 'rgba(0,0,0,0.35)',
};

// 폰트 토큰 (프로젝트 규약 · raw px 금지, 아래 8개 토큰만 사용)
const F = {
  '2xs': normalize(10),
  xs: normalize(11),
  sm: normalize(13),
  base: normalize(14),
  md: normalize(15),
  lg: normalize(17),
  xl: normalize(22),
  '2xl': normalize(28),
};

// ─────────────────────────────────────────────────────────────
// building blocks
// ─────────────────────────────────────────────────────────────
function MetaRow({ label, showDivider, children }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: normalize(14),
        borderBottomWidth: showDivider ? 1 : 0,
        borderBottomColor: C.divider,
      }}
    >
      <Text style={{ fontSize: F.md, color: C.text2 }}>{label}</Text>
      {children}
    </View>
  );
}

function DocRow({ label, onPress, showDivider }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingVertical: normalize(14),
          paddingHorizontal: normalize(16),
          borderBottomWidth: showDivider ? 1 : 0,
          borderBottomColor: 'rgba(0,0,0,0.05)',
        }}
      >
        <Text style={{ fontSize: F.md, fontWeight: '500', color: C.text1 }}>{label}</Text>
        <IconChevronRight size={normalize(16)} color={C.text3} strokeWidth={2.2} />
      </View>
    </Pressable>
  );
}

// ─────────────────────────────────────────────────────────────
// bottom sheet
// ─────────────────────────────────────────────────────────────
export default function VersionInfoSheet({ visible, onClose, appVersion, releaseDate, isLatest, developer }) {
  const navigation = useNavigation();
  const { height: SCREEN_H } = Dimensions.get('window');
  const translateY = useRef(new Animated.Value(SCREEN_H)).current;

  const openSheet = useCallback(() => {
    Animated.spring(translateY, {
      toValue: 0,
      useNativeDriver: true,
      bounciness: 0,
    }).start();
  }, [translateY]);

  const closeSheet = useCallback(
    (cb) => {
      Animated.timing(translateY, {
        toValue: SCREEN_H,
        duration: 200,
        useNativeDriver: true,
      }).start(() => cb?.());
    },
    [SCREEN_H, translateY],
  );

  useEffect(() => {
    if (visible) openSheet();
  }, [visible, openSheet]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, g) => g.dy > 6 && Math.abs(g.dy) > Math.abs(g.dx),
        onPanResponderMove: (_, g) => {
          if (g.dy > 0) translateY.setValue(g.dy);
        },
        onPanResponderRelease: (_, g) => {
          if (g.dy > 120 || g.vy > 0.8) closeSheet(onClose);
          else Animated.spring(translateY, { toValue: 0, useNativeDriver: true, bounciness: 0 }).start();
        },
      }),
    [translateY, closeSheet, onClose],
  );

  const handleUpdateCheck = useCallback(() => {
    // 실서비스에서는 codepush/스토어 체크 로직 연결
    const url = Platform.select({
      ios: 'itms-apps://itunes.apple.com/app/id0000000000',
      android: 'market://details?id=com.dadaikshot',
    });
    if (url) Linking.openURL(url).catch(() => {});
  }, []);

  const go = (route) => () => {
    closeSheet(() => {
      onClose?.();
      navigation?.navigate?.(route);
    });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={() => closeSheet(onClose)}
      statusBarTranslucent
    >
      <Pressable style={{ flex: 1, backgroundColor: C.scrim }} onPress={() => closeSheet(onClose)}>
        <Animated.View
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: C.bg,
            borderTopLeftRadius: normalize(24),
            borderTopRightRadius: normalize(24),
            paddingHorizontal: normalize(24),
            paddingBottom: normalize(32),
            transform: [{ translateY }],
            shadowColor: '#000',
            shadowOpacity: 0.12,
            shadowRadius: 20,
            shadowOffset: { width: 0, height: -8 },
            elevation: 20,
          }}
          onStartShouldSetResponder={() => true}
        >
          {/* grab handle (X 버튼 없음 · 스와이프 다운으로 닫기) */}
          <View {...panResponder.panHandlers} style={{ alignItems: 'center', paddingVertical: normalize(9) }}>
            <View style={{ width: normalize(36), height: normalize(5), borderRadius: normalize(3), backgroundColor: C.handle }} />
          </View>

          {/* title */}
          <View style={{ paddingTop: normalize(2), paddingBottom: normalize(18) }}>
            <Text style={{ fontSize: F.xl, fontWeight: '700', letterSpacing: -0.2 }}>버전 정보</Text>
          </View>

          {/* group 1: app metadata */}
          <View style={{ backgroundColor: C.card, borderRadius: normalize(14), paddingHorizontal: normalize(16) }}>
            <MetaRow label="앱 버전" showDivider>
              <Text style={{ fontSize: F.sm, fontWeight: '600', color: C.text1 }}>{appVersion ?? 'v1.0.0'}</Text>
            </MetaRow>
            <MetaRow label="업데이트 상태" showDivider>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ width: normalize(6), height: normalize(6), borderRadius: normalize(3), backgroundColor: isLatest ? C.green : C.brand, marginRight: normalize(6) }} />
                <Text style={{ fontSize: F.sm, fontWeight: '600', color: isLatest ? C.green : C.brand }}>
                  {isLatest ? '최신 버전' : '업데이트 필요'}
                </Text>
              </View>
            </MetaRow>
            <MetaRow label="출시일" showDivider>
              <Text style={{ fontSize: F.sm, fontWeight: '500', color: C.text1 }}>{releaseDate ?? '2026.05.01'}</Text>
            </MetaRow>
            <MetaRow label="개발사">
              <Text style={{ fontSize: F.sm, fontWeight: '600', color: C.text1 }}>{developer ?? '多多益Shot'}</Text>
            </MetaRow>
          </View>

          {/* update check text button */}
          <Pressable
            onPress={handleUpdateCheck}
            hitSlop={8}
            style={({ pressed }) => ({
              alignSelf: 'center',
              flexDirection: 'row',
              alignItems: 'center',
              paddingVertical: normalize(10),
              paddingHorizontal: normalize(12),
              marginTop: normalize(4),
              opacity: pressed ? 0.5 : 1,
            })}
          >
            <IconRefresh size={normalize(14)} color="rgba(0,0,0,0.5)" strokeWidth={2} />
            <Text style={{ marginLeft: normalize(6), fontSize: F.sm, fontWeight: '500', color: C.text2 }}>
              업데이트 확인
            </Text>
          </Pressable>

          {/* group 2: documents */}
          <View style={{ marginTop: normalize(12), paddingHorizontal: normalize(4) }}>
            <Text style={{ fontSize: F.xs, fontWeight: '500', color: 'rgba(0,0,0,0.4)', paddingHorizontal: normalize(12), paddingBottom: normalize(6) }}>
              약관 및 정책
            </Text>
            <View style={{ backgroundColor: C.bg, borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)', borderRadius: normalize(14), overflow: 'hidden' }}>
              <DocRow label="이용약관" onPress={go('TermsOfService')} showDivider />
              <DocRow label="개인정보처리방침" onPress={go('PrivacyPolicy')} showDivider />
              <DocRow label="오픈소스 라이선스" onPress={go('OpenSourceLicenses')} />
            </View>
          </View>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}
