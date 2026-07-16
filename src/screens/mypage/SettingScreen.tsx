import React from 'react';
import { View, Text, ScrollView, Pressable, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import {
  IconChevronLeft, IconChevronRight,
  IconUser, IconMail, IconLock, IconAdjustmentsHorizontal, IconShare2,
  IconBell, IconSun, IconMessageCircle,
  IconMoon, IconCurrentLocation, IconBan,
  IconMessage2Question, IconInfoCircle, IconLogout, IconTrash,
  IconX, IconCheck,
} from '@tabler/icons-react-native';
import BottomSheet from '@/components/common/BottomSheet';
import { MyPageStackParamList } from '@/navigation/stacks/MyPageStack';
import { useNotificationSettings, DndRepeatPreset } from '@/hooks/useNotificationSettings';
import { useInquiries } from '@/hooks/useInquiries';
import { normalize } from '@/utils/normalize';
import { FONT_2XS, FONT_XS, FONT_SM, FONT_MD, FONT_LG, FONT_XL, GRID_PADDING, SPACING_LG, SPACING_SM, CARD_RADIUS, BUTTON_HEIGHT, BUTTON_RADIUS } from '@/constants/layout';

type Props = NativeStackScreenProps<MyPageStackParamList, 'Setting'>;

const BRAND = '#E31B59';
const DANGER = '#ff453a';
const NEUTRAL_ICON_BG = '#eef0f2';
const NEUTRAL_ICON_FG = '#615d59';

export default function SettingScreen({ navigation }: Props) {
  const { settings, setWishlist, setGolden, setCommunity, setDndEnabled, setDndTime, setDndRepeat } = useNotificationSettings();
  const { unreadCount } = useInquiries();
  const [dndTimeSheetVisible, setDndTimeSheetVisible] = React.useState(false);
  const [dndRepeatSheetVisible, setDndRepeatSheetVisible] = React.useState(false);

  const handlePress = (key: string) => {
    // TODO: profile/email/password/themes/social/location/block/faq-*/version/logout/delete-account 내비게이션 연결
    void key;
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'left', 'right']}>
      {/* Nav */}
      <View
        className="flex-row items-center justify-between border-b border-black/5 bg-white"
        style={{ height: normalize(54), paddingHorizontal: normalize(16) }}
      >
        <Pressable onPress={() => navigation.goBack()} className="items-center justify-center rounded-full" style={{ width: normalize(36), height: normalize(36) }}>
          <IconChevronLeft size={normalize(20)} color="rgba(0,0,0,0.7)" strokeWidth={1.75} />
        </Pressable>
        <Text className="font-semibold text-black tracking-tight" style={{ fontSize: FONT_LG }}>설정</Text>
        <View style={{ width: normalize(36) }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: normalize(40) }} showsVerticalScrollIndicator={false}>
        {/* ── 계정 ── */}
        <View style={{ paddingHorizontal: GRID_PADDING, paddingTop: SPACING_LG }}>
          <SectionLabel text="계정" />
          <Card>
            <SettingRow icon={IconUser} label="프로필 편집" desc="이미지, 닉네임, 소개 수정" chevron onPress={() => handlePress('profile')} />
            <SettingRow icon={IconMail} label="이메일 변경" desc="sunset_jk@gmail.com" chevron onPress={() => handlePress('email')} />
            <SettingRow icon={IconLock} label="비밀번호 변경" chevron onPress={() => handlePress('password')} />
            <SettingRow icon={IconAdjustmentsHorizontal} iconBg="#fde3ec" iconColor={BRAND} label="관심 테마" desc="홈 피드 및 추천에 반영" chevron onPress={() => handlePress('themes')} />
            <SettingRow icon={IconShare2} label="연결된 소셜 계정" desc="카카오 연결됨" chevron onPress={() => handlePress('social')} />
          </Card>
        </View>

        {/* ── 알림 ── */}
        <View style={{ paddingHorizontal: GRID_PADDING, paddingTop: SPACING_LG }}>
          <SectionLabel text="알림" />
          <Card>
            <SettingRow icon={IconBell} iconBg="#fde3ec" iconColor={BRAND} label="위시리스트 알림" desc="조건 충족 시 알림" toggle toggleValue={settings.wishlist} onToggle={setWishlist} />
            <SettingRow icon={IconSun} iconBg="#fdecd0" iconColor="#d99334" label="골든아워 알림" desc="일출·일몰 30분 전" toggle toggleValue={settings.golden} onToggle={setGolden} />
            <SettingRow icon={IconMessageCircle} iconBg="#e0e7ff" iconColor="#5b6dff" label="커뮤니티 알림" desc="좋아요, 댓글, 팔로우" toggle toggleValue={settings.community} onToggle={setCommunity} />
          </Card>
        </View>

        {/* ── 방해 금지 ── */}
        <View style={{ paddingHorizontal: GRID_PADDING, paddingTop: SPACING_LG }}>
          <SectionLabel text="방해 금지" />
          <Card>
            <SettingRow
              icon={IconMoon} iconBg="#e8e4f5" iconColor="#6b5aa8"
              label="방해 금지 모드" desc="모든 알림을 일시 중단해요"
              toggle toggleValue={settings.dnd.enabled} onToggle={setDndEnabled}
            />
            <SettingRow
              indent
              label="시간"
              right={<Text style={{ fontSize: FONT_SM, color: 'rgba(0,0,0,0.35)', marginRight: normalize(6) }}>{settings.dnd.start} ~ {settings.dnd.end}</Text>}
              chevron onPress={() => setDndTimeSheetVisible(true)}
            />
            <SettingRow
              indent
              label="반복"
              desc={repeatRowLabel(settings.dnd.repeatPreset, settings.dnd.repeatDays)}
              chevron onPress={() => setDndRepeatSheetVisible(true)}
            />
          </Card>
          <Text style={{ fontSize: FONT_XS, color: 'rgba(0,0,0,0.35)', marginTop: normalize(8), lineHeight: normalize(18) }}>
            이 시간에는 위시리스트·골든아워·커뮤니티 알림이 모두 오지 않아요.
          </Text>
        </View>

        {/* ── 개인정보 및 보안 ── */}
        <View style={{ paddingHorizontal: GRID_PADDING, paddingTop: SPACING_LG }}>
          <SectionLabel text="개인정보 및 보안" />
          <Card>
            <SettingRow
              icon={IconCurrentLocation} iconBg="#e0f0dc" iconColor="#5a9855"
              label="위치 권한" desc="앱 사용 중 허용"
              right={<Text style={{ fontSize: FONT_SM, color: 'rgba(0,0,0,0.35)', marginRight: normalize(6) }}>허용됨</Text>}
              chevron onPress={() => handlePress('location')}
            />
            <SettingRow icon={IconBan} label="차단 목록" desc="차단한 사용자 관리" chevron onPress={() => handlePress('block')} />
          </Card>
        </View>

        {/* ── 자주 묻는 질문 (v2: 헤더 카드 제거, 섹션 라벨로) ── */}
        <View style={{ paddingHorizontal: GRID_PADDING, paddingTop: SPACING_LG }}>
          <SectionLabel text="자주 묻는 질문" />
          <Card>
            <SettingRow label="포토제닉 점수는 어떻게 계산되나요?" chevron onPress={() => handlePress('faq-detail-1')} />
            <SettingRow label="위시리스트 알림이 오지 않아요." chevron onPress={() => handlePress('faq-detail-2')} />
            <SettingRow label="게시물이나 댓글을 신고하려면?" chevron onPress={() => handlePress('faq-detail-3')} />
            <SettingRow
              label="FAQ 전체 보기"
              right={<Text style={{ fontSize: FONT_SM, color: BRAND, fontWeight: '600', marginRight: normalize(6) }}>더 보기</Text>}
              chevron onPress={() => handlePress('faq-all')}
            />
          </Card>
        </View>

        {/* ── 문의 (v2: 폼 제거, 한 줄 행으로) ── */}
        <View style={{ paddingHorizontal: GRID_PADDING, paddingTop: SPACING_LG }}>
          <SectionLabel text="문의" />
          <Card>
            <SettingRow
              icon={IconMessage2Question} iconBg={NEUTRAL_ICON_BG} iconColor={NEUTRAL_ICON_FG}
              label="1:1 문의" desc="평균 응답 시간 24시간 이내"
              right={unreadCount > 0 ? (
                <View className="items-center justify-center rounded-full bg-[#E31B59]" style={{ height: normalize(20), paddingHorizontal: normalize(8), marginRight: normalize(6) }}>
                  <Text className="font-semibold text-white" style={{ fontSize: FONT_2XS }}>{unreadCount}</Text>
                </View>
              ) : undefined}
              chevron onPress={() => navigation.navigate('Inquiry')}
            />
          </Card>
        </View>

        {/* ── 기타 (v2: 버전+로그아웃+회원탈퇴 한 카드로) ── */}
        <View style={{ paddingHorizontal: GRID_PADDING, paddingTop: SPACING_LG, paddingBottom: SPACING_LG }}>
          <SectionLabel text="기타" />
          <Card>
            <SettingRow icon={IconInfoCircle} iconBg={NEUTRAL_ICON_BG} iconColor={NEUTRAL_ICON_FG} label="버전 정보" desc="v1.0.0 (최신)" chevron onPress={() => handlePress('version')} />
            <SettingRow icon={IconLogout} iconBg={NEUTRAL_ICON_BG} iconColor={NEUTRAL_ICON_FG} label="로그아웃" chevron onPress={() => handlePress('logout')} />
            <SettingRow
              icon={IconTrash} iconBg="rgba(255,69,58,0.08)" iconColor={DANGER}
              label="회원 탈퇴" labelColor={DANGER}
              chevron chevronColor={DANGER}
              onPress={() => handlePress('delete-account')}
            />
          </Card>
        </View>
      </ScrollView>

      <DndTimeSheet
        visible={dndTimeSheetVisible}
        onClose={() => setDndTimeSheetVisible(false)}
        initial={{ start: settings.dnd.start, end: settings.dnd.end }}
        onConfirm={({ start, end }) => setDndTime(start, end)}
      />
      <DndRepeatSheet
        visible={dndRepeatSheetVisible}
        onClose={() => setDndRepeatSheetVisible(false)}
        initial={{ preset: settings.dnd.repeatPreset, days: settings.dnd.repeatDays }}
        onConfirm={({ preset, days }) => setDndRepeat(preset, days)}
      />
    </SafeAreaView>
  );
}

/* ---------- primitives ---------- */

function SectionLabel({ text }: { text: string }) {
  return (
    <Text
      style={{
        fontSize: FONT_XS, fontWeight: '600',
        color: 'rgba(0,0,0,0.3)', letterSpacing: 0.4,
        marginBottom: normalize(8),
      }}
    >
      {text}
    </Text>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  const items = React.Children.toArray(children);
  return (
    <View className="overflow-hidden bg-[#f5f5f7]" style={{ borderRadius: CARD_RADIUS, marginBottom: SPACING_SM }}>
      {items.map((child, i) => (
        <View key={i} className={i > 0 ? 'border-t border-black/5' : undefined}>
          {child}
        </View>
      ))}
    </View>
  );
}

interface SettingRowProps {
  icon?: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  iconBg?: string;
  iconColor?: string;
  label?: string;
  labelColor?: string;
  desc?: string;
  right?: React.ReactNode;
  chevron?: boolean;
  chevronColor?: string;
  toggle?: boolean;
  toggleValue?: boolean;
  onToggle?: (value: boolean) => void;
  onPress?: () => void;
  indent?: boolean;
}

function SettingRow({
  icon: Icon, iconBg, iconColor, label, labelColor, desc, right,
  chevron, chevronColor, toggle, toggleValue, onToggle, onPress, indent,
}: SettingRowProps) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center"
      style={{ gap: normalize(12), paddingHorizontal: normalize(16), paddingVertical: normalize(14), minHeight: normalize(64) }}
    >
      {Icon && (
        <View
          className="items-center justify-center"
          style={{ width: normalize(32), height: normalize(32), borderRadius: normalize(9), backgroundColor: iconBg ?? 'rgba(0,0,0,0.06)' }}
        >
          <Icon size={normalize(16)} color={iconColor ?? 'rgba(0,0,0,0.4)'} strokeWidth={1.75} />
        </View>
      )}
      {indent && !Icon && <View style={{ width: normalize(32) }} />}

      <View className="flex-1">
        {label && (
          <Text className="font-medium" style={{ fontSize: FONT_MD, color: labelColor ?? '#000' }}>
            {label}
          </Text>
        )}
        {desc && (
          <Text className="mt-0.5" style={{ fontSize: FONT_XS, color: 'rgba(0,0,0,0.38)' }}>
            {desc}
          </Text>
        )}
      </View>

      {right}
      {toggle && (
        <Switch value={toggleValue} onValueChange={onToggle} trackColor={{ true: '#34C759' }} />
      )}
      {chevron && (
        <IconChevronRight size={normalize(14)} color={chevronColor ?? 'rgba(0,0,0,0.2)'} strokeWidth={1.75} />
      )}
    </Pressable>
  );
}

/* ---------- 방해 금지 시간 시트 (v2: 위아래 행 + 휠 피커) ---------- */

const ITEM_H = normalize(40);
const WHEEL_VISIBLE_HEIGHT = ITEM_H * 3;
const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTES = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0'));

function timeToMin(t: string) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function computeDuration(start: string, end: string) {
  let d = timeToMin(end) - timeToMin(start);
  if (d <= 0) d += 24 * 60;
  return d;
}

function formatDuration(min: number) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h && m) return `${h}시간 ${m}분`;
  if (h) return `${h}시간`;
  return `${m}분`;
}

interface DndTimeSheetProps {
  visible: boolean;
  onClose: () => void;
  initial: { start: string; end: string };
  onConfirm: (v: { start: string; end: string }) => void;
}

function DndTimeSheet({ visible, onClose, initial, onConfirm }: DndTimeSheetProps) {
  const [start, setStart] = React.useState(initial.start);
  const [end, setEnd] = React.useState(initial.end);

  React.useEffect(() => {
    if (visible) {
      setStart(initial.start);
      setEnd(initial.end);
    }
  }, [visible, initial.start, initial.end]);

  const crossMidnight = timeToMin(end) <= timeToMin(start);
  const totalMin = computeDuration(start, end);

  return (
    <BottomSheet visible={visible} onClose={onClose} dimOpacity={0.2}>
      <View className="flex-row items-center justify-between" style={{ paddingHorizontal: normalize(20), paddingBottom: normalize(4) }}>
        <Text className="font-semibold" style={{ fontSize: FONT_LG, color: '#111111' }}>방해 금지 시간</Text>
        <Pressable
          onPress={onClose} hitSlop={8}
          className="items-center justify-center"
          style={{ width: normalize(32), height: normalize(32), borderRadius: normalize(16), backgroundColor: '#f5f5f7' }}
        >
          <IconX size={normalize(16)} color="#8a8a8e" strokeWidth={1.75} />
        </Pressable>
      </View>

      <Text style={{ paddingHorizontal: normalize(20), fontSize: FONT_XS, color: '#8a8a8e' }}>
        설정한 시간 동안 알림을 보내지 않아요
      </Text>

      <View className="overflow-hidden bg-[#f5f5f7]" style={{ marginHorizontal: normalize(20), marginTop: normalize(16), borderRadius: normalize(16) }}>
        <TimeRow label="시작" value={start} onChange={setStart} />
        <View className="bg-black/5" style={{ height: 1, marginHorizontal: normalize(20) }} />
        <TimeRow label="종료" value={end} onChange={setEnd} />
      </View>

      <View className="items-center" style={{ marginTop: normalize(14), paddingHorizontal: normalize(20) }}>
        {crossMidnight && (
          <Text style={{ fontSize: FONT_SM, color: BRAND, fontWeight: '500' }}>
            자정을 넘어 다음 날 {end}까지
          </Text>
        )}
        <Text style={{ fontSize: FONT_XS, color: '#8a8a8e', marginTop: crossMidnight ? normalize(4) : 0 }}>
          총 {formatDuration(totalMin)} 동안 알림이 꺼져요
        </Text>
      </View>

      <View style={{ paddingHorizontal: normalize(20), marginTop: normalize(16), paddingBottom: normalize(4) }}>
        <Pressable
          onPress={() => { onConfirm({ start, end }); onClose(); }}
          className="items-center justify-center"
          style={{ height: BUTTON_HEIGHT, borderRadius: BUTTON_RADIUS, backgroundColor: BRAND }}
        >
          <Text className="font-semibold text-white" style={{ fontSize: FONT_MD }}>저장</Text>
        </Pressable>
      </View>
    </BottomSheet>
  );
}

function TimeRow({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const [h, m] = value.split(':');
  return (
    <View className="flex-row items-center" style={{ paddingHorizontal: normalize(20), paddingVertical: normalize(14) }}>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: FONT_XS, color: '#8a8a8e' }}>{label}</Text>
      </View>
      <View className="flex-row items-center" style={{ gap: normalize(8) }}>
        <Wheel items={HOURS} value={h} onChange={(v) => onChange(`${v}:${m}`)} />
        <Text style={{ fontSize: FONT_XL, fontWeight: '600', color: '#111111', marginTop: -normalize(2) }}>:</Text>
        <Wheel items={MINUTES} value={m} onChange={(v) => onChange(`${h}:${v}`)} />
      </View>
    </View>
  );
}

function Wheel({ items, value, onChange }: { items: string[]; value: string; onChange: (v: string) => void }) {
  const idx = Math.max(0, items.indexOf(value));
  return (
    <View style={{ width: normalize(56), height: WHEEL_VISIBLE_HEIGHT, overflow: 'hidden', position: 'relative' }}>
      <View
        pointerEvents="none"
        style={{ position: 'absolute', top: ITEM_H, left: 0, right: 0, height: ITEM_H, backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: normalize(8) }}
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_H}
        decelerationRate="fast"
        contentOffset={{ x: 0, y: idx * ITEM_H }}
        onMomentumScrollEnd={(e) => {
          const i = Math.round(e.nativeEvent.contentOffset.y / ITEM_H);
          const v = items[Math.max(0, Math.min(items.length - 1, i))];
          if (v && v !== value) onChange(v);
        }}
        contentContainerStyle={{ paddingVertical: ITEM_H }}
      >
        {items.map((it) => {
          const active = it === value;
          return (
            <View key={it} style={{ height: ITEM_H, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: active ? FONT_XL : FONT_MD, fontWeight: active ? '600' : '400', color: active ? '#111111' : '#c7c7cc' }}>
                {it}
              </Text>
            </View>
          );
        })}
      </ScrollView>
      <LinearGradient pointerEvents="none" colors={['#f5f5f7', 'rgba(245,245,247,0)']} style={{ position: 'absolute', left: 0, right: 0, top: 0, height: ITEM_H }} />
      <LinearGradient pointerEvents="none" colors={['rgba(245,245,247,0)', '#f5f5f7']} style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: ITEM_H }} />
    </View>
  );
}

/* ---------- 방해 금지 반복 시트 ---------- */

const REPEAT_PRESETS: { key: DndRepeatPreset; label: string; days: number[] | null }[] = [
  { key: 'daily', label: '매일', days: [0, 1, 2, 3, 4, 5, 6] },
  { key: 'weekday', label: '평일 (월~금)', days: [1, 2, 3, 4, 5] },
  { key: 'weekend', label: '주말 (토·일)', days: [0, 6] },
  { key: 'custom', label: '사용자 지정', days: null },
];
const DOW = ['일', '월', '화', '수', '목', '금', '토'];

function labelFromDays(days: number[]) {
  if (!days.length) return '없음';
  if (days.length === 7) return '매일';
  return days.map((d) => DOW[d]).join('·');
}

function repeatRowLabel(preset: DndRepeatPreset, days: number[]) {
  if (preset === 'custom') return labelFromDays(days);
  return REPEAT_PRESETS.find((p) => p.key === preset)?.label ?? labelFromDays(days);
}

interface DndRepeatSheetProps {
  visible: boolean;
  onClose: () => void;
  initial: { preset: DndRepeatPreset; days: number[] };
  onConfirm: (v: { preset: DndRepeatPreset; days: number[] }) => void;
}

function DndRepeatSheet({ visible, onClose, initial, onConfirm }: DndRepeatSheetProps) {
  const [preset, setPreset] = React.useState<DndRepeatPreset>(initial.preset);
  const [days, setDays] = React.useState<number[]>(initial.days);

  React.useEffect(() => {
    if (visible) {
      setPreset(initial.preset);
      setDays(initial.days);
    }
  }, [visible, initial.preset, initial.days]);

  const selectPreset = (key: DndRepeatPreset) => {
    const found = REPEAT_PRESETS.find((p) => p.key === key);
    setPreset(key);
    if (found?.days) setDays(found.days);
  };

  const toggleDay = (d: number) => {
    const set = new Set(days);
    if (set.has(d)) set.delete(d);
    else set.add(d);
    const next = Array.from(set).sort((a, b) => a - b);
    if (next.length === 7) {
      // 요일 7개 전부 선택 = "매일"과 동일 → 프리셋으로 정규화 (매일 프리셋과 중복 방지)
      setPreset('daily');
      setDays([0, 1, 2, 3, 4, 5, 6]);
    } else {
      setPreset('custom');
      setDays(next);
    }
  };

  const canSave = preset !== 'custom' || days.length > 0;

  const handleConfirm = () => {
    if (!canSave) return;
    onConfirm({ preset, days });
    onClose();
  };

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View className="flex-row items-center justify-between" style={{ paddingHorizontal: normalize(20), paddingBottom: normalize(4) }}>
        <Text className="font-semibold" style={{ fontSize: FONT_LG, color: '#111111' }}>반복</Text>
        <Pressable
          onPress={onClose} hitSlop={8}
          className="items-center justify-center"
          style={{ width: normalize(32), height: normalize(32), borderRadius: normalize(16), backgroundColor: '#f5f5f7' }}
        >
          <IconX size={normalize(16)} color="#8a8a8e" strokeWidth={1.75} />
        </Pressable>
      </View>

      <View className="overflow-hidden bg-[#f5f5f7]" style={{ marginHorizontal: normalize(20), marginTop: normalize(16), borderRadius: normalize(16) }}>
        {REPEAT_PRESETS.map((p, i) => {
          const selected = preset === p.key;
          return (
            <Pressable
              key={p.key}
              onPress={() => selectPreset(p.key)}
              className={`flex-row items-center ${i > 0 ? 'border-t border-black/5' : ''}`}
              style={{ paddingHorizontal: normalize(16), paddingVertical: normalize(14), minHeight: normalize(56) }}
            >
              <Text className="flex-1" style={{ fontSize: FONT_MD, fontWeight: '500', color: '#111111' }}>{p.label}</Text>
              {selected && <IconCheck size={normalize(20)} color={BRAND} strokeWidth={2} />}
            </Pressable>
          );
        })}
      </View>

      {preset === 'custom' && (
        <View className="bg-[#f5f5f7]" style={{ marginHorizontal: normalize(20), marginTop: normalize(12), borderRadius: normalize(16), padding: normalize(16) }}>
          <Text style={{ fontSize: FONT_XS, color: '#8a8a8e', marginBottom: normalize(12) }}>알림을 끌 요일을 선택하세요</Text>
          <View className="flex-row justify-between">
            {DOW.map((d, i) => {
              const on = days.includes(i);
              return (
                <Pressable
                  key={d}
                  onPress={() => toggleDay(i)}
                  className="items-center justify-center rounded-full"
                  style={{ width: normalize(36), height: normalize(36), backgroundColor: on ? BRAND : '#fff', borderWidth: on ? 0 : 1, borderColor: 'rgba(0,0,0,0.08)' }}
                >
                  <Text style={{ fontSize: FONT_SM, fontWeight: '600', color: on ? '#fff' : '#111111' }}>{d}</Text>
                </Pressable>
              );
            })}
          </View>
          {days.length === 0 && (
            <Text style={{ fontSize: FONT_XS, color: BRAND, marginTop: normalize(10) }}>최소 1개 요일을 선택해 주세요</Text>
          )}
        </View>
      )}

      <View style={{ paddingHorizontal: normalize(20), marginTop: normalize(16), paddingBottom: normalize(4) }}>
        <Pressable
          onPress={handleConfirm}
          className="items-center justify-center"
          style={{ height: BUTTON_HEIGHT, borderRadius: BUTTON_RADIUS, backgroundColor: canSave ? BRAND : '#f5f5f7' }}
        >
          <Text className="font-semibold" style={{ fontSize: FONT_MD, color: canSave ? '#fff' : '#c7c7cc' }}>저장</Text>
        </Pressable>
      </View>
    </BottomSheet>
  );
}
