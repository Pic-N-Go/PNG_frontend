// TravelPlanMoreSheet.native.jsx
// 여행 계획 > 상단 더보기(⋯) 아이콘 tap → 바텀시트
// - primary: 이름 변경 · 복제 · 공동 편집자 초대(BETA)
// - secondary: 캘린더에 추가
// - destructive: 이 계획 전체 삭제
// - 폰트 토큰: 22(제목) / 15(row 제목) / 13(우측 값) / 11(캡션)
// - 인라인 style + @tabler/icons + normalize

import React, { useCallback, useMemo, useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  Modal,
  Animated,
  Dimensions,
  PanResponder,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
  IconChevronRight,
  IconPencil,
  IconCopy,
  IconUsers,
  IconCalendar,
  IconTrash,
} from '@tabler/icons-react-native';
import { normalize } from '@/utils/normalize';

const C = {
  bg: '#ffffff',
  card: '#f5f5f7',
  brand: '#e31b59',
  brandBg: '#fce9ee',
  brandBgSoft: '#fef2f5',
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
  '2xs': normalize(10),
};

function Row({ icon, label, subLabel, onPress, badge, chevron = true, showDivider, danger }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: normalize(14), paddingHorizontal: normalize(16), borderBottomWidth: showDivider ? 1 : 0, borderBottomColor: C.divider }}>
        <View style={{ width: normalize(36), height: normalize(36), borderRadius: normalize(10), backgroundColor: danger ? C.brandBg : C.iconBg, alignItems: 'center', justifyContent: 'center', marginRight: normalize(14) }}>
          {icon}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: F.md, fontWeight: danger ? '600' : '500', color: danger ? C.brand : C.text1 }}>
            {label}
          </Text>
          {subLabel ? (
            <Text style={{ fontSize: F.xs, color: danger ? 'rgba(227,27,89,0.7)' : C.text2, marginTop: normalize(2) }}>
              {subLabel}
            </Text>
          ) : null}
        </View>
        {badge ? (
          <View style={{ paddingHorizontal: normalize(8), paddingVertical: normalize(3), borderRadius: normalize(999), backgroundColor: '#000', marginRight: chevron ? normalize(8) : 0 }}>
            <Text style={{ fontSize: F['2xs'], fontWeight: '600', color: '#fff' }}>{badge}</Text>
          </View>
        ) : null}
        {chevron && !danger ? <IconChevronRight size={normalize(16)} color={C.text3} strokeWidth={2.2} /> : null}
      </View>
    </Pressable>
  );
}

export default function TravelPlanMoreSheet({ visible, onClose, plan, onRename, onDuplicate, onInvite, onAddToCalendar, onDelete }) {
  const navigation = useNavigation();
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

  const confirmDelete = useCallback(() => {
    Alert.alert(
      '이 계획 전체를 삭제할까요?',
      `${plan?.name ?? '여행 계획'}의 모든 스팟과 일정이 삭제돼요. 되돌릴 수 없어요.`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: () => close(() => { onClose?.(); onDelete?.(); }),
        },
      ],
    );
  }, [plan, onDelete, close, onClose]);

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
            <Text style={{ fontSize: F.xl, fontWeight: '700', letterSpacing: -0.2 }}>더보기</Text>
            <Text style={{ fontSize: F.xs, color: C.text2, marginTop: normalize(6) }}>{plan?.name ?? '여행 계획'}</Text>
          </View>

          {/* primary */}
          <View style={{ marginTop: normalize(20), backgroundColor: C.card, borderRadius: normalize(14) }}>
            <Row
              icon={<IconPencil size={normalize(18)} color="rgba(0,0,0,0.7)" strokeWidth={2} />}
              label="이름 변경"
              onPress={() => close(() => { onClose?.(); onRename?.(); })}
              showDivider
            />
            <Row
              icon={<IconCopy size={normalize(18)} color="rgba(0,0,0,0.7)" strokeWidth={2} />}
              label="복제"
              subLabel="같은 스팟으로 새 계획 만들기"
              onPress={() => close(() => { onClose?.(); onDuplicate?.(); })}
              showDivider
            />
            <Row
              icon={<IconUsers size={normalize(18)} color="rgba(0,0,0,0.7)" strokeWidth={2} />}
              label="공동 편집자 초대"
              subLabel="함께 갈 친구 추가"
              badge="BETA"
              chevron={false}
              onPress={() => close(() => { onClose?.(); onInvite?.(); })}
            />
          </View>

          {/* secondary */}
          <View style={{ marginTop: normalize(12), backgroundColor: C.card, borderRadius: normalize(14) }}>
            <Row
              icon={<IconCalendar size={normalize(18)} color="rgba(0,0,0,0.7)" strokeWidth={2} />}
              label="캘린더에 추가"
              subLabel="iOS 캘린더 · Google 캘린더"
              onPress={() => close(() => { onClose?.(); onAddToCalendar?.(); })}
            />
          </View>

          {/* destructive */}
          <View style={{ marginTop: normalize(12), backgroundColor: C.brandBgSoft, borderRadius: normalize(14) }}>
            <Row
              icon={<IconTrash size={normalize(18)} color={C.brand} strokeWidth={2} />}
              label="이 계획 전체 삭제"
              subLabel='스팟 개별 삭제는 "코스 편집" 에서 · 되돌릴 수 없어요'
              chevron={false}
              danger
              onPress={confirmDelete}
            />
          </View>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}
