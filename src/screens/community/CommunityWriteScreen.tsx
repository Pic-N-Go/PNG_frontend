import React, { useRef, useState } from 'react';
import {
  Alert, Image, KeyboardAvoidingView, Linking, Platform, Pressable, ScrollView, Text, TextInput, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import {
  Aperture, Camera, ChevronLeft, ChevronRight, Clock, CloudOff, Image as ImageIcon, MapPin, Plus, X,
} from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import LocationSheet, { LocationOption } from '@/components/community/LocationSheet';
import GearSheet from '@/components/community/GearSheet';
import { CommunityDetailStackParamList } from '@/navigation/stacks/CommunityDetailStack';
import { GearSheetKind } from '@/types/community';
import { FONT_2XS, FONT_LG, FONT_MD, FONT_SM, FONT_XS } from '@/constants/layout';
import { normalize } from '@/utils/normalize';

const ACCENT = '#E31B59';
const SURFACE = '#f5f5f7';
const CAPTION_MAX = 500;
const MAX_PHOTOS = 5;

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
  const content = (
    <View className="flex-1 flex-row items-start" style={{ gap: normalize(10), backgroundColor: SURFACE, borderRadius: normalize(12), padding: normalize(12) }}>
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
  );

  if (!editable) return content;
  return <Pressable onPress={onPress} style={{ flex: 1 }}>{content}</Pressable>;
}

// 커뮤니티 카테고리 태그 — 스팟 검색·필터에서 쓰는 것과 같은 고정 목록(카운트는 목업 값 그대로).
const CATEGORIES: { label: string; count: string }[] = [
  { label: '역사/전통', count: '1,383' },
  { label: '공원', count: '465' },
  { label: '숲', count: '338' },
  { label: '야경', count: '302' },
  { label: '산', count: '247' },
  { label: '카페', count: '208' },
  { label: '일출/일몰', count: '206' },
  { label: '꽃', count: '183' },
];

export default function CommunityWriteScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<CommunityDetailStackParamList>>();

  const [photos, setPhotos] = useState<PickedPhoto[]>([]);
  const [caption, setCaption] = useState('');
  const [location, setLocation] = useState<LocationOption | null>(null);
  const [camera, setCamera] = useState('');
  const [lens, setLens] = useState('');
  const [categories, setCategories] = useState<Set<string>>(new Set());

  const [locationSheetVisible, setLocationSheetVisible] = useState(false);
  const [gearKind, setGearKind] = useState<GearSheetKind>('camera');
  const [gearSheetVisible, setGearSheetVisible] = useState(false);

  // 일시는 화면을 연 시점 스냅샷 — 실제 EXIF 촬영 시각 연동은 이 화면의 범위 밖(편집 UI 패턴이 다름).
  const openedAt = useRef(new Date()).current;
  const dateLabel = `${openedAt.getFullYear()}.${pad(openedAt.getMonth() + 1)}.${pad(openedAt.getDate())}`;
  const timeLabel = `${pad(openedAt.getHours())}:${pad(openedAt.getMinutes())}`;

  const mainPhoto = photos[0] ?? null;
  const canSubmit = photos.length > 0;

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
        preferredAssetRepresentationMode: ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Compatible,
      });
      if (result.canceled) return;

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
      else next.add(label);
      return next;
    });

  const openGearSheet = (kind: GearSheetKind) => {
    setGearKind(kind);
    setGearSheetVisible(true);
  };

  const onSubmit = () => {
    if (!canSubmit) return;
    // 실제 게시글 등록 API 연동은 이 화면의 범위 밖 — 목록으로 돌아가는 것으로 마무리한다.
    navigation.goBack();
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'left', 'right']}>
      {/* 헤더 */}
      <View
        className="flex-row items-center"
        style={{ height: normalize(52), paddingHorizontal: normalize(16), borderBottomWidth: 0.5, borderBottomColor: 'rgba(0,0,0,0.06)' }}
      >
        <Pressable onPress={() => navigation.goBack()} hitSlop={8} className="items-center justify-center" style={{ width: normalize(36), height: normalize(36) }}>
          <ChevronLeft size={normalize(22)} color="#000" strokeWidth={2} />
        </Pressable>
        <Text
          allowFontScaling={false}
          className="flex-1 text-center"
          style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_LG, color: '#000', letterSpacing: -0.4, marginRight: normalize(36) }}
        >
          새 글 작성
        </Text>
        <Pressable
          onPress={onSubmit}
          disabled={!canSubmit}
          className="items-center justify-center"
          style={{ height: normalize(32), paddingHorizontal: normalize(16), borderRadius: normalize(16), backgroundColor: ACCENT, opacity: canSubmit ? 1 : 0.35 }}
        >
          <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_SM, color: '#fff', letterSpacing: -0.2 }}>
            게시
          </Text>
        </Pressable>
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
                <ImageIcon size={normalize(28)} color="rgba(255,255,255,0.4)" strokeWidth={1.8} />
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
          <View style={{ paddingHorizontal: normalize(28) }}>
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
                  minHeight: normalize(52),
                  fontFamily: 'Pretendard-Medium',
                  fontSize: FONT_MD,
                  letterSpacing: -0.2,
                  lineHeight: FONT_MD * 1.55,
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
                  <MetaTile label="일시" value={dateLabel} sub={timeLabel} Icon={Clock} />
                  {/* 날씨 API 연동은 범위 밖 — 값이 있는 것처럼 보이지 않도록 미확인 상태를 그대로 보여준다. */}
                  <MetaTile label="날씨" value="정보 없음" sub="자동 감지 예정" Icon={CloudOff} placeholder />
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
                  {`다중 선택 · ${categories.size}개 선택됨`}
                </Text>
              </View>
              <View className="flex-row flex-wrap" style={{ gap: normalize(6) }}>
                {CATEGORIES.map(({ label, count }) => {
                  const selected = categories.has(label);
                  return (
                    <Pressable
                      key={label}
                      onPress={() => toggleCategory(label)}
                      className="flex-row items-center"
                      style={{ height: normalize(30), paddingHorizontal: normalize(12), borderRadius: normalize(15), gap: normalize(5), backgroundColor: selected ? 'rgba(227,27,89,0.08)' : SURFACE }}
                    >
                      <Text allowFontScaling={false} style={{ fontFamily: selected ? 'Pretendard-SemiBold' : 'Pretendard-Regular', fontSize: FONT_SM, color: selected ? ACCENT : 'rgba(0,0,0,0.55)', letterSpacing: -0.2 }}>
                        {label}
                      </Text>
                      <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Medium', fontSize: FONT_2XS, color: selected ? 'rgba(227,27,89,0.55)' : 'rgba(0,0,0,0.35)', letterSpacing: -0.1 }}>
                        {count}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_XS, color: 'rgba(0,0,0,0.4)', letterSpacing: -0.15, marginTop: normalize(10) }}>
                선택한 카테고리는 스팟 검색·필터에 사용됩니다.
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <LocationSheet visible={locationSheetVisible} selected={location} onSelect={setLocation} onClose={() => setLocationSheetVisible(false)} />
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
