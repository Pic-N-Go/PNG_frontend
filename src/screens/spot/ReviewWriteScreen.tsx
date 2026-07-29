import React from 'react';
import {
  View, Text, TextInput, ScrollView, Pressable, Platform, Image,
  KeyboardAvoidingView, ActivityIndicator, Alert, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
// 시간대 칩만 tabler — 목업은 meteocons 컬러 아이콘이고 대체안 확정 전까지 유지한다.
import { IconSunrise, IconSun, IconSunset, IconMoon } from '@tabler/icons-react-native';
// CalendarDays가 아니라 Calendar — Days 쪽은 날짜 칸을 길이 0짜리 선(h.01) + round linecap으로
// 그려서 작은 크기에서 점 얼룩처럼 보인다. 목업 SVG와 도형이 같은 것도 Calendar 쪽.
import { ChevronLeft, Calendar, Image as ImageIcon, Check, Camera, CircleDot, X } from 'lucide-react-native';
import { SpotStackParamList } from '@/navigation/stacks/SpotStack';
import type { ReviewPhotoUpload } from '@/api/spot';
import { ApiError } from '@/api/auth';
import {
  useAddReviewPhotos, useCreateReview, useDeleteReviewPhoto, useSpotDetail, useUpdateReview,
} from '@/hooks/useSpot';
import { normalize, normalizeFontSize } from '@/utils/normalize';
import {
  FONT_2XS, FONT_XS, FONT_SM, FONT_MD, FONT_LG,
  GRID_PADDING, BUTTON_HEIGHT, BUTTON_RADIUS, CARD_RADIUS, INPUT_RADIUS,
} from '@/constants/layout';
import type { ReviewPhotoDTO, ReviewTagApi, TimePeriodApi } from '@/types/spot';
import { MAX_REVIEW_TAGS, REVIEW_TAGS } from '@/constants/reviewTags';

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

// 서버가 code별 한국어 message를 주므로 그대로 노출한다(장수 초과·본인 리뷰 아님 등).
const errorTextOf = (err: unknown) => (err instanceof ApiError ? err.message : '잠시 후 다시 시도해 주세요.');

const CONTENT_MIN = 20;
const CONTENT_MAX = 500;
const MAX_PHOTOS = 5;
const MAX_EQUIPMENT = 5;
// 서버 max-file-size와 동일. 초과분은 업로드 전에 걸러 낸다.
const MAX_PHOTO_BYTES = 20 * 1024 * 1024;
// Android는 압축 전 크기만 알 수 있어 한도를 그대로 쓰면 오탐이 난다. 압축률을 감안한 여유 배수.
const ANDROID_SIZE_SLACK = 3;

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

/**
 * quality 옵션 때문에 같은 사진을 다시 고르면 매번 새 임시 파일로 재인코딩되어 uri가 달라진다.
 * 중복 판정은 사진첩 원본을 가리키는 assetId로 해야 하고, 없을 때만 uri로 폴백한다.
 */
type PickedPhoto = ReviewPhotoUpload & { assetId?: string | null; fingerprint: string };
/**
 * assetId는 iOS에선 오지만 Android 최신 photo picker 경로에선 항상 null이다.
 * uri는 quality 재인코딩 때문에 매번 달라져 폴백으로 쓸 수 없으므로,
 * 원본 메타데이터(파일명·크기·해상도) 조합을 보조 식별자로 쓴다.
 */
const identityOf = (p: PickedPhoto) => p.assetId ?? p.fingerprint;

const MIME_BY_EXT: Record<string, string> = {
  jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', heic: 'image/heic', heif: 'image/heif',
};

/**
 * 확장자는 asset.fileName(사진첩 원본 이름)이 아니라 실제로 전송하는 파일인 asset.uri에서 뽑는다.
 * quality 재인코딩 결과가 uri에 반영되므로, 원본이 HEIC여도 uri는 .jpg가 된다.
 * fileName을 쓰면 내용은 JPEG인데 S3 키만 .heic로 남아 일부 기기에서 표시가 깨진다.
 */
const extOf = (uri: string): string | null => {
  const matched = /\.([a-zA-Z0-9]+)(?:[?#]|$)/.exec(uri);
  const ext = matched?.[1].toLowerCase();
  // 폴백으로 'jpg'를 주면 GIF·WebP 바이트가 .jpg로 둔갑해 올라가 표시가 깨진다(스펙 미허용 형식).
  return ext && MIME_BY_EXT[ext] ? ext : null;
};

const toISODate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** new Date('yyyy-MM-dd')는 UTC 자정으로 파싱돼 시간대에 따라 하루 밀린다. 로컬 날짜로 직접 만든다. */
const fromISODate = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
};

/**
 * 서버는 장비를 ", "로 합쳐 보관한다. 칩으로 표현 가능한 항목만 되살린다.
 * 주의: 걸러진 값은 화면에서 사라지는 데 그치지 않고 저장 시 삭제된다 — PUT이 equipmentInfo를
 * 무조건 덮어쓰기 때문이다. EQUIPMENT가 하드코딩이라 지금은 닿지 않지만, 항목 이름을 바꾸거나
 * "내 장비" 조회로 교체하면 그 순간 조용한 데이터 유실이 된다. 그때는 미지의 값을 보존해야 한다.
 */
const seedEquipmentOf = (joined: string | null) => {
  if (!joined) return [];
  const known = new Set(EQUIPMENT.map((e) => e.name));
  return joined.split(',').map((s) => s.trim()).filter((s) => known.has(s));
};

export default function ReviewWriteScreen({ route, navigation }: Props) {
  const { spotId, edit } = route.params;
  const isEdit = edit !== undefined;
  const { data: spot } = useSpotDetail(spotId);
  const createReview = useCreateReview(spotId);
  const updateReview = useUpdateReview(spotId);
  const addPhotos = useAddReviewPhotos(spotId);
  const deletePhoto = useDeleteReviewPhoto(spotId);
  // 진행 중에 다른 사진 요청을 받으면 서버 응답 순서가 뒤집혀 화면이 과거 상태로 되돌아간다.
  const photoBusy = addPhotos.isPending || deletePhoto.isPending;
  const submitting = isEdit ? updateReview.isPending : createReview.isPending;

  const today = React.useRef(new Date()).current;
  const [rating, setRating] = React.useState(edit?.rating ?? 0);
  const [visitedAt, setVisitedAt] = React.useState<Date>(edit?.visitedAt ? fromISODate(edit.visitedAt) : today);
  const [showDatePicker, setShowDatePicker] = React.useState(false);
  const [period, setPeriod] = React.useState<TimePeriodApi | null>(edit?.timePeriod ?? null);
  const [content, setContent] = React.useState(edit?.content ?? '');
  const [contentFocused, setContentFocused] = React.useState(false);
  const [photos, setPhotos] = React.useState<PickedPhoto[]>([]);
  // 수정 모드의 사진은 저장 버튼과 무관하게 즉시 서버에 반영되므로(전용 엔드포인트) 로컬 파일이
  // 아니라 서버가 준 목록을 그대로 들고 있는다. 작성 모드에서는 항상 빈 배열.
  const [serverPhotos, setServerPhotos] = React.useState<ReviewPhotoDTO[]>(edit?.photos ?? []);
  const [tags, setTags] = React.useState<ReviewTagApi[]>(edit?.tags ?? []);
  const [equipment, setEquipment] = React.useState<string[]>(seedEquipmentOf(edit?.equipmentInfo ?? null));

  const trimmed = content.trim();
  const canSubmit = rating > 0 && period !== null && trimmed.length >= CONTENT_MIN;

  // 등록·수정 성공으로 나가는 건 유실이 아니므로 확인창을 건너뛴다.
  const submitted = React.useRef(false);
  // 수정 모드는 폼이 채워진 상태로 시작하므로 "값이 있는지"가 아니라 "처음과 달라졌는지"로 판단한다.
  const initial = React.useRef({
    rating: edit?.rating ?? 0,
    period: edit?.timePeriod ?? null,
    content: (edit?.content ?? '').trim(),
    visitedAt: toISODate(edit?.visitedAt ? fromISODate(edit.visitedAt) : today),
    equipment: seedEquipmentOf(edit?.equipmentInfo ?? null).join('|'),
    // 선택 순서가 달라도 같은 조합이면 변경으로 보지 않는다.
    tags: [...(edit?.tags ?? [])].sort().join('|'),
  }).current;
  // 사진은 확인창 대상이 아니다(이미 저장됨). 다만 문구가 "저장되지 않아요"만 남으면
  // 방금 지운 사진이 되살아난다고 오해할 수 있어 안내를 덧붙인다.
  const photosTouched = React.useRef(false);
  const isDirty =
    rating !== initial.rating ||
    period !== initial.period ||
    trimmed !== initial.content ||
    toISODate(visitedAt) !== initial.visitedAt ||
    equipment.join('|') !== initial.equipment ||
    [...tags].sort().join('|') !== initial.tags ||
    photos.length > 0;

  React.useEffect(() => {
    // 작성 분량이 큰 화면이라 뒤로가기·스와이프·안드로이드 백키로 날리는 사고를 막는다.
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      if (!isDirty || submitted.current) return;
      e.preventDefault();
      const lost = photosTouched.current
        ? '사진 변경은 이미 저장됐어요. 나머지 입력한 내용은 저장되지 않아요.'
        : '입력한 내용은 저장되지 않아요.';
      Alert.alert('작성을 그만둘까요?', lost, [
        { text: '계속 작성', style: 'cancel' },
        { text: '나가기', style: 'destructive', onPress: () => navigation.dispatch(e.data.action) },
      ]);
    });
    return unsubscribe;
  }, [navigation, isDirty]);

  const toggleTag = (tag: ReviewTagApi) =>
    setTags((prev) => {
      if (prev.includes(tag)) return prev.filter((t) => t !== tag);
      // 서버 @Size(max = 5). 넘기면 400이라 프론트에서 막는다.
      return prev.length >= MAX_REVIEW_TAGS ? prev : [...prev, tag];
    });

  const toggleEquipment = (name: string) =>
    setEquipment((prev) => {
      if (prev.includes(name)) return prev.filter((e) => e !== name);
      // 서버 @Size(max = 5) + 합쳐서 100자 제한(초과 시 400 REVIEW_EQUIPMENT_INFO_TOO_LONG).
      // 지금은 목록이 4개·합계 61자라 둘 다 닿지 않지만, 내 장비 조회로 바뀌면 길이도 막아야 한다.
      return prev.length >= MAX_EQUIPMENT ? prev : [...prev, name];
    });

  // ponytail: EXIF를 지우지 않는다. 서버가 EXIF에서 촬영 위치(위도·경도)를 읽어 사진 정보 화면에
  // 표시할 예정이라 GPS 태그가 유지되어야 한다.
  // (docs/guide/api/photo-upload-spec.md의 "저장 시 GPS 제거" 규정은 이 결정으로 철회됨 — 갱신 완료)
  // 주의: 그 표시 기능은 아직 없다 — 백엔드 ExifExtractor는 어디서도 호출되지 않는 죽은 코드다.
  // 즉 지금은 좌표가 공개되기만 하고 쓰이지는 않는다. 리뷰 목록은 인증 없이 조회되므로
  // 사진 섹션에 고지 문구를 뒀다. 표시 기능을 끝내 안 만들면 클라에서 GPS를 지우는 쪽이 맞다.
  // 권한 요청·피커 호출 모두 reject할 수 있다(Android는 요청이 겹치면 IllegalStateException,
  // iOS는 presenting VC를 못 찾으면 예외). 처리하지 않으면 unhandled rejection으로 끝나
  // 프로덕션에서는 아무 반응도 없다. 재진입 가드까지 둬 더블탭도 막는다.
  const picking = React.useRef(false);
  // 수정 모드는 고른 사진이 곧바로 POST로 가 photos state에 남지 않는다. 그래서 이 세션에 올린
  // 신원을 따로 모아야 "다른 피커 세션에서 같은 사진을 다시 고르는" 중복을 걸러낼 수 있다.
  const uploadedIds = React.useRef(new Set<string>());
  const addPhoto = async () => {
    if (thumbs.length >= MAX_PHOTOS || picking.current || photoBusy) return;
    picking.current = true;
    try {
      await pickPhotos();
    } catch (err) {
      if (__DEV__) console.warn('[picker] 실패:', err);
      Alert.alert('사진을 불러오지 못했어요', '잠시 후 다시 시도해 주세요.');
    } finally {
      picking.current = false;
    }
  };

  const pickPhotos = async () => {
    // iOS는 PHPickerViewController가 앱 외부 프로세스로 떠서 권한이 필요 없다(네이티브도 검사하지 않음).
    // 우리가 물어보면 거부한 사용자가 동작하는 기능에서 영구히 차단되므로 Android에서만 요청한다.
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
      selectionLimit: MAX_PHOTOS - thumbs.length,
      quality: 0.8,
      // iOS 기본값은 .current(전사 회피)라서 HEIC 자산이 원본 바이트째로 넘어온다
      // (ImageUtils.swift의 `case UTType.heic: return (rawData, ".heic")` 분기 — quality가 적용되지 않는다).
      // 서버에 변환 로직이 없어 그대로 두면 .heic가 S3에 올라가 일부 기기에서 표시가 깨진다.
      // Compatible로 두면 시스템이 JPEG로 전사해 넘겨준다. iOS 전용 옵션.
      preferredAssetRepresentationMode: ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Compatible,
    });
    if (result.canceled) return;

    // iOS의 fileSize는 압축 후(실제 전송) 크기라 서버 한도를 그대로 적용할 수 있다.
    // Android는 압축 전 원본 크기라 같은 기준을 쓰면 압축하면 통과할 사진을 오탐으로 막는다.
    // 서버도 이제 초과를 400 + 한국어 message로 알려주지만(이전엔 본문 없는 500),
    // 20MB를 다 올려보낸 뒤 거부당하는 낭비는 그대로다. 그래서 Android에서는 압축률을 감안한
    // 관대한 상한만 둬 명백히 과대한 파일을 미리 걸러낸다.
    const sizeLimit = Platform.OS === 'ios' ? MAX_PHOTO_BYTES : MAX_PHOTO_BYTES * ANDROID_SIZE_SLACK;

    const picked: PickedPhoto[] = [];
    let tooLarge = 0;
    let unsupported = 0;
    result.assets.forEach((asset, idx) => {
      if (asset.fileSize && asset.fileSize > sizeLimit) {
        tooLarge += 1;
        return;
      }
      const ext = extOf(asset.uri);
      if (!ext) {
        unsupported += 1;
        return;
      }
      picked.push({
        uri: asset.uri,
        name: `review_${Date.now()}_${idx}.${ext}`,
        type: MIME_BY_EXT[ext],
        assetId: asset.assetId,
        // Android는 assetId가 null이라 중복 판정에 쓸 보조 키가 필요하다. 원본 메타데이터는
        // 재인코딩과 무관하게 같은 사진이면 동일하다.
        fingerprint: `${asset.fileName ?? ''}|${asset.fileSize ?? ''}|${asset.width}x${asset.height}`,
      });
    });

    const skipped: string[] = [];
    if (tooLarge > 0) skipped.push(`${tooLarge}장은 용량이 너무 커요`);
    if (unsupported > 0) skipped.push(`${unsupported}장은 지원하지 않는 형식이에요(JPG·PNG·HEIC만 가능)`);
    if (picked.length === 0) {
      // 전부 걸러졌으면 여기서 안내하고 끝낸다. 아래 중복 안내와 겹쳐 Alert가 연달아 뜨는 것을 막는다.
      if (skipped.length > 0) Alert.alert('첨부하지 못한 사진', skipped.join('\n'));
      return;
    }

    // setPhotos 업데이터는 dev에서 두 번 호출될 수 있어 카운트를 그 안에서 세지 않는다.
    const seen = isEdit ? new Set(uploadedIds.current) : new Set(photos.map(identityOf));
    const fresh = picked.filter((p) => {
      if (seen.has(identityOf(p))) return false;
      seen.add(identityOf(p));
      return true;
    });
    const duplicated = picked.length - fresh.length;
    if (duplicated > 0) skipped.push(`${duplicated}장은 이미 추가되어 있어요`);

    // 사유가 여러 개여도 Alert는 하나만 띄운다(iOS에서는 여러 개가 쌓여 연달아 닫아야 한다).
    if (skipped.length > 0) Alert.alert('첨부하지 못한 사진', skipped.join('\n'));
    if (fresh.length === 0) return;
    if (isEdit) {
      // 한 장씩 여러 번 호출하면 서버 상한 검사가 매번 다른 기준으로 돌아 일부만 올라간다.
      await uploadPhotos(fresh.slice(0, MAX_PHOTOS - thumbs.length));
      return;
    }
    setPhotos((prev) => [...prev, ...fresh].slice(0, MAX_PHOTOS));
  };

  const removePhoto = (idx: number) => setPhotos((prev) => prev.filter((_, i) => i !== idx));

  const confirmDeletePhoto = (photoId: number) =>
    Alert.alert('사진을 삭제할까요?', '되돌릴 수 없어요.', [
      { text: '취소', style: 'cancel' },
      { text: '삭제', style: 'destructive', onPress: () => runDeletePhoto(photoId) },
    ]);

  const runDeletePhoto = async (photoId: number) => {
    if (!edit) return;
    try {
      await deletePhoto.mutateAsync({ reviewId: edit.reviewId, photoId });
      // 204라 목록이 오지 않는다. 무효화한 목록 쿼리와 어긋나지 않게 해당 항목만 뺀다.
      setServerPhotos((prev) => prev.filter((p) => p.photoId !== photoId));
      // photoId로는 어떤 파일이었는지 역산할 수 없다. 지운 사진을 다시 고르는 것이 막히지 않게
      // 중복 판정 기록을 비운다 — 삭제 직후 한 번은 중복이 통과할 수 있지만 그쪽이 덜 나쁘다.
      uploadedIds.current.clear();
      photosTouched.current = true;
    } catch (err) {
      Alert.alert('사진을 삭제하지 못했어요', errorTextOf(err));
    }
  };

  /** 응답이 추가분이 아니라 전체 목록이라 그대로 갈아끼운다. */
  const uploadPhotos = async (files: PickedPhoto[]) => {
    if (!edit) return;
    try {
      setServerPhotos(await addPhotos.mutateAsync({ reviewId: edit.reviewId, photos: files }));
      files.forEach((f) => uploadedIds.current.add(identityOf(f)));
      photosTouched.current = true;
    } catch (err) {
      Alert.alert('사진을 추가하지 못했어요', errorTextOf(err));
    }
  };

  /** 수정 모드는 서버 사진, 작성 모드는 고른 파일 — 화면은 같은 목록으로 그린다. */
  const thumbs = isEdit
    ? serverPhotos.map((photo) => ({
        key: String(photo.photoId),
        uri: photo.url,
        onRemove: () => confirmDeletePhoto(photo.photoId),
      }))
    : photos.map((photo, idx) => ({
        key: identityOf(photo),
        uri: photo.uri,
        onRemove: () => removePhoto(idx),
      }));

  // isPending은 상태 갱신 뒤에야 true가 된다. 같은 틱에 두 번 눌리면 POST가 두 번 나가고,
  // 서버는 1인 1리뷰를 동시 요청까지 막지 않는다(백엔드 요청 사항). ref로 즉시 잠근다.
  const submitLock = React.useRef(false);
  const onSubmit = () => {
    if (!canSubmit || period === null || submitting || submitLock.current) return;
    submitLock.current = true;
    const body = {
      rating,
      content: trimmed,
      timePeriod: period,
      visitedAt: toISODate(visitedAt),
      // 미선택이어도 빈 배열로 보낸다. 수정은 전체 교체라 []가 곧 "태그 전부 해제"다.
      tags,
      ...(equipment.length > 0 && { equipmentInfo: equipment }),
    };
    const handlers = {
      onSuccess: () => {
        submitted.current = true;
        navigation.goBack();
      },
      onSettled: () => {
        submitLock.current = false;
      },
      onError: (err: unknown) => {
        // 스팟당 1리뷰(409). 정상 경로는 myReviewId로 버튼 단계에서 갈라지지만(ReviewTab),
        // 작성 화면을 열어둔 사이 다른 기기에서 리뷰가 생기는 경우가 남는다. 서버도 동시 요청을
        // 완전히 막지 않아 마지막 방어선으로 둔다. 안내 후 목록으로 돌려보낸다.
        if (err instanceof ApiError && err.status === 409) {
          submitted.current = true; // 유실이 아니라 중복이므로 이탈 확인창을 건너뛴다
          Alert.alert('이미 리뷰를 작성했어요', errorTextOf(err), [
            { text: '확인', onPress: () => navigation.goBack() },
          ]);
          return;
        }
        Alert.alert(isEdit ? '수정 실패' : '등록 실패', errorTextOf(err));
      },
    };

    if (isEdit) {
      // PUT은 JSON이라 사진을 다루지 않는다. 사진은 전용 엔드포인트로 이미 반영돼 있어 여기서 보낼 것이 없다.
      updateReview.mutate({ reviewId: edit.reviewId, body }, handlers);
      return;
    }
    createReview.mutate({ body, photos: photos.map(({ uri, name, type }) => ({ uri, name, type })) }, handlers);
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
          {isEdit ? '리뷰 수정' : '리뷰 작성'}
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
                <Pressable key={value} onPress={() => setRating(value)} hitSlop={4} accessibilityRole="button" accessibilityLabel={`별점 ${value}점`} style={{ padding: normalize(4) }}>
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

          <Section label="태그" hint={`선택 · 최대 ${MAX_REVIEW_TAGS}개`}>
            <View className="flex-row flex-wrap" style={{ gap: normalize(8) }}>
              {REVIEW_TAGS.map(({ tag, label }) => {
                const selected = tags.includes(tag);
                return (
                  <Pressable
                    key={tag}
                    onPress={() => toggleTag(tag)}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    className="items-center justify-center"
                    style={{
                      height: normalize(30),
                      paddingHorizontal: normalize(14),
                      borderRadius: normalize(15),
                      backgroundColor: selected ? 'rgba(227,27,89,0.1)' : SURFACE,
                    }}
                  >
                    <Text
                      allowFontScaling={false}
                      /* 목업은 12px이지만 폰트 토큰 밖이라 FONT_SM(13)으로 올렸다. */
                      style={{
                        fontFamily: selected ? 'Pretendard-SemiBold' : 'Pretendard-Regular',
                        fontSize: FONT_SM,
                        color: selected ? BRAND : 'rgba(0,0,0,0.45)',
                        letterSpacing: -0.1,
                      }}
                    >
                      {`#${label}`}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <Text
              allowFontScaling={false}
              style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_XS, color: 'rgba(0,0,0,0.28)', letterSpacing: -0.1, marginTop: normalize(8) }}
            >
              자주 쓰인 태그는 스팟 상세 페이지에 노출됩니다
            </Text>
          </Section>

          <Section
            label={isEdit ? '첨부한 사진' : '사진 첨부'}
            /* 수정 모드의 추가·삭제는 저장 버튼을 기다리지 않고 바로 반영된다. 모르면 되돌릴 수 있다고 착각한다. */
            hint={isEdit ? `최대 ${MAX_PHOTOS}장 · 바로 저장돼요` : `최대 ${MAX_PHOTOS}장`}
          >
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: normalize(8) }}>
              {thumbs.map((thumb) => (
                <View
                  key={thumb.key}
                  style={{ width: normalize(72), height: normalize(72), borderRadius: INPUT_RADIUS, overflow: 'hidden', backgroundColor: SURFACE }}
                >
                  <Image source={{ uri: thumb.uri }} resizeMode="cover" style={{ width: '100%', height: '100%' }} />
                  <Pressable
                    onPress={thumb.onRemove}
                    disabled={photoBusy}
                    hitSlop={6}
                    accessibilityRole="button"
                    accessibilityLabel="사진 삭제"
                    className="items-center justify-center"
                    style={{
                      position: 'absolute', top: normalize(4), right: normalize(4),
                      width: normalize(18), height: normalize(18), borderRadius: normalize(9),
                      backgroundColor: 'rgba(0,0,0,0.5)', opacity: photoBusy ? 0.4 : 1,
                    }}
                  >
                    <X size={normalize(10)} color="#fff" strokeWidth={3} />
                  </Pressable>
                </View>
              ))}
              {thumbs.length < MAX_PHOTOS && (
                <Pressable
                  onPress={addPhoto}
                  disabled={photoBusy}
                  accessibilityRole="button"
                  accessibilityLabel="사진 추가"
                  className="items-center justify-center"
                  style={{
                    width: normalize(72), height: normalize(72), borderRadius: INPUT_RADIUS,
                    backgroundColor: SURFACE, borderWidth: 1.5, borderColor: 'rgba(0,0,0,0.12)',
                    borderStyle: 'dashed', gap: normalize(4), opacity: photoBusy ? 0.4 : 1,
                  }}
                >
                  {addPhotos.isPending ? (
                    <ActivityIndicator size="small" color={ICON_WEAK} />
                  ) : (
                    <>
                      <ImageIcon size={normalize(22)} color={ICON_WEAK} strokeWidth={2} />
                      <Text
                        allowFontScaling={false}
                        style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_2XS, color: 'rgba(0,0,0,0.3)', letterSpacing: -0.1 }}
                      >
                        {`${thumbs.length}/${MAX_PHOTOS}`}
                      </Text>
                    </>
                  )}
                </Pressable>
              )}
            </ScrollView>
            {/* 촬영 위치는 EXIF에 남긴다(아래 주석 참고). 공개 엔드포인트로 나가므로 고지한다. */}
            <Text
              allowFontScaling={false}
              style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_XS, color: 'rgba(0,0,0,0.28)', letterSpacing: -0.1, marginTop: normalize(8) }}
            >
              사진에 담긴 촬영 위치가 다른 사용자에게 보일 수 있어요
            </Text>
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
            disabled={!canSubmit || submitting}
            className="w-full items-center justify-center"
            style={{ height: BUTTON_HEIGHT, borderRadius: BUTTON_RADIUS, backgroundColor: BRAND, opacity: canSubmit ? 1 : 0.35 }}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text
                allowFontScaling={false}
                style={{ fontFamily: 'Pretendard-Medium', fontSize: FONT_MD, color: '#fff', letterSpacing: -0.2 }}
              >
                {isEdit ? '수정 완료' : '리뷰 등록하기'}
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
