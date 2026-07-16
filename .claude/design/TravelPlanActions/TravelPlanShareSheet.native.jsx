// TravelPlanShareSheet.native.jsx
// 여행 계획 > 상단 공유 아이콘 tap → 바텀시트
// - 앱 shortcut(카톡/인스타 스토리/페북/X/시스템 더보기) + 링크복사/이미지저장/PDF(BETA)
// - 폰트 토큰: 22(제목) / 15(row 제목) / 13(우측 값/버튼) / 11(캡션)
// - 인라인 style + @tabler/icons + normalize

import React, { useCallback, useMemo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Modal,
  Animated,
  Dimensions,
  PanResponder,
  Share,
  Clipboard,
  Platform,
  Linking,
} from 'react-native';
import {
  IconLink,
  IconPhoto,
  IconFileText,
} from '@tabler/icons-react-native';
import { normalize } from '@/utils/normalize';

const C = {
  bg: '#ffffff',
  card: '#f5f5f7',
  brand: '#f59e0b',
  text1: '#000000',
  text2: 'rgba(0,0,0,0.55)',
  text3: 'rgba(0,0,0,0.35)',
  divider: 'rgba(0,0,0,0.05)',
  iconBg: 'rgba(0,0,0,0.06)',
  handle: 'rgba(0,0,0,0.18)',
  scrim: 'rgba(0,0,0,0.4)',
};

const F = {
  xs: normalize(11),
  sm: normalize(13),
  md: normalize(15),
  lg: normalize(17),
  xl: normalize(22),
};

const APPS = [
  { key: 'kakao', label: '카카오톡', bg: '#fee500', scheme: 'kakaotalk://' },
  { key: 'instagram', label: '인스타 스토리', bg: null, scheme: 'instagram://story-camera' },
  { key: 'facebook', label: '페이스북', bg: '#0064e0', scheme: 'fb://' },
  { key: 'twitter', label: 'X (트위터)', bg: '#1da1f2', scheme: 'twitter://' },
  { key: 'more', label: '더보기', bg: 'rgba(0,0,0,0.06)', scheme: null },
];

export default function TravelPlanShareSheet({ visible, onClose, plan }) {
  const { height: SCREEN_H } = Dimensions.get('window');
  const translateY = useRef(new Animated.Value(SCREEN_H)).current;

  const open = useCallback(() => {
    Animated.spring(translateY, { toValue: 0, useNativeDriver: true, bounciness: 0 }).start();
  }, [translateY]);

  const close = useCallback(
    (cb) => {
      Animated.timing(translateY, { toValue: SCREEN_H, duration: 200, useNativeDriver: true }).start(() => cb?.());
    },
    [SCREEN_H, translateY],
  );

  useEffect(() => {
    if (visible) open();
  }, [visible, open]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, g) => g.dy > 6 && Math.abs(g.dy) > Math.abs(g.dx),
        onPanResponderMove: (_, g) => g.dy > 0 && translateY.setValue(g.dy),
        onPanResponderRelease: (_, g) => {
          if (g.dy > 120 || g.vy > 0.8) close(onClose);
          else Animated.spring(translateY, { toValue: 0, useNativeDriver: true, bounciness: 0 }).start();
        },
      }),
    [translateY, close, onClose],
  );

  const shareUrl = plan?.shareUrl ?? 'https://png.travel/plan/abc123';

  const onAppTap = useCallback(
    async (key, scheme) => {
      if (key === 'more') {
        try {
          await Share.share({ title: plan?.name, message: `${plan?.name} — ${shareUrl}`, url: shareUrl });
        } catch {}
        return;
      }
      try {
        const supported = scheme ? await Linking.canOpenURL(scheme) : false;
        if (supported) Linking.openURL(scheme);
      } catch {}
    },
    [plan, shareUrl],
  );

  const onCopyLink = useCallback(() => {
    Clipboard.setString?.(shareUrl);
    // TODO: Toast '복사 완료'
  }, [shareUrl]);

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={() => close(onClose)} statusBarTranslucent>
      <Pressable style={{ flex: 1, backgroundColor: C.scrim }} onPress={() => close(onClose)}>
        <Animated.View
          onStartShouldSetResponder={() => true}
          style={{
            position: 'absolute', left: 0, right: 0, bottom: 0,
            backgroundColor: C.bg,
            borderTopLeftRadius: normalize(24), borderTopRightRadius: normalize(24),
            paddingHorizontal: normalize(24), paddingBottom: normalize(32),
            transform: [{ translateY }],
            shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 20, shadowOffset: { width: 0, height: -8 }, elevation: 20,
          }}
        >
          <View {...panResponder.panHandlers} style={{ alignItems: 'center', paddingVertical: normalize(9) }}>
            <View style={{ width: normalize(36), height: normalize(5), borderRadius: normalize(3), backgroundColor: C.handle }} />
          </View>

          <View style={{ paddingTop: normalize(2), paddingBottom: normalize(4) }}>
            <Text style={{ fontSize: F.xl, fontWeight: '700', letterSpacing: -0.2 }}>공유하기</Text>
            <Text style={{ fontSize: F.xs, color: C.text2, marginTop: normalize(6) }}>
              {plan?.name ?? '여행 계획'} · 포토스팟 {plan?.spotCount ?? 0}곳
            </Text>
          </View>

          {/* app shortcuts */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingVertical: normalize(20), gap: normalize(16) }}>
            {APPS.map((a) => (
              <Pressable key={a.key} onPress={() => onAppTap(a.key, a.scheme)} style={({ pressed }) => ({ width: normalize(64), alignItems: 'center', opacity: pressed ? 0.6 : 1 })}>
                <View style={{ width: normalize(56), height: normalize(56), borderRadius: normalize(16), backgroundColor: a.bg, alignItems: 'center', justifyContent: 'center' }} />
                <Text style={{ marginTop: normalize(8), fontSize: F.xs, color: 'rgba(0,0,0,0.7)', textAlign: 'center' }}>{a.label}</Text>
              </Pressable>
            ))}
          </ScrollView>

          {/* action list */}
          <View style={{ backgroundColor: C.card, borderRadius: normalize(14) }}>
            <Pressable onPress={onCopyLink} style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
              <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: normalize(14), paddingHorizontal: normalize(16), borderBottomWidth: 1, borderBottomColor: C.divider }}>
                <View style={{ width: normalize(36), height: normalize(36), borderRadius: normalize(10), backgroundColor: C.iconBg, alignItems: 'center', justifyContent: 'center', marginRight: normalize(14) }}>
                  <IconLink size={normalize(18)} color="rgba(0,0,0,0.7)" strokeWidth={2} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: F.md, fontWeight: '500' }}>링크 복사</Text>
                  <Text style={{ fontSize: F.xs, color: C.text2, marginTop: normalize(2) }}>{shareUrl.replace(/^https?:\/\//, '')}</Text>
                </View>
                <Text style={{ fontSize: F.sm, fontWeight: '600', color: C.brand }}>복사</Text>
              </View>
            </Pressable>

            <Pressable onPress={() => plan?.onSaveImage?.()} style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
              <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: normalize(14), paddingHorizontal: normalize(16), borderBottomWidth: 1, borderBottomColor: C.divider }}>
                <View style={{ width: normalize(36), height: normalize(36), borderRadius: normalize(10), backgroundColor: C.iconBg, alignItems: 'center', justifyContent: 'center', marginRight: normalize(14) }}>
                  <IconPhoto size={normalize(18)} color="rgba(0,0,0,0.7)" strokeWidth={2} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: F.md, fontWeight: '500' }}>이미지로 저장</Text>
                  <Text style={{ fontSize: F.xs, color: C.text2, marginTop: normalize(2) }}>1080×1920 스토리 포맷</Text>
                </View>
              </View>
            </Pressable>

            <Pressable onPress={() => plan?.onExportPdf?.()} style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
              <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: normalize(14), paddingHorizontal: normalize(16) }}>
                <View style={{ width: normalize(36), height: normalize(36), borderRadius: normalize(10), backgroundColor: C.iconBg, alignItems: 'center', justifyContent: 'center', marginRight: normalize(14) }}>
                  <IconFileText size={normalize(18)} color="rgba(0,0,0,0.7)" strokeWidth={2} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: F.md, fontWeight: '500' }}>PDF 로 내보내기</Text>
                  <Text style={{ fontSize: F.xs, color: C.text2, marginTop: normalize(2) }}>인쇄용 상세 일정</Text>
                </View>
                <View style={{ paddingHorizontal: normalize(8), paddingVertical: normalize(3), borderRadius: normalize(999), backgroundColor: '#000' }}>
                  <Text style={{ fontSize: normalize(10), fontWeight: '600', color: '#fff' }}>BETA</Text>
                </View>
              </View>
            </Pressable>
          </View>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}
