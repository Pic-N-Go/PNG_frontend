import React, { useRef, useState } from 'react';
import {
  Alert, Image, KeyboardAvoidingView, Linking, Platform, Pressable, ScrollView, Text, TextInput, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import {
  Aperture, Camera, ChevronLeft, ChevronRight, Clock, Cloud, Image as ImageIcon, MapPin, Plus, X,
} from 'lucide-react-native';
import OptionSheet from '@/components/common/OptionSheet';
import TimePickerSheet from '@/components/spot/TimePickerSheet';
import { parseExifDateTime } from '@/utils/exifDate';
import type { LucideIcon } from 'lucide-react-native';
import LocationSheet, { LocationOption } from '@/components/community/LocationSheet';
import GearSheet from '@/components/community/GearSheet';
import { useCreatePost } from '@/hooks/useCommunity';
import { toErrorMessage } from '@/api/auth';
import type { PostImageUpload } from '@/api/community';
import { CommunityDetailStackParamList } from '@/navigation/stacks/CommunityDetailStack';
import { GearSheetKind, PostWeatherApi } from '@/types/community';
import { THEMES } from '@/constants/themes';
import { BUTTON_HEIGHT, BUTTON_RADIUS, INPUT_HEIGHT, HEADER_HEIGHT, CONTENT_PADDING, FONT_2XS, FONT_LG, FONT_MD, FONT_SM, FONT_XS } from '@/constants/layout';
import { normalize } from '@/utils/normalize';

const ACCENT = '#E31B59';
const SURFACE = '#f5f5f7';
const CAPTION_MAX = 500;
const MAX_PHOTOS = 5;
// 서버 PostCreateRequest.tags = @Size(max = 10). 카테고리가 13개라 전부 고르면 400이 난다.
const TAG_MAX = 10;

interface PickedPhoto {
  /** iOS는 assetId, Android는 assetId가 없어 uri로 대체(중복 판정용) */
  id: string;
  uri: string;
}

function pad(n: number) {
  return String(n).padStart(2, '0');
}

interface MetaTileProps {
  label: string;
  value: string;
  sub: string;
  Icon: LucideIcon;
  editable?: boolean;
  placeholder?: boolean;
  onPress?: () => void;
}

function MetaTile({ label, value, sub, Icon, editable, placeholder, onPress }: MetaTileProps) {
  // 편집 가능 여부에 따라 바깥 요소가 달라지면 두 타일의 flex 계산이 어긋나 너비가 벌어진다
  // (일시 타일이 날씨 타일보다 넓어 보였던 원인). 두 경우 모두 같은 래퍼·같은 flexBasis를 쓴다.
  const Wrapper = editable ? Pressable : View;
  return (
    <Wrapper onPress={editable ? onPress : undefined} style={{ flex: 1, flexBasis: 0 }}>
    <View className="flex-row items-start" style={{ gap: normalize(10), backgroundColor: SURFACE, borderRadius: normalize(12), padding: normalize(12) }}>
      <Icon size={normalize(17)} color="rgba(0,0,0,0.35)" strokeWidth={1.8} style={{ marginTop: normalize(1) }} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_2XS, color: 'rgba(0,0,0,0.45)', letterSpacing: 0.3 }}>
          {label}
        </Text>
        <Text
          allowFontScaling={false}
          numberOfLines={1}
          style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_SM, color: placeholder ? 'rgba(0,0,0,0.3)' : '#000', letterSpacing: -0.2, marginTop: normalize(2) }}
        >
          {value}
        </Text>
        <Text allowFontScaling={false} numberOfLines={1} style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_XS, color: 'rgba(0,0,0,0.4)', letterSpacing: -0.1, marginTop: normalize(1) }}>
          {sub}
        </Text>
      </View>
    </View>
    </Wrapper>
  );
}

// 카테고리는 회원가입 "관심 테마"와 같은 목록을 쓴다(@/constants/themes).
// 여기서 배열을 따로 두면 두 화면이 조용히 갈라진다 — 실제로 갈라져 있어서 합쳤다.
// 카운트는 서버가 태그별로 세어주지 않아 표시하지 않는다(목업 숫자를 두면 거짓값이 된다).
const CATEGORIES: readonly string[] = THEMES;

// 날씨는 서버 필수값(@NotNull)이라 작성자가 직접 고른다. 자동 감지가 붙으면 기본값만 채워주면 된다.
const WEATHER_OPTIONS: { label: string; value: PostWeatherApi }[] = [
  { label: '맑음', value: 'CLEAR' },
  { label: '구름 조금', value: 'PARTLY_CLOUDY' },
  { label: '흐림', value: 'CLOUDY' },
  { label: '비', value: 'RAIN' },
  { label: '눈', value: 'SNOW' },
  { label: '야간', value: 'NIGHT' },
];

export default function CommunityWriteScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<CommunityDetailStackParamList>>();

  const [photos, setPhotos] = useState<PickedPhoto[]>([]);
  const [caption, setCaption] = useState('');
  const [location, setLocation] = useState<LocationOption | null>(null);
  const [camera, setCamera] = useState('');
  const [lens, setLens] = useState('');
  const [weather, setWeather] = useState<PostWeatherApi | null>(null);
  const [categories, setCategories] = useState<Set<string>>(new Set());

  const [locationSheetVisible, setLocationSheetVisible] = useState(false);
  const [weatherSheetVisible, setWeatherSheetVisible] = useState(false);
  const [timeSheetVisible, setTimeSheetVisible] = useState(false);
  const [gearKind, setGearKind] = useState<GearSheetKind>('camera');
  const [gearSheetVisible, setGearSheetVisible] = useState(false);

  const createPost = useCreatePost();

  /**
   * 촬영 일시. 사진 EXIF에서 읽고, 없으면 작성자가 직접 고른다.
   *
   * 현재 시각을 기본값으로 채워두지 않는다 — 서버가 shootingTime을 @NotNull로 요구해서
   * 뭐라도 보내야 하는데, 사용자가 손대지 않으면 "업로드 시각"이 촬영 시각으로 저장돼 버린다.
   * 그래서 미정(null)일 때는 게시를 막아 반드시 고르게 한다.
   *
   * 날짜는 EXIF에서 온 경우에만 보여준다. 서버가 LocalTime이라 어차피 저장되지 않는데,
   * EXIF가 없을 때 오늘 날짜를 띄우면 촬영일인 것처럼 읽혀 틀린 정보가 된다.
   */
  const openedAt = useRef(new Date()).current;
  const [shotAt, setShotAt] = useState<Date | null>(null);
  const [shotAtSource, setShotAtSource] = useState<'exif' | 'manual' | null>(null);
  const [dateFromExif, setDateFromExif] = useState(false);

  const timeLabel = shotAt ? `${pad(shotAt.getHours())}:${pad(shotAt.getMinutes())}` : '';
  const shotDateLabel = shotAt && dateFromExif
    ? `${shotAt.getFullYear()}.${pad(shotAt.getMonth() + 1)}.${pad(shotAt.getDate())}`
    : '-';
  const shotAtHint =
    shotAtSource === 'exif' ? `${timeLabel} · 사진에서 가져옴`
    : shotAtSource === 'manual' ? `${timeLabel} · 직접 선택`
    : '탭하여 시각 선택';

  const mainPhoto = photos[0] ?? null;
  // 서버가 content·shootingTime·weather를 필수로 받는다(@NotBlank/@NotNull).
  // 촬영 시각은 EXIF가 없으면 비어 있으므로, 작성자가 고를 때까지 게시를 막는다.
  const canSubmit =
    photos.length > 0 && caption.trim().length > 0 && !!weather && !!shotAt && !createPost.isPending;

  // iOS PHPickerViewController는 앱 프로세스 밖에서 뜨므로 권한 요청이 필요 없다.
  // Android에서만 물어보고, 거부한 사용자는 설정으로 안내한다(ReviewWriteScreen과 동일 패턴).
  const picking = useRef(false);
  const pickPhotos = async () => {
    if (photos.length >= MAX_PHOTOS || picking.current) return;
    picking.current = true;
    try {
      if (Platform.OS === 'android') {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
          Alert.alert(
            '사진 접근 권한 필요',
            '설정에서 사진 접근을 허용해 주세요.',
            permission.canAskAgain
              ? [{ text: '확인' }]
              : [{ text: '취소', style: 'cancel' }, { text: '설정 열기', onPress: () => Linking.openSettings() }],
          );
          return;
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        selectionLimit: MAX_PHOTOS - photos.length,
        quality: 0.8,
        // 촬영 일시를 사진에서 읽기 위해 EXIF를 함께 받는다.
        exif: true,
        preferredAssetRepresentationMode: ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Compatible,
      });
      if (result.canceled) return;

      // 사용자가 직접 고른 값은 덮지 않는다. 스크린샷·편집본은 EXIF가 없어 null이 온다.
      if (shotAtSource !== 'manual') {
        const exifDate = result.assets.map((a) => parseExifDateTime(a.exif)).find(Boolean);
        if (exifDate) {
          setShotAt(exifDate);
          setShotAtSource('exif');
          setDateFromExif(true);
        }
      }

      setPhotos((prev) => {
        const seen = new Set(prev.map((p) => p.id));
        const fresh = result.assets
          .map((asset) => ({ id: asset.assetId ?? asset.uri, uri: asset.uri }))
          .filter((p) => !seen.has(p.id));
        return [...prev, ...fresh].slice(0, MAX_PHOTOS);
      });
    } catch (err) {
      if (__DEV__) console.warn('[picker] 실패:', err);
      Alert.alert('사진을 불러오지 못했어요', '잠시 후 다시 시도해 주세요.');
    } finally {
      picking.current = false;
    }
  };

  const removePhoto = (id: string) => setPhotos((prev) => prev.filter((p) => p.id !== id));

  // 첫 번째 사진이 메인 프리뷰다. 다른 썸네일을 탭하면 그 사진을 맨 앞으로 옮겨 메인으로 바꾼다.
  const setAsMain = (id: string) =>
    setPhotos((prev) => {
      const idx = prev.findIndex((p) => p.id === id);
      if (idx <= 0) return prev;
      const next = [...prev];
      const [item] = next.splice(idx, 1);
      next.unshift(item);
      return next;
    });

  const toggleCategory = (label: string) =>
    setCategories((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      // 상한을 넘으면 조용히 무시한다 — 칩이 이미 비활성으로 보이므로 별도 안내가 필요 없다.
      else if (next.size < TAG_MAX) next.add(label);
      return next;
    });

  const openGearSheet = (kind: GearSheetKind) => {
    setGearKind(kind);
    setGearSheetVisible(true);
  };

  const onSubmit = () => {
    if (!canSubmit || !weather || !shotAt) return;
    // 확장자를 못 알아내는 경우가 있어 jpeg로 떨어뜨린다 — 서버는 실제 바이트로 판별한다.
    const images: PostImageUpload[] = photos.map((photo, idx) => {
      const ext = photo.uri.split('.').pop()?.toLowerCase();
      const safeExt = ext && /^(jpe?g|png|heic|webp)$/.test(ext) ? ext : 'jpg';
      return {
        uri: photo.uri,
        name: `post-${idx}.${safeExt}`,
        type: safeExt === 'png' ? 'image/png' : safeExt === 'webp' ? 'image/webp' : 'image/jpeg',
      };
    });

    createPost.mutate(
      {
        request: {
          content: caption.trim(),
          // 스팟을 안 고르면 위치 없는 글이 된다(서버에서 spotId는 선택값).
          spotId: location ? Number(location.id) : null,
          // 사진 EXIF에서 읽었거나 작성자가 직접 고른 값. 서버는 LocalTime이라 시:분만 저장한다.
          shootingTime: timeLabel,
          weather,
          cameraModel: camera.trim() || null,
          lensModel: lens.trim() || null,
          tags: [...categories],
        },
        images,
      },
      {
        onSuccess: () => navigation.goBack(),
        onError: (err) => Alert.alert('게시글을 등록하지 못했어요', toErrorMessage(err, '잠시 후 다시 시도해 주세요.')),
      },
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'left', 'right']}>
      {/* 헤더 */}
      <View
        className="flex-row items-center"
        style={{ height: HEADER_HEIGHT, paddingHorizontal: normalize(16), borderBottomWidth: 0.5, borderBottomColor: 'rgba(0,0,0,0.06)' }}
      >
        <Pressable onPress={() => navigation.goBack()} hitSlop={8} className="items-center justify-center" style={{ width: normalize(36), height: normalize(36) }}>
          <ChevronLeft size={normalize(22)} color="#000" strokeWidth={2} />
        </Pressable>
        {/* 게시 버튼은 폼 최하단으로 내렸다 — 좌측 뒤로가기(36) 만큼 우측에 여백을 둬 제목을 정중앙에 맞춘다 */}
        <Text
          allowFontScaling={false}
          className="flex-1 text-center"
          style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_LG, color: '#000', letterSpacing: -0.4, marginRight: normalize(36) }}
        >
          새 글 작성
        </Text>
      </View>

      {/* 안드로이드도 behavior가 필요하다 — 엣지투엣지에서 adjustResize가 창을 줄여주지 않는다
          (BottomSheet.tsx 주석 참고). */}
      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: normalize(40) }}>
          {/* 사진 */}
          <View style={{ backgroundColor: '#000' }}>
            {mainPhoto ? (
              <Image source={{ uri: mainPhoto.uri }} resizeMode="cover" style={{ width: '100%', aspectRatio: 4 / 3 }} />
            ) : (
              <Pressable onPress={pickPhotos} className="items-center justify-center" style={{ width: '100%', aspectRatio: 4 / 3, backgroundColor: '#1c1c1e' }}>
                {/* 반투명 색을 쓰면 액자 테두리와 산 모양 선이 겹치는 지점이 두 번 합성돼 밝은 얼룩으로 보인다.
                    #1c1c1e 배경 위 rgba(255,255,255,0.4)와 같은 불투명 색으로 대체해 겹침을 없앤다. */}
                <ImageIcon size={normalize(28)} color="#777778" strokeWidth={1.8} />
                <Text allowFontScaling={false} style={{ marginTop: normalize(8), fontFamily: 'Pretendard-Medium', fontSize: FONT_SM, color: 'rgba(255,255,255,0.5)', letterSpacing: -0.1 }}>
                  사진 추가
                </Text>
              </Pressable>
            )}

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ backgroundColor: '#111' }}
              contentContainerStyle={{ gap: 2, paddingVertical: 2 }}
            >
              <Pressable
                onPress={pickPhotos}
                disabled={photos.length >= MAX_PHOTOS}
                className="items-center justify-center"
                style={{ width: normalize(74), height: normalize(74), backgroundColor: 'rgba(255,255,255,0.08)', gap: normalize(3), opacity: photos.length >= MAX_PHOTOS ? 0.4 : 1 }}
              >
                <Plus size={normalize(20)} color="rgba(255,255,255,0.4)" strokeWidth={1.8} />
                <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_2XS, color: 'rgba(255,255,255,0.4)', letterSpacing: -0.1 }}>
                  {`${photos.length}/${MAX_PHOTOS}`}
                </Text>
              </Pressable>

              {photos.map((photo, idx) => (
                <Pressable key={photo.id} onPress={() => setAsMain(photo.id)} style={{ width: normalize(74), height: normalize(74) }}>
                  <Image source={{ uri: photo.uri }} resizeMode="cover" style={{ width: '100%', height: '100%' }} />
                  {idx === 0 && (
                    <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderWidth: 1.5, borderColor: ACCENT }} />
                  )}
                  <Pressable
                    onPress={() => removePhoto(photo.id)}
                    hitSlop={6}
                    className="items-center justify-center"
                    style={{ position: 'absolute', top: normalize(4), right: normalize(4), width: normalize(18), height: normalize(18), borderRadius: normalize(9), backgroundColor: 'rgba(0,0,0,0.5)' }}
                  >
                    <X size={normalize(10)} color="#fff" strokeWidth={3} />
                  </Pressable>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          {/* 폼 */}
          <View style={{ paddingHorizontal: CONTENT_PADDING }}>
            {/* 캡션 */}
            <View style={{ paddingTop: normalize(20), paddingBottom: normalize(8), borderBottomWidth: 0.5, borderBottomColor: 'rgba(0,0,0,0.06)' }}>
              <TextInput
                value={caption}
                onChangeText={setCaption}
                multiline
                textAlignVertical="top"
                maxLength={CAPTION_MAX}
                placeholder="이 사진에 대한 이야기를 들려주세요"
                placeholderTextColor="rgba(0,0,0,0.28)"
                allowFontScaling={false}
                style={{
                  minHeight: INPUT_HEIGHT,
                  fontFamily: 'Pretendard-Medium',
                  fontSize: FONT_MD,
                  letterSpacing: -0.2,
                  // lineHeight를 주지 않는다 — iOS는 커서 높이를 lineHeight에 맞추기 때문에
                  // 1.55배를 주면 15px 글자에 23px짜리 긴 커서가 선다. 목업 textarea도 line-height 미지정.
                  color: '#000',
                }}
              />
              <Text allowFontScaling={false} className="text-right" style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_XS, color: 'rgba(0,0,0,0.25)', letterSpacing: -0.1, marginTop: normalize(6) }}>
                {`${caption.length}/${CAPTION_MAX}`}
              </Text>
            </View>

            {/* 위치 */}
            <View style={{ paddingVertical: normalize(16), borderBottomWidth: 0.5, borderBottomColor: 'rgba(0,0,0,0.06)' }}>
              <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_XS, color: 'rgba(0,0,0,0.4)', letterSpacing: 0.4, marginBottom: normalize(10) }}>
                위치
              </Text>
              <Pressable onPress={() => setLocationSheetVisible(true)} className="flex-row items-center" style={{ gap: normalize(11) }}>
                <View className="items-center justify-center" style={{ width: normalize(36), height: normalize(36), borderRadius: normalize(10), backgroundColor: 'rgba(227,27,89,0.08)' }}>
                  <MapPin size={normalize(17)} color={ACCENT} strokeWidth={1.8} />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text
                    allowFontScaling={false}
                    numberOfLines={1}
                    style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_MD, color: location ? '#000' : 'rgba(0,0,0,0.35)', letterSpacing: -0.2 }}
                  >
                    {location ? location.name : '위치 추가'}
                  </Text>
                  {location && (
                    <Text allowFontScaling={false} numberOfLines={1} style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_XS, color: 'rgba(0,0,0,0.45)', letterSpacing: -0.1, marginTop: normalize(1) }}>
                      {location.address}
                    </Text>
                  )}
                </View>
                <ChevronRight size={normalize(14)} color="rgba(0,0,0,0.25)" strokeWidth={2} />
              </Pressable>
            </View>

            {/* 촬영 정보 */}
            <View style={{ paddingVertical: normalize(16), borderBottomWidth: 0.5, borderBottomColor: 'rgba(0,0,0,0.06)' }}>
              <View className="flex-row items-baseline justify-between" style={{ marginBottom: normalize(10) }}>
                <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_XS, color: 'rgba(0,0,0,0.4)', letterSpacing: 0.4 }}>
                  촬영 정보
                </Text>
                <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_2XS, color: 'rgba(0,0,0,0.3)', letterSpacing: -0.1 }}>
                  선택 · 카메라·렌즈는 탭하면 편집
                </Text>
              </View>
              <View style={{ gap: normalize(8) }}>
                <View className="flex-row" style={{ gap: normalize(8) }}>
                  <MetaTile
                    label="일시"
                    value={shotDateLabel}
                    sub={shotAtHint}
                    Icon={Clock}
                    editable
                    placeholder={!shotAt}
                    onPress={() => setTimeSheetVisible(true)}
                  />
                  {/* 서버 필수값이라 자동 감지 전까지는 직접 고른다 */}
                  <MetaTile
                    label="날씨"
                    value={WEATHER_OPTIONS.find((o) => o.value === weather)?.label ?? '선택'}
                    sub={weather ? '직접 선택' : '탭하여 선택'}
                    Icon={Cloud}
                    editable
                    placeholder={!weather}
                    onPress={() => setWeatherSheetVisible(true)}
                  />
                </View>
                <View className="flex-row" style={{ gap: normalize(8) }}>
                  <MetaTile
                    label="카메라"
                    value={camera || '추가'}
                    sub={camera ? '직접 입력' : '탭하여 선택'}
                    Icon={Camera}
                    editable
                    placeholder={!camera}
                    onPress={() => openGearSheet('camera')}
                  />
                  <MetaTile
                    label="렌즈"
                    value={lens || '추가'}
                    sub={lens ? '직접 입력' : '탭하여 선택'}
                    Icon={Aperture}
                    editable
                    placeholder={!lens}
                    onPress={() => openGearSheet('lens')}
                  />
                </View>
              </View>
            </View>

            {/* 카테고리 */}
            <View style={{ paddingVertical: normalize(16) }}>
              <View className="flex-row items-baseline justify-between" style={{ marginBottom: normalize(10) }}>
                <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_XS, color: 'rgba(0,0,0,0.4)', letterSpacing: 0.4 }}>
                  카테고리
                </Text>
                <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_2XS, color: 'rgba(0,0,0,0.3)', letterSpacing: -0.1 }}>
                  {`다중 선택 · ${categories.size}/${TAG_MAX}`}
                </Text>
              </View>
              <View className="flex-row flex-wrap" style={{ gap: normalize(6) }}>
                {CATEGORIES.map((label) => {
                  const selected = categories.has(label);
                  // 상한에 닿으면 안 고른 칩을 흐리게 해서 더 못 고른다는 걸 눌러보기 전에 보여준다.
                  const blocked = !selected && categories.size >= TAG_MAX;
                  return (
                    <Pressable
                      key={label}
                      onPress={() => toggleCategory(label)}
                      disabled={blocked}
                      className="flex-row items-center"
                      style={{ height: normalize(30), paddingHorizontal: normalize(12), borderRadius: normalize(15), backgroundColor: selected ? 'rgba(227,27,89,0.08)' : SURFACE, opacity: blocked ? 0.4 : 1 }}
                    >
                      <Text allowFontScaling={false} style={{ fontFamily: selected ? 'Pretendard-SemiBold' : 'Pretendard-Regular', fontSize: FONT_SM, color: selected ? ACCENT : 'rgba(0,0,0,0.55)', letterSpacing: -0.2 }}>
                        {label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_XS, color: 'rgba(0,0,0,0.4)', letterSpacing: -0.15, marginTop: normalize(10) }}>
                선택한 카테고리는 스팟 검색·필터에 사용됩니다.
              </Text>
            </View>

            {/* 게시 CTA — 작성 항목을 모두 지나온 뒤에 누르도록 폼 최하단에 둔다 */}
            <Pressable
              onPress={onSubmit}
              disabled={!canSubmit}
              className="w-full items-center justify-center"
              style={{ height: BUTTON_HEIGHT, borderRadius: BUTTON_RADIUS, backgroundColor: ACCENT, opacity: canSubmit ? 1 : 0.35, marginTop: normalize(8) }}
            >
              <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_MD, color: '#fff', letterSpacing: -0.2 }}>
                {createPost.isPending ? '게시 중...' : '게시'}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <LocationSheet visible={locationSheetVisible} selected={location} onSelect={setLocation} onClose={() => setLocationSheetVisible(false)} />
      <TimePickerSheet
        visible={timeSheetVisible}
        value={shotAt ?? openedAt}
        title="촬영 시각"
        minuteInterval={1}
        onConfirm={(date) => {
          setShotAt(date);
          setShotAtSource('manual');
        }}
        onClose={() => setTimeSheetVisible(false)}
      />
      <OptionSheet
        visible={weatherSheetVisible}
        title="촬영 당시 날씨"
        options={WEATHER_OPTIONS.map((o) => o.label)}
        selected={WEATHER_OPTIONS.find((o) => o.value === weather)?.label ?? ''}
        onSelect={(label) => setWeather(WEATHER_OPTIONS.find((o) => o.label === label)?.value ?? null)}
        onClose={() => setWeatherSheetVisible(false)}
      />
      <GearSheet
        visible={gearSheetVisible}
        kind={gearKind}
        value={gearKind === 'camera' ? camera : lens}
        onSelect={(v) => (gearKind === 'camera' ? setCamera(v) : setLens(v))}
        onClose={() => setGearSheetVisible(false)}
      />
    </SafeAreaView>
  );
}
