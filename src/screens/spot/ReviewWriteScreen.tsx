import React from 'react';
import {
  View, Text, TextInput, ScrollView, Pressable, Platform,
  KeyboardAvoidingView, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
// 시간대 칩만 tabler — 목업은 meteocons 컬러 아이콘이고 대체안 확정 전까지 유지한다.
import { IconSunrise, IconSun, IconSunset, IconMoon } from '@tabler/icons-react-native';
// CalendarDays가 아니라 Calendar — Days 쪽은 날짜 칸을 길이 0짜리 선(h.01) + round linecap으로
// 그려서 작은 크기에서 점 얼룩처럼 보인다. 목업 SVG와 도형이 같은 것도 Calendar 쪽.
import { ChevronLeft, Calendar, Image as ImageIcon, Check, Camera, CircleDot } from 'lucide-react-native';
import { SpotStackParamList } from '@/navigation/stacks/SpotStack';
import { useCreateReview, useSpotDetail } from '@/hooks/useSpot';
import { normalize, normalizeFontSize } from '@/utils/normalize';
import {
  FONT_2XS, FONT_XS, FONT_SM, FONT_MD, FONT_LG,
  GRID_PADDING, BUTTON_HEIGHT, BUTTON_RADIUS, CARD_RADIUS, INPUT_RADIUS,
} from '@/constants/layout';
import type { TimePeriodApi } from '@/types/spot';

type Props = NativeStackScreenProps<SpotStackParamList, 'ReviewWrite'>;

const BRAND = '#E31B59';
const SURFACE = '#F5F5F7';
const STAR_ON = '#FF9F0A';
const ERR = '#ff453a';

// 아이콘 회색은 불투명 값으로 고정한다. rgba로 두면 획이 교차하는 지점(사각형 모서리, 세로선과
// 상단 변이 만나는 곳)에서 알파가 두 번 합성돼 그 점만 진해진다. 아래 값은 각 배경 위에서
// 기존 rgba와 같은 명도로 계산한 것.
const ICON_STRONG = '#595959'; // 흰 배경 위, 기존 rgba(0,0,0,0.65)
const ICON_MID = '#878789';    // SURFACE 위, 기존 rgba(0,0,0,0.45)
const ICON_WEAK = '#ABABAD';   // SURFACE 위, 기존 rgba(0,0,0,0.25~0.3)

const CONTENT_MIN = 20;
const CONTENT_MAX = 500;
const MAX_PHOTOS = 5;
const MAX_EQUIPMENT = 5;

const STAR_LABELS = ['선택 안 됨', '별로예요', '아쉬워요', '괜찮아요', '좋아요', '최고예요'];

const PERIODS: { value: TimePeriodApi; label: string; Icon: typeof IconSun }[] = [
  { value: 'SUNRISE', label: '일출', Icon: IconSunrise },
  { value: 'DAYTIME', label: '낮', Icon: IconSun },
  { value: 'SUNSET', label: '일몰', Icon: IconSunset },
  { value: 'NIGHT', label: '야간', Icon: IconMoon },
];

// 목업 설계는 "마이페이지에서 내 장비 등록 → 리뷰에서 선택"인데(mypage.html의 내 장비 섹션·장비 시트),
// 백엔드에 장비 엔티티·엔드포인트가 없어 마이페이지 쪽이 미구현이다.
// ponytail: 그 CRUD가 생기기 전엔 이 화면 혼자 고칠 수 없으므로 목업 목록을 그대로 둔다. 생기면 조회로 교체.
const EQUIPMENT = [
  { name: 'Sony A7IV', type: '카메라 바디', Icon: Camera },
  { name: '16-35mm f/2.8 GM', type: '렌즈 · 풍경/야경', Icon: CircleDot },
  { name: '50mm f/1.4 GM', type: '렌즈 · 인물/스냅', Icon: CircleDot },
  { name: '70-200mm f/2.8 GM', type: '렌즈 · 망원', Icon: CircleDot },
];

const toISODate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export default function ReviewWriteScreen({ route, navigation }: Props) {
  const { spotId } = route.params;
  const { data: spot } = useSpotDetail(spotId);
  const createReview = useCreateReview(spotId);

  const today = React.useRef(new Date()).current;
  const [rating, setRating] = React.useState(0);
  const [visitedAt, setVisitedAt] = React.useState<Date>(today);
  const [showDatePicker, setShowDatePicker] = React.useState(false);
  const [period, setPeriod] = React.useState<TimePeriodApi | null>(null);
  const [content, setContent] = React.useState('');
  const [contentFocused, setContentFocused] = React.useState(false);
  const [equipment, setEquipment] = React.useState<string[]>([]);

  const trimmed = content.trim();
  const canSubmit = rating > 0 && period !== null && trimmed.length >= CONTENT_MIN;

  // 등록 성공으로 나가는 건 유실이 아니므로 확인창을 건너뛴다.
  const submitted = React.useRef(false);
  const isDirty = rating > 0 || period !== null || trimmed.length > 0 || equipment.length > 0;

  React.useEffect(() => {
    // 작성 분량이 큰 화면이라 뒤로가기·스와이프·안드로이드 백키로 날리는 사고를 막는다.
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      if (!isDirty || submitted.current) return;
      e.preventDefault();
      Alert.alert('작성을 그만둘까요?', '입력한 내용은 저장되지 않아요.', [
        { text: '계속 작성', style: 'cancel' },
        { text: '나가기', style: 'destructive', onPress: () => navigation.dispatch(e.data.action) },
      ]);
    });
    return unsubscribe;
  }, [navigation, isDirty]);

  const toggleEquipment = (name: string) =>
    setEquipment((prev) => {
      if (prev.includes(name)) return prev.filter((e) => e !== name);
      // 서버 @Size(max = 5). 지금은 목록이 4개라 닿지 않지만, 내 장비 조회로 바뀌면 바로 유효해진다.
      return prev.length >= MAX_EQUIPMENT ? prev : [...prev, name];
    });

  // TODO: 이미지 피커 연동 (현재 mock) — ProfileEditScreen.tsx와 동일 대기 상태.
  // 슬롯을 채운 척하면 제출 시 사진이 조용히 사라진다(태그 섹션을 뺀 것과 같은 이유). 그래서 안내만 띄운다.
  const addPhoto = () => Alert.alert('준비 중', '사진 첨부는 곧 지원될 예정이에요.');

  const onSubmit = () => {
    if (!canSubmit || period === null || createReview.isPending) return;
    createReview.mutate(
      {
        body: {
          rating,
          content: trimmed,
          timePeriod: period,
          visitedAt: toISODate(visitedAt),
          ...(equipment.length > 0 && { equipmentInfo: equipment }),
        },
        // TODO: photos는 자리표시 색상이라 아직 전송 대상이 아님. 피커 연동 시 ReviewPhotoUpload[]로 교체.
      },
      {
        onSuccess: () => {
          submitted.current = true;
          navigation.goBack();
        },
        onError: (err) => Alert.alert('등록 실패', err instanceof Error ? err.message : '잠시 후 다시 시도해 주세요.'),
      },
    );
  };

  let contentHint = `최소 ${CONTENT_MIN}자 이상 입력해 주세요`;
  if (trimmed.length > 0 && trimmed.length < CONTENT_MIN) {
    contentHint = `${CONTENT_MIN}자 이상 입력해 주세요 (${CONTENT_MIN - trimmed.length}자 더 필요)`;
  } else if (trimmed.length >= CONTENT_MIN) {
    contentHint = '좋아요! 잘 작성되고 있어요';
  }
  const hintIsError = trimmed.length > 0 && trimmed.length < CONTENT_MIN;

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'left', 'right']}>
      {/* Nav */}
      <View
        className="flex-row items-center border-b border-black/5"
        style={{ height: normalize(54), paddingHorizontal: normalize(12) }}
      >
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={8}
          className="items-center justify-center"
          style={{ width: normalize(40), height: normalize(40) }}
        >
          <ChevronLeft size={normalize(22)} color={ICON_STRONG} strokeWidth={2} />
        </Pressable>
        {/* 목업의 상단 "등록" 버튼은 제외 — 하단 CTA를 스크롤 밖에 고정해 항상 닿으므로 중복.
            ProfileEditScreen과 동일한 단일 제출 패턴. */}
        <Text
          allowFontScaling={false}
          className="flex-1 text-center"
          style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_LG, color: '#000', letterSpacing: -0.3, marginRight: normalize(40) }}
        >
          리뷰 작성
        </Text>
      </View>

      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={{ paddingBottom: normalize(36) }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* 스팟 정보 */}
          <View
            className="flex-row items-center border-b border-black/5"
            style={{ gap: normalize(12), paddingHorizontal: GRID_PADDING, paddingVertical: normalize(16) }}
          >
            <LinearGradient
              colors={['#0f2027', '#4a7c8a']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ width: normalize(48), height: normalize(48), borderRadius: INPUT_RADIUS }}
            />
            <View className="flex-1">
              <Text
                allowFontScaling={false}
                numberOfLines={1}
                style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_MD, color: '#000', letterSpacing: -0.25, marginBottom: normalize(3) }}
              >
                {spot?.info.name ?? ''}
              </Text>
              <Text
                allowFontScaling={false}
                numberOfLines={1}
                style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_XS, color: 'rgba(0,0,0,0.4)' }}
              >
                {spot?.info.address ?? ''}
              </Text>
            </View>
          </View>

          {/* 별점 */}
          <Section label="별점" required>
            <View className="flex-row items-center" style={{ gap: normalize(4) }}>
              {[1, 2, 3, 4, 5].map((value) => (
                <Pressable key={value} onPress={() => setRating(value)} hitSlop={4} style={{ padding: normalize(4) }}>
                  {/* 36은 폰트 스케일 토큰 밖이지만 글자가 아니라 아이콘으로 쓰는 별 글리프다(목업 36px). */}
                  <Text
                    allowFontScaling={false}
                    style={{ fontSize: normalizeFontSize(36), lineHeight: normalizeFontSize(36), color: value <= rating ? STAR_ON : 'rgba(0,0,0,0.1)' }}
                  >
                    ★
                  </Text>
                </Pressable>
              ))}
              <Text
                allowFontScaling={false}
                style={{ fontFamily: 'Pretendard-Medium', fontSize: normalizeFontSize(14), color: 'rgba(0,0,0,0.4)', letterSpacing: -0.15, marginLeft: normalize(8) }}
              >
                {STAR_LABELS[rating]}
              </Text>
            </View>
          </Section>

          {/* 방문 날짜 */}
          <Section label="방문 날짜" required>
            <Pressable
              onPress={() => setShowDatePicker((prev) => !prev)}
              className="flex-row items-center justify-between"
              style={{ height: normalize(52), borderRadius: INPUT_RADIUS, backgroundColor: SURFACE, paddingHorizontal: normalize(16) }}
            >
              <Text
                allowFontScaling={false}
                style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_MD, color: '#000', letterSpacing: -0.2 }}
              >
                {toISODate(visitedAt)}
              </Text>
              <Calendar size={normalize(20)} color={ICON_WEAK} strokeWidth={2} />
            </Pressable>
            {showDatePicker && (
              <DateTimePicker
                value={visitedAt}
                mode="date"
                display={Platform.OS === 'ios' ? 'inline' : 'default'}
                maximumDate={today}
                themeVariant="light"
                accentColor={BRAND}
                onChange={(_, date) => {
                  if (Platform.OS !== 'ios') setShowDatePicker(false);
                  if (date) setVisitedAt(date);
                }}
              />
            )}
          </Section>

          {/* 시간대 */}
          <Section label="시간대" required>
            <View className="flex-row" style={{ gap: normalize(8) }}>
              {PERIODS.map(({ value, label, Icon }) => {
                const active = period === value;
                return (
                  <Pressable
                    key={value}
                    onPress={() => setPeriod(value)}
                    className="flex-1 items-center justify-center"
                    style={{
                      height: normalize(48),
                      borderRadius: INPUT_RADIUS,
                      borderWidth: 1.5,
                      borderColor: active ? BRAND : 'transparent',
                      backgroundColor: active ? 'rgba(227,27,89,0.06)' : SURFACE,
                      gap: normalize(2),
                    }}
                  >
                    <Icon size={normalize(20)} color={active ? BRAND : ICON_MID} strokeWidth={2} />
                    <Text
                      allowFontScaling={false}
                      style={{
                        fontFamily: active ? 'Pretendard-SemiBold' : 'Pretendard-Medium',
                        fontSize: FONT_SM,
                        color: active ? BRAND : 'rgba(0,0,0,0.45)',
                        letterSpacing: -0.1,
                      }}
                    >
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </Section>

          {/* 리뷰 본문 */}
          <Section label="리뷰" required>
            <TextInput
              value={content}
              onChangeText={setContent}
              onFocus={() => setContentFocused(true)}
              onBlur={() => setContentFocused(false)}
              multiline
              textAlignVertical="top"
              maxLength={CONTENT_MAX}
              placeholder={`촬영 팁, 혼잡도, 주차 정보 등 다른 사진가에게 도움이 될 내용을 자유롭게 작성해 주세요. (최소 ${CONTENT_MIN}자)`}
              placeholderTextColor="rgba(0,0,0,0.28)"
              style={{
                height: normalize(130),
                borderRadius: INPUT_RADIUS,
                borderWidth: 1.5,
                borderColor: contentFocused ? BRAND : 'transparent',
                backgroundColor: contentFocused ? '#fff' : SURFACE,
                paddingHorizontal: normalize(16),
                paddingVertical: normalize(14),
                fontFamily: 'Pretendard-Regular',
                fontSize: FONT_MD,
                lineHeight: FONT_MD * 1.6,
                color: '#000',
                letterSpacing: -0.2,
              }}
            />
            <View className="flex-row items-center justify-between" style={{ marginTop: normalize(6) }}>
              <Text
                allowFontScaling={false}
                style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_XS, color: hintIsError ? ERR : 'rgba(0,0,0,0.3)', letterSpacing: -0.1 }}
              >
                {contentHint}
              </Text>
              <Text
                allowFontScaling={false}
                style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_XS, color: 'rgba(0,0,0,0.25)' }}
              >
                {`${content.length}/${CONTENT_MAX}`}
              </Text>
            </View>
          </Section>

          {/* ponytail: 목업의 태그 섹션은 생략. 백엔드가 ReviewRequest.tags를 저장하지 않아(Review 엔티티에 필드 없음)
              지금 붙이면 사용자가 고른 값이 조용히 버려진다. 태그 저장·집계가 생기면 추가. */}

          {/* 사진 첨부 */}
          <Section label="사진 첨부" hint={`최대 ${MAX_PHOTOS}장`}>
            {/* 피커 연동 전이라 추가 슬롯만. 선택된 사진 타일·삭제 버튼은 피커와 함께 들어온다. */}
            <Pressable
              onPress={addPhoto}
              className="items-center justify-center"
              style={{
                width: normalize(72), height: normalize(72), borderRadius: INPUT_RADIUS,
                backgroundColor: SURFACE, borderWidth: 1.5, borderColor: 'rgba(0,0,0,0.12)',
                borderStyle: 'dashed', gap: normalize(4),
              }}
            >
              <ImageIcon size={normalize(22)} color={ICON_WEAK} strokeWidth={2} />
              <Text
                allowFontScaling={false}
                style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_2XS, color: 'rgba(0,0,0,0.3)', letterSpacing: -0.1 }}
              >
                {`0/${MAX_PHOTOS}`}
              </Text>
            </Pressable>
          </Section>

          {/* 사용 장비 */}
          <Section label="사용 장비" hint="선택">
            <View style={{ borderRadius: CARD_RADIUS, backgroundColor: SURFACE, overflow: 'hidden' }}>
              {EQUIPMENT.map(({ name, type, Icon }, idx) => {
                const selected = equipment.includes(name);
                return (
                  <Pressable
                    key={name}
                    onPress={() => toggleEquipment(name)}
                    className="flex-row items-center"
                    style={{
                      gap: normalize(12),
                      paddingHorizontal: normalize(16),
                      paddingVertical: normalize(14),
                      borderBottomWidth: idx < EQUIPMENT.length - 1 ? 0.5 : 0,
                      borderBottomColor: 'rgba(0,0,0,0.04)',
                    }}
                  >
                    <View
                      className="items-center justify-center"
                      style={{
                        width: normalize(22), height: normalize(22), borderRadius: normalize(11),
                        borderWidth: 1.5,
                        borderColor: selected ? BRAND : 'rgba(0,0,0,0.14)',
                        backgroundColor: selected ? BRAND : 'transparent',
                      }}
                    >
                      {selected && <Check size={normalize(10)} color="#fff" strokeWidth={3} />}
                    </View>
                    <View
                      className="items-center justify-center"
                      style={{ width: normalize(28), height: normalize(28), borderRadius: normalize(8), backgroundColor: 'rgba(0,0,0,0.06)' }}
                    >
                      <Icon size={normalize(14)} color={ICON_WEAK} strokeWidth={2} />
                    </View>
                    <View className="flex-1">
                      <Text
                        allowFontScaling={false}
                        style={{ fontFamily: 'Pretendard-Medium', fontSize: normalizeFontSize(14), color: '#000', letterSpacing: -0.15 }}
                      >
                        {name}
                      </Text>
                      <Text
                        allowFontScaling={false}
                        style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_XS, color: 'rgba(0,0,0,0.35)', marginTop: normalize(1) }}
                      >
                        {type}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </Section>

        </ScrollView>

        {/* 등록 — 스크롤 밖 고정 */}
        <View style={{ paddingHorizontal: GRID_PADDING, paddingTop: normalize(10), paddingBottom: normalize(14) }}>
          <Pressable
            onPress={onSubmit}
            disabled={!canSubmit || createReview.isPending}
            className="w-full items-center justify-center"
            style={{ height: BUTTON_HEIGHT, borderRadius: BUTTON_RADIUS, backgroundColor: BRAND, opacity: canSubmit ? 1 : 0.35 }}
          >
            {createReview.isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text
                allowFontScaling={false}
                style={{ fontFamily: 'Pretendard-Medium', fontSize: FONT_MD, color: '#fff', letterSpacing: -0.2 }}
              >
                리뷰 등록하기
              </Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Section({ label, required, hint, children }: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <View style={{ paddingHorizontal: GRID_PADDING, paddingTop: normalize(24) }}>
      <View className="flex-row items-center" style={{ gap: normalize(4), marginBottom: normalize(12) }}>
        <Text
          allowFontScaling={false}
          style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_SM, color: 'rgba(0,0,0,0.45)', letterSpacing: -0.1 }}
        >
          {label}
        </Text>
        {required && (
          <Text allowFontScaling={false} style={{ fontSize: normalizeFontSize(14), color: BRAND, lineHeight: normalizeFontSize(14) }}>
            *
          </Text>
        )}
        {hint && (
          <Text
            allowFontScaling={false}
            style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_XS, color: 'rgba(0,0,0,0.28)', marginLeft: normalize(2) }}
          >
            {hint}
          </Text>
        )}
      </View>
      {children}
    </View>
  );
}
