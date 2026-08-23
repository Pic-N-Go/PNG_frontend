import React, { useEffect, useRef, useState } from 'react';
import { Alert, Image, Linking, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import { Camera, ChevronLeft, Info, MapPin, Plus, Search, X } from 'lucide-react-native';
import { toErrorMessage } from '@/api/auth';
import { useCreateContestEntry } from '@/hooks/useContest';
import { useSearchSpots } from '@/hooks/useSpot';
import { useDebounce } from '@/hooks/useDebounce';
import { parseExifDateTime } from '@/utils/exifDate';
import { toServerDateTime } from '@/utils/contestMappers';
import { CommunityDetailStackParamList } from '@/navigation/stacks/CommunityDetailStack';
import { BORDER_CONTROL, BUTTON_HEIGHT, BUTTON_RADIUS, CARD_RADIUS, CONTENT_PADDING, FONT_LG, FONT_MD, FONT_SM, FONT_XS, HAIRLINE_WIDTH, HEADER_HEIGHT } from '@/constants/layout';
import { normalize, normalizeFontSize } from '@/utils/normalize';
import { BRAND, BRAND_MUTED, BRAND_TINT, BRAND_TINT_ACTIVE, CARD, HAIRLINE, TEXT_SUB } from '@/constants/colors';

/**
 * 콘테스트 출품 작성 (시안 13a~13e) — contest-submit.html 1:1.
 * 앨범을 여러 번 왕복하지 않도록 남은 자리 수까지 한 번에 고르고, 이 화면에서 장별로 넘겨 쓴다.
 * 사진·설명은 출품 후 수정 불가(삭제 후 재출품)이므로 저장은 이 화면 하나뿐이다.
 */

const ACCENT = BRAND;
const SURFACE = CARD;
const CAPTION_MAX = 80;

interface Photo {
  id: string;
  uri: string;
  /**
   * 원본에서 읽은 촬영 시각. 피커가 quality 옵션으로 재인코딩하면서 EXIF를 떨어뜨려
   * 업로드된 파일에는 남지 않으므로, 고르는 시점에 붙잡아 둔다
   * (CommunityWriteScreen이 shotAt을 다루는 방식과 같다).
   */
  shotAt?: Date;
}

interface Draft {
  caption: string;
  spotName: string;
  /** 스팟 DB에서 고른 경우에만. 직접 입력이면 undefined라 서버는 spotName만 저장한다 */
  spotId?: number;
}

type UploadState = 'form' | 'uploading' | 'failed';

export default function ContestSubmitScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<CommunityDetailStackParamList>>();
  const route = useRoute<RouteProp<CommunityDetailStackParamList, 'ContestSubmit'>>();
  const contestId = route.params.contestId;
  const theme = route.params.theme ?? '';
  const monthLabel = route.params.monthLabel ?? '';
  const remainingSlots = route.params.remainingSlots ?? 0;

  // 3/3을 채우면 호출부가 이미 CTA를 막지만, 0으로 열리면 "남은 자리 0장" + 동작 안 하는 피커가 남는다.
  // 진입 경로가 늘어나도(딥링크 등) 여기서 한 번 더 끊는다.
  useEffect(() => {
    if (remainingSlots > 0) return;
    Alert.alert('출품 자리가 없어요', '이번 달은 이미 3장을 모두 출품했어요.', [{ text: '확인', onPress: () => navigation.goBack() }]);
  }, [remainingSlots, navigation]);

  const [photos, setPhotos] = useState<Photo[]>([]);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [current, setCurrent] = useState(0);
  // 사진마다 설명 길이가 달라 높이도 따로 기억한다(공유하면 전환 직후 이전 높이가 남는다)
  const [captionHeights, setCaptionHeights] = useState<Record<string, number>>({});
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [uploadState, setUploadState] = useState<UploadState>('form');
  const [uploadError, setUploadError] = useState('');

  const createEntry = useCreateContestEntry(contestId);

  const currentPhoto = photos[current];
  const currentDraft = currentPhoto ? drafts[currentPhoto.id] ?? { caption: '', spotName: '' } : { caption: '', spotName: '' };

  const updateCurrentDraft = (patch: Partial<Draft>) => {
    if (!currentPhoto) return;
    setDrafts((prev) => ({ ...prev, [currentPhoto.id]: { ...currentDraft, ...patch } }));
  };

  // iOS PHPickerViewController는 앱 프로세스 밖에서 뜨므로 권한 요청이 필요 없다.
  // Android에서만 물어보고, 거부한 사용자는 설정으로 안내한다(CommunityWriteScreen과 동일 패턴).
  const picking = useRef(false);
  const pickPhotos = async () => {
    if (photos.length >= remainingSlots || picking.current) return;
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
        selectionLimit: remainingSlots - photos.length,
        exif: true,
        quality: 0.8,
        preferredAssetRepresentationMode: ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Compatible,
      });
      if (result.canceled) return;

      const seen = new Set(photos.map((p) => p.id));
      const fresh = result.assets
        .map((asset) => ({
          id: asset.assetId ?? asset.uri,
          uri: asset.uri,
          shotAt: parseExifDateTime(asset.exif) ?? undefined,
        }))
        .filter((p) => !seen.has(p.id));
      if (fresh.length === 0) return;

      setPhotos((prev) => [...prev, ...fresh]);
      // 같은 자리에서 여러 장 찍는 경우가 많아, 직전 장에서 고른 장소를 기본값으로 미리 채운다.
      const lastSpot = photos.length > 0 ? drafts[photos[photos.length - 1].id]?.spotName ?? '' : '';
      setDrafts((prev) => {
        const next = { ...prev };
        fresh.forEach((p) => {
          next[p.id] = { caption: '', spotName: lastSpot };
        });
        return next;
      });
    } finally {
      picking.current = false;
    }
  };

  const removeCurrentPhoto = () => {
    if (!currentPhoto) return;
    const id = currentPhoto.id;
    setPhotos((prev) => prev.filter((p) => p.id !== id));
    setDrafts((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setCurrent((prev) => Math.max(0, prev - 1));
  };

  const nextPhoto = () => setCurrent((prev) => (prev + 1) % photos.length);

  // maxLength가 네이티브에서 강제되므로 별도 자르기는 필요 없다(웹 목업만 IME 우회 방어가 필요했다)
  const handleCaptionChange = (text: string) => updateCurrentDraft({ caption: text });

  // 글자마다 부르면 검색 API가 타이핑 수만큼 호출된다
  const debouncedQuery = useDebounce(searchQuery, 400);
  const spotSearch = useSearchSpots({ keyword: debouncedQuery, size: 20 }, { enabled: searchVisible });
  const foundSpots = spotSearch.data?.content ?? [];

  const selectSpot = (name: string, spotId?: number) => {
    updateCurrentDraft({ spotName: name, spotId });
    setSearchVisible(false);
    setSearchQuery('');
  };

  /**
   * 출품. 서버가 사진을 한 장씩만 받아서 순차로 올린다.
   *
   * 중간에 실패하면 앞의 장들은 이미 등록돼 있고 되돌릴 방법이 없다(서버에 여러 장을 묶는
   * 트랜잭션이 없다). 그래서 성공한 장은 폼에서 지우고 실패한 장부터 남겨 재시도하게 한다 —
   * 그대로 두면 "다시 출품하기"가 이미 올라간 사진을 한 번 더 올린다.
   */
  const startUpload = async () => {
    if (photos.length === 0 || uploadState === 'uploading') return;
    setUploadState('uploading');

    const uploaded: string[] = [];
    for (const photo of photos) {
      const draft = drafts[photo.id] ?? { caption: '', spotName: '' };
      const ext = photo.uri.split('.').pop()?.toLowerCase();
      // 확장자를 못 알아내는 경우가 있어 jpeg로 떨어뜨린다 — 서버는 실제 바이트로 판별한다.
      const safeExt = ext && /^(jpe?g|png|heic|webp)$/.test(ext) ? ext : 'jpg';

      try {
        await createEntry.mutateAsync({
          body: {
            caption: draft.caption.trim() || undefined,
            spotId: draft.spotId,
            // spotId가 있으면 서버가 스팟 이름으로 덮어쓰므로 굳이 같이 보내도 무해하다
            spotName: draft.spotName.trim() || undefined,
            shotAt: photo.shotAt ? toServerDateTime(photo.shotAt) : undefined,
          },
          photo: {
            uri: photo.uri,
            name: `contest-${uploaded.length}.${safeExt}`,
            type: safeExt === 'png' ? 'image/png' : safeExt === 'webp' ? 'image/webp' : 'image/jpeg',
          },
        });
        uploaded.push(photo.id);
      } catch (err) {
        setUploadError(toErrorMessage(err, '업로드에 실패했어요'));
        if (uploaded.length > 0) {
          setPhotos((prev) => prev.filter((p) => !uploaded.includes(p.id)));
          setCurrent(0);
        }
        setUploadState('failed');
        return;
      }
    }

    navigation.goBack();
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'left', 'right', 'bottom']}>
      <Header title="출품하기" onClose={() => navigation.goBack()} disabled={uploadState === 'uploading'} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: normalize(28) }}>
        <Text allowFontScaling={false} style={{ paddingHorizontal: CONTENT_PADDING, paddingBottom: normalize(14), fontFamily: 'Pretendard-Regular', fontSize: FONT_SM, letterSpacing: -0.2, color: '#8e8e93' }}>
          {`${theme} · ${monthLabel} 콘테스트 · 남은 자리 ${remainingSlots}장`}
        </Text>

        {photos.length === 0 ? (
          <Pressable
            onPress={pickPhotos}
            style={{ marginHorizontal: CONTENT_PADDING, aspectRatio: 334 / 188, borderRadius: CARD_RADIUS, backgroundColor: BRAND_TINT, borderWidth: BORDER_CONTROL, borderColor: BRAND_MUTED, alignItems: 'center', justifyContent: 'center', gap: normalize(10) }}
          >
            <View style={{ width: normalize(56), height: normalize(56), borderRadius: normalize(16), backgroundColor: BRAND_TINT, alignItems: 'center', justifyContent: 'center' }}>
              <Camera size={normalize(26)} color={ACCENT} strokeWidth={1.7} />
            </View>
            <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_MD, letterSpacing: -0.2, color: ACCENT }}>
              사진 선택
            </Text>
            <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_XS, letterSpacing: -0.1, color: TEXT_SUB }}>
              {`${theme} 주제에 어울리는 사진 최대 ${remainingSlots}장`}
            </Text>
          </Pressable>
        ) : (
          <>
            {photos.length > 1 && (
              <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: CONTENT_PADDING, paddingBottom: normalize(14), gap: normalize(8) }}>
                {photos.map((photo, index) => (
                  <Pressable
                    key={photo.id}
                    onPress={() => setCurrent(index)}
                    style={{ width: normalize(56), height: normalize(56), borderRadius: normalize(12), overflow: 'hidden', borderWidth: index === current ? 2 : 0, borderColor: ACCENT }}
                  >
                    <Image source={{ uri: photo.uri }} resizeMode="cover" style={{ width: '100%', height: '100%' }} />
                  </Pressable>
                ))}
                {photos.length < remainingSlots && (
                  <Pressable onPress={pickPhotos} style={{ width: normalize(56), height: normalize(56), borderRadius: normalize(12), backgroundColor: SURFACE, alignItems: 'center', justifyContent: 'center' }}>
                    <Plus size={normalize(18)} color="#8e8e93" strokeWidth={2} />
                  </Pressable>
                )}
                <Text allowFontScaling={false} style={{ marginLeft: 'auto', fontFamily: 'Pretendard-SemiBold', fontSize: FONT_SM, letterSpacing: -0.2, color: '#8e8e93' }}>
                  {`${current + 1}`}
                  <Text className="font-normal" style={{ color: '#c7c7cc' }}>{`/${photos.length}`}</Text>
                </Text>
              </View>
            )}

            <View style={{ marginHorizontal: CONTENT_PADDING, aspectRatio: 334 / 188, borderRadius: CARD_RADIUS, overflow: 'hidden', backgroundColor: SURFACE }}>
              <Image source={{ uri: currentPhoto.uri }} resizeMode="cover" style={{ width: '100%', height: '100%' }} />
              <Pressable
                onPress={removeCurrentPhoto}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="사진 제거"
                style={{ position: 'absolute', top: normalize(10), right: normalize(10), width: normalize(28), height: normalize(28), borderRadius: normalize(14), backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={normalize(14)} color="#fff" strokeWidth={2.2} />
              </Pressable>
            </View>

            <View style={{ paddingHorizontal: CONTENT_PADDING, paddingTop: normalize(22) }}>
              <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_XS, letterSpacing: -0.1, color: '#8e8e93' }}>
                설명
              </Text>
              <View style={{ marginTop: normalize(8), paddingBottom: normalize(2), borderBottomWidth: HAIRLINE_WIDTH, borderBottomColor: '#e6e6ea' }}>
                <TextInput
                  value={currentDraft.caption}
                  onChangeText={handleCaptionChange}
                  onContentSizeChange={(e) => {
                    // Fabric에선 리마운트 타이밍에 nativeEvent 없이 이벤트가 도착한다(타입은 non-null이라 tsc로 안 잡힘)
                    const height = e?.nativeEvent?.contentSize?.height;
                    if (height == null) return;
                    setCaptionHeights((prev) => ({ ...prev, [currentPhoto.id]: Math.max(normalize(23), height) }));
                  }}
                  maxLength={CAPTION_MAX}
                  multiline
                  textAlignVertical="top"
                  placeholder="이 사진에 대해 한 줄 남겨보세요"
                  placeholderTextColor="#c7c7cc"
                  style={{ height: captionHeights[currentPhoto.id] ?? normalize(23), fontFamily: 'Pretendard-Regular', fontSize: FONT_MD, lineHeight: FONT_MD * 1.55, letterSpacing: -0.2, color: '#000' }}
                />
              </View>
              <Text allowFontScaling={false} style={{ marginTop: normalize(6), textAlign: 'right', fontFamily: 'Pretendard-Regular', fontSize: FONT_XS, letterSpacing: -0.1, color: '#c7c7cc' }}>
                {`${currentDraft.caption.length}/${CAPTION_MAX}`}
              </Text>
            </View>

            <View style={{ paddingHorizontal: CONTENT_PADDING, paddingTop: normalize(22) }}>
              <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_XS, letterSpacing: -0.1, color: '#8e8e93' }}>
                촬영 장소
              </Text>
              <Pressable onPress={() => setSearchVisible(true)} style={{ width: '100%', marginTop: normalize(8), paddingBottom: normalize(10), borderBottomWidth: HAIRLINE_WIDTH, borderBottomColor: '#e6e6ea', flexDirection: 'row', alignItems: 'center', gap: normalize(8) }}>
                <MapPin size={normalize(16)} color="#8e8e93" strokeWidth={1.8} />
                <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_MD, letterSpacing: -0.2, color: currentDraft.spotName ? '#000' : '#c7c7cc' }}>
                  {currentDraft.spotName || '장소 검색'}
                </Text>
              </Pressable>
            </View>

            <View style={{ margin: normalize(22), marginTop: normalize(22), marginHorizontal: CONTENT_PADDING, padding: normalize(12), paddingHorizontal: normalize(14), borderRadius: normalize(12), backgroundColor: SURFACE, flexDirection: 'row', alignItems: 'flex-start', gap: normalize(8) }}>
              <Info size={normalize(15)} color="#8e8e93" strokeWidth={1.8} style={{ marginTop: normalize(2) }} />
              <Text allowFontScaling={false} style={{ flex: 1, fontFamily: 'Pretendard-Regular', fontSize: FONT_SM, lineHeight: FONT_SM * 1.5, letterSpacing: -0.2, color: '#5c5c60' }}>
                출품 후에는 수정할 수 없어요. 삭제하고 다시 출품해야 해요.
              </Text>
            </View>

            <View style={{ paddingHorizontal: CONTENT_PADDING, paddingTop: normalize(24), flexDirection: 'row', gap: normalize(8) }}>
              {photos.length > 1 && uploadState !== 'failed' && (
                <Pressable onPress={nextPhoto} style={{ flex: 1, height: BUTTON_HEIGHT, borderRadius: BUTTON_RADIUS, backgroundColor: SURFACE, alignItems: 'center', justifyContent: 'center' }}>
                  <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_MD, letterSpacing: -0.3, color: '#000' }}>
                    다음 사진
                  </Text>
                </Pressable>
              )}
              <Pressable
                onPress={uploadState === 'uploading' ? undefined : startUpload}
                disabled={uploadState === 'uploading'}
                style={{ flex: photos.length > 1 && uploadState !== 'failed' ? 1.4 : 1, height: BUTTON_HEIGHT, borderRadius: BUTTON_RADIUS, backgroundColor: uploadState === 'uploading' ? BRAND_MUTED : ACCENT, alignItems: 'center', justifyContent: 'center' }}
              >
                <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_MD, letterSpacing: -0.3, color: '#fff' }}>
                  {uploadState === 'uploading' ? '업로드 중…' : uploadState === 'failed' ? '다시 출품하기' : `${photos.length}장 출품하기`}
                </Text>
              </Pressable>
            </View>
          </>
        )}
      </ScrollView>

      {searchVisible && (
        // 루트 SafeAreaView의 패딩 박스를 기준으로 절대 배치되므로 이미 상태바 아래다 —
        // 여기서 SafeAreaView로 인셋을 또 주면 노치 높이만큼 헤더가 내려간다
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#fff' }}>
          <View style={{ height: HEADER_HEIGHT, paddingLeft: normalize(12), paddingRight: normalize(20), flexDirection: 'row', alignItems: 'center', gap: normalize(8) }}>
            <Pressable onPress={() => setSearchVisible(false)} hitSlop={8} style={{ width: normalize(40), height: normalize(40), alignItems: 'center', justifyContent: 'center' }}>
              <ChevronLeft size={normalize(22)} color="#000" strokeWidth={2} />
            </Pressable>
            <View style={{ flex: 1, height: normalize(40), paddingHorizontal: normalize(14), borderRadius: normalize(12), backgroundColor: SURFACE, flexDirection: 'row', alignItems: 'center', gap: normalize(8) }}>
              <Search size={normalize(15)} color="#8e8e93" strokeWidth={1.8} />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="촬영 장소 검색"
                placeholderTextColor="#8e8e93"
                autoFocus
                style={{ flex: 1, fontFamily: 'Pretendard-Regular', fontSize: FONT_MD, letterSpacing: -0.2, color: '#000' }}
              />
            </View>
          </View>

          <ScrollView>
            {debouncedQuery.trim().length > 0 && foundSpots.length === 0 && !spotSearch.isFetching && (
              <View style={{ paddingTop: normalize(26), paddingHorizontal: CONTENT_PADDING }}>
                <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_MD, letterSpacing: -0.3, color: '#000' }}>
                  일치하는 스팟이 없어요
                </Text>
                <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_SM, letterSpacing: -0.2, color: '#8e8e93', marginTop: normalize(6) }}>
                  직접 입력해도 출품할 수 있어요
                </Text>
              </View>
            )}

            {foundSpots.map((spot) => (
              <Pressable key={spot.id} onPress={() => selectSpot(spot.name, spot.id)} style={{ width: '100%', paddingVertical: normalize(13), paddingHorizontal: CONTENT_PADDING, flexDirection: 'row', alignItems: 'center', gap: normalize(12) }}>
                <View style={{ width: normalize(34), height: normalize(34), borderRadius: normalize(17), backgroundColor: SURFACE, alignItems: 'center', justifyContent: 'center' }}>
                  <MapPin size={normalize(17)} color="#8e8e93" strokeWidth={1.8} />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_MD, letterSpacing: -0.3, color: '#000' }}>
                    {spot.name}
                  </Text>
                  <Text allowFontScaling={false} numberOfLines={1} style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_XS, letterSpacing: -0.1, color: '#8e8e93', marginTop: normalize(2) }}>
                    {spot.address}
                  </Text>
                </View>
              </Pressable>
            ))}

            {/* 직접 입력 — 스팟 DB에 없어도 출품은 막지 않는다. 항상 목록 맨 아래, 결과 없으면 맨 위로 */}
            <Pressable
              onPress={() => selectSpot(searchQuery)}
              disabled={!searchQuery}
              style={{ width: '100%', paddingVertical: normalize(13), paddingHorizontal: CONTENT_PADDING, flexDirection: 'row', alignItems: 'center', gap: normalize(12), borderTopWidth: foundSpots.length > 0 ? HAIRLINE_WIDTH : 0, borderTopColor: HAIRLINE, marginTop: foundSpots.length > 0 ? normalize(6) : 0 }}
            >
              <View style={{ width: normalize(34), height: normalize(34), borderRadius: normalize(17), backgroundColor: foundSpots.length === 0 && searchQuery ? BRAND_TINT_ACTIVE : SURFACE, alignItems: 'center', justifyContent: 'center' }}>
                <Plus size={normalize(18)} color="#8e8e93" strokeWidth={2} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_MD, letterSpacing: -0.3, color: '#000' }}>
                  {searchQuery ? `"${searchQuery}" 직접 입력` : '직접 입력'}
                </Text>
                <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_XS, letterSpacing: -0.1, color: '#8e8e93', marginTop: normalize(2) }}>
                  스팟 상세로는 연결되지 않아요
                </Text>
              </View>
            </Pressable>
          </ScrollView>
        </View>
      )}

      {/* 업로드 실패 — "다시 시도" 액션이 붙으므로 토스트(44px)가 아니라 48px 스낵바 규약을 쓴다.
          폼은 그대로 두고 이것만 띄운다 — 입력한 내용이 사라진 것처럼 보이면 안 된다. */}
      {uploadState === 'failed' && (
        <View
          style={{
            position: 'absolute',
            left: normalize(28),
            right: normalize(28),
            bottom: normalize(92),
            height: normalize(48),
            borderRadius: normalize(24),
            backgroundColor: 'rgba(0,0,0,0.82)',
            flexDirection: 'row',
            alignItems: 'center',
            paddingLeft: normalize(20),
            paddingRight: normalize(8),
          }}
        >
          <Text allowFontScaling={false} style={{ flex: 1, fontFamily: 'Pretendard-Medium', fontSize: normalizeFontSize(14), letterSpacing: -0.2, color: '#fff' }}>
            {uploadError || '업로드에 실패했어요'}
          </Text>
          <Pressable onPress={startUpload} style={{ height: normalize(34), paddingHorizontal: normalize(14), borderRadius: normalize(17), alignItems: 'center', justifyContent: 'center' }}>
            <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_SM, letterSpacing: -0.2, color: ACCENT }}>
              다시 시도
            </Text>
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
}

function Header({ title, onClose, disabled }: { title: string; onClose: () => void; disabled: boolean }) {
  return (
    <View style={{ height: HEADER_HEIGHT, paddingLeft: normalize(12), paddingRight: normalize(20), flexDirection: 'row', alignItems: 'center', gap: normalize(4) }}>
      <Pressable onPress={disabled ? undefined : onClose} disabled={disabled} hitSlop={8} accessibilityRole="button" accessibilityLabel="닫기" style={{ width: normalize(40), height: normalize(40), alignItems: 'center', justifyContent: 'center' }}>
        <X size={normalize(20)} color={disabled ? '#c7c7cc' : '#000'} strokeWidth={2} />
      </Pressable>
      <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_LG, letterSpacing: -0.4, color: '#000' }}>
        {title}
      </Text>
    </View>
  );
}
