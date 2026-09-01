import React from 'react';
import {
  View, Text, TextInput, ScrollView, Pressable, Platform, Image,
  KeyboardAvoidingView, ActivityIndicator, Alert, Linking,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { usePreventRemove } from '@react-navigation/native';
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
import { useMyEquipments } from '@/hooks/useEquipment';
import { normalize, normalizeFontSize } from '@/utils/normalize';
import { BORDER_CONTROL, BUTTON_HEIGHT, BUTTON_RADIUS, CARD_RADIUS, FONT_2XS, FONT_LG, FONT_MD, FONT_SM, FONT_XS, GRID_PADDING, HAIRLINE_WIDTH, INPUT_RADIUS } from '@/constants/layout';
import type { ReviewPhotoDTO, ReviewTagApi, TimePeriodApi } from '@/types/spot';
import { MAX_REVIEW_TAGS, REVIEW_TAGS } from '@/constants/reviewTags';
import ExifConsentSection from '@/components/common/ExifConsentSection';
import { BRAND, BRAND_TINT_ACTIVE, CARD, HAIRLINE, TEXT_SUB } from '@/constants/colors';

type Props = NativeStackScreenProps<SpotStackParamList, 'ReviewWrite'>;

const SURFACE = CARD;
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

/**
 * 401은 화면에서 알리지 않는다. useAuthStore의 401 핸들러가 이미 만료 Alert을 띄우고 로그아웃까지
 * 하므로, 여기서 또 띄우면 같은 문구의 다이얼로그가 두 겹으로 쌓인다(그것도 화면이 언마운트되는 중에).
 */
const isExpired = (err: unknown) => err instanceof ApiError && err.status === 401;

const CONTENT_MIN = 20;
const CONTENT_MAX = 500;
const MAX_PHOTOS = 5;
const MAX_EQUIPMENT = 5;
// 서버는 장비를 ", "로 합쳐 100자 컬럼에 넣는다. 초과 시 400 REVIEW_EQUIPMENT_INFO_TOO_LONG.
const MAX_EQUIPMENT_CHARS = 100;
// 서버 max-file-size와 동일. 초과분은 업로드 전에 걸러 낸다.
const MAX_PHOTO_BYTES = 20 * 1024 * 1024;
// 서버 max-request-size는 100MB인데 5장 × 20MB면 정확히 100MB라 여유가 0이다. 같은 요청에
// JSON 파트와 multipart 경계 문자열도 들어가므로 합계는 한 단계 낮춰 잡는다. quality 1로
// 바꾼 뒤로는 원본이 그대로 올라가 이 상한에 실제로 닿을 수 있다.
const MAX_TOTAL_BYTES = 90 * 1024 * 1024;

const STAR_LABELS = ['선택 안 됨', '별로예요', '아쉬워요', '괜찮아요', '좋아요', '최고예요'];

const PERIODS: { value: TimePeriodApi; label: string; Icon: typeof IconSun }[] = [
  { value: 'SUNRISE', label: '일출', Icon: IconSunrise },
  { value: 'DAYTIME', label: '낮', Icon: IconSun },
  { value: 'SUNSET', label: '일몰', Icon: IconSunset },
  { value: 'NIGHT', label: '야간', Icon: IconMoon },
];

// 목업 설계 그대로 "마이페이지에서 내 장비 등록 → 리뷰에서 선택"이다(GET /users/me/equipments).
// 서버 EquipmentType은 CAMERA·LENS 둘뿐이라 목업의 "렌즈 · 풍경/야경" 같은 세부 용도는 줄 수 없다.

/**
 * 피커는 고를 때마다 UUID로 새 캐시 경로를 만들어 파일을 쓴다(expo-modules-core의
 * generatePath — `UUID().uuidString`). 그래서 같은 사진을 다시 골라도 uri가 매번 달라진다.
 * 중복 판정은 사진첩 원본을 가리키는 assetId로 해야 하고, 없을 때만 uri로 폴백한다.
 */
type PickedPhoto = ReviewPhotoUpload & {
  assetId?: string | null;
  fingerprint: string;
  /** 요청 전체 용량 합산용. 피커가 안 주는 경우가 있어 0으로 떨어질 수 있다. */
  bytes: number;
};
/**
 * assetId는 iOS에선 오지만 Android 최신 photo picker 경로에선 항상 null이다.
 * uri는 위의 UUID 임시 경로 때문에 매번 달라져 폴백으로 쓸 수 없으므로,
 * 원본 메타데이터(파일명·크기·해상도) 조합을 보조 식별자로 쓴다.
 */
const identityOf = (p: PickedPhoto) => p.assetId ?? p.fingerprint;

const MIME_BY_EXT: Record<string, string> = {
  jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', heic: 'image/heic', heif: 'image/heif',
};

/**
 * 확장자는 asset.fileName(사진첩 원본 이름)이 아니라 실제로 전송하는 파일인 asset.uri에서 뽑는다.
 * preferredAssetRepresentationMode: Compatible이 HEIC를 JPEG로 전사하고 그 결과가 uri에
 * 반영되므로, 원본이 HEIC여도 uri는 .jpg가 된다.
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
 * 서버는 장비를 ", "로 합쳐 보관한다. 되살릴 때 내 장비 목록으로 걸러내지 않는다 —
 * PUT이 equipmentInfo를 무조건 덮어쓰므로 목록에 없는 값을 버리면 저장하는 순간 조용히
 * 삭제된다(장비를 지우거나 이름을 바꾼 뒤 옛 리뷰를 수정하는 경우). 그런 값도 선택된 칩으로
 * 띄워, 사용자가 직접 해제할 때만 사라지게 한다.
 */
const seedEquipmentOf = (joined: string | null) =>
  joined ? joined.split(',').map((s) => s.trim()).filter(Boolean) : [];

/** 서버 저장 형식과 같은 방식으로 합친 길이. 100자 상한 판정에 쓴다. */
const joinedLengthOf = (names: string[]) => names.join(', ').length;

export default function ReviewWriteScreen({ route, navigation }: Props) {
  const { spotId, edit } = route.params;
  const isEdit = edit !== undefined;
  const insets = useSafeAreaInsets();
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
  const [technicalExifEnabled, setTechnicalExifEnabled] = React.useState(false);
  const [locationExifEnabled, setLocationExifEnabled] = React.useState(false);
  // 수정 모드의 사진은 저장 버튼과 무관하게 즉시 서버에 반영되므로(전용 엔드포인트) 로컬 파일이
  // 아니라 서버가 준 목록을 그대로 들고 있는다. 작성 모드에서는 항상 빈 배열.
  const [serverPhotos, setServerPhotos] = React.useState<ReviewPhotoDTO[]>(edit?.photos ?? []);
  const [tags, setTags] = React.useState<ReviewTagApi[]>(edit?.tags ?? []);
  // 저장돼 있던 값은 처음 한 번만 읽어 고정한다. 아래 목록을 equipment에서 파생하면 해제하는
  // 순간 행이 사라져 다시 고를 수 없다 — 오탭 한 번이 복구 불가능한 삭제가 된다.
  const seeded = React.useRef(seedEquipmentOf(edit?.equipmentInfo ?? null)).current;
  const [equipment, setEquipment] = React.useState<string[]>(seeded);
  const { data: myEquipments = [], isLoading: equipmentLoading, isError: equipmentError } = useMyEquipments();
  // 내 장비 + 이 리뷰에 저장돼 있지만 지금 목록엔 없는 값. 후자를 빼면 저장 시 유실된다.
  const equipmentOptions = React.useMemo(() => {
    // 유니크 제약이 (user, type, name)이라 타입만 다른 동명 장비가 둘 올 수 있다. 선택은
    // 이름 문자열로만 표현되므로 행이 둘이면 한 번 탭에 둘 다 켜진 것처럼 보인다.
    const byName = new Map(myEquipments.map((e) => [e.equipmentName, e]));
    const mine = [...byName.values()].map((e) => ({
      name: e.equipmentName,
      type: e.equipmentType === 'CAMERA' ? '카메라' : '렌즈',
      isCamera: e.equipmentType === 'CAMERA',
    }));
    const orphans = [...new Set(seeded)]
      .filter((name) => !byName.has(name))
      .map((name) => ({ name, type: '내 장비에 없는 항목', isCamera: false }));
    return [...mine, ...orphans];
  }, [myEquipments, seeded]);

  // 마지막 사진을 지우면 동의 대상도 사라진다. 이후 추가하는 사진에 이전 동의가 묵시적으로
  // 재사용되지 않도록 두 상태를 개인정보 보호 기본값으로 되돌린다.
  React.useEffect(() => {
    if (!isEdit && photos.length === 0) {
      setTechnicalExifEnabled(false);
      setLocationExifEnabled(false);
    }
  }, [isEdit, photos.length]);

  const trimmed = content.trim();
  const canSubmit = rating > 0 && period !== null && trimmed.length >= CONTENT_MIN;

  // 리뷰 입력창은 별점·날짜·시간대 아래라 키보드가 뜨면 가려진다. 포커스 시 그 위치로 스크롤한다.
  // 150ms는 리사이즈를 기다리는 어림값이다 — iOS 키보드 애니메이션은 보통 250ms라 스크롤이
  // 그 도중에 시작된다. 이 섹션 아래로 콘텐츠가 넉넉해(태그·사진·장비) 목표 y가 축소된 최대
  // 스크롤 범위 안에 있으므로 결과는 같지만, 정확히 하려면 Keyboard.addListener로 바꿔야 한다.
  // ponytail: 실기기에서 어긋나는 게 확인되기 전까지는 타이머로 둔다.
  // 언마운트 후 실행돼도 scrollTo는 no-op이고 setState가 없어 정리(clearTimeout)는 생략한다.
  const scrollRef = React.useRef<ScrollView>(null);
  const contentSectionY = React.useRef(0);
  const focusContent = () => {
    setContentFocused(true);
    setTimeout(() => scrollRef.current?.scrollTo({ y: Math.max(contentSectionY.current - normalize(12), 0), animated: true }), 150);
  };

  // 등록·수정 성공으로 나가는 건 유실이 아니므로 확인창을 건너뛴다.
  // usePreventRemove는 렌더 시점의 boolean을 읽으므로 ref로는 잠금을 풀 수 없다. 상태로 두고,
  // 실제 이탈은 다음 렌더의 effect에서 처리해야 같은 틱에 확인창이 뜨는 일이 없다.
  const [leaving, setLeaving] = React.useState(false);
  // 수정 모드는 폼이 채워진 상태로 시작하므로 "값이 있는지"가 아니라 "처음과 달라졌는지"로 판단한다.
  const initial = React.useRef({
    rating: edit?.rating ?? 0,
    period: edit?.timePeriod ?? null,
    content: (edit?.content ?? '').trim(),
    visitedAt: toISODate(edit?.visitedAt ? fromISODate(edit.visitedAt) : today),
    equipment: seeded.join('|'),
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
    photos.length > 0 ||
    (!isEdit && (technicalExifEnabled || locationExifEnabled));

  React.useEffect(() => {
    if (leaving) navigation.goBack();
  }, [leaving, navigation]);

  // 작성 분량이 큰 화면이라 뒤로가기·스와이프·안드로이드 백키로 날리는 사고를 막는다.
  // native-stack에서는 beforeRemove의 preventDefault()가 스와이프 백 제스처를 잡지 못해
  // usePreventRemove를 쓴다(react-navigation 권장 경로).
  usePreventRemove(isDirty && !leaving, ({ data }) => {
    const lost = photosTouched.current
      ? '사진 변경은 이미 저장됐어요. 나머지 입력한 내용은 저장되지 않아요.'
      : '입력한 내용은 저장되지 않아요.';
    Alert.alert('작성을 그만둘까요?', lost, [
      { text: '계속 작성', style: 'cancel' },
      { text: '나가기', style: 'destructive', onPress: () => navigation.dispatch(data.action) },
    ]);
  });

  const toggleTag = (tag: ReviewTagApi) =>
    setTags((prev) => {
      if (prev.includes(tag)) return prev.filter((t) => t !== tag);
      // 서버 @Size(max = 5). 넘기면 400이라 프론트에서 막는다.
      return prev.length >= MAX_REVIEW_TAGS ? prev : [...prev, tag];
    });

  // 개수·길이 상한 둘 다 서버에서 400이라 프론트에서 막는다. 장비명은 개당 100자까지 등록되므로
  // 두 개만 골라도 길이 쪽에 먼저 닿을 수 있다. 해제는 항상 허용해야 상한에서 갇히지 않는다.
  const equipmentBlocked = (name: string) =>
    !equipment.includes(name) &&
    (equipment.length >= MAX_EQUIPMENT || joinedLengthOf([...equipment, name]) > MAX_EQUIPMENT_CHARS);

  const toggleEquipment = (name: string) => {
    if (equipmentBlocked(name)) return;
    setEquipment((prev) => (prev.includes(name) ? prev.filter((e) => e !== name) : [...prev, name]));
  };

  // 원본 EXIF는 서버가 작성 요청의 두 동의 상태에 따라 선택적으로 추출한다. 피커에서 원본 바이트를
  // 유지해야 동의한 필드가 실제로 남아 있는 사진에서만 서버가 값을 읽을 수 있다.
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
      // quality를 1로 두는 건 화질이 아니라 **EXIF 때문**이다. 1 미만이면 expo-image-picker가
      // UIImage 비트맵에서 JPEG를 다시 인코딩하는데(ImageUtils.swift:153 `image.jpegData(...)`),
      // UIImage는 메타데이터를 들고 있지 않아 결과 파일에 EXIF가 한 줄도 남지 않는다.
      // 1 이상이면 원본 바이트가 그대로 통과한다(같은 파일 151행 `if options.quality >= 1.0`).
      // 사진 정보(라이트박스 EXIF 시트)가 이 바이트에 의존하므로 낮추면 그 기능이 죽는다.
      // 용량은 서버 한도와 맞춰져 있다 — application.yaml의 max-file-size 20MB(= MAX_PHOTO_BYTES),
      // max-request-size 100MB(= 20MB × MAX_PHOTOS).
      quality: 1,
      // iOS 기본값은 .current(전사 회피)라서 HEIC 자산이 원본 바이트째로 넘어온다
      // (ImageUtils.swift의 `case UTType.heic: return (rawData, ".heic")` 분기).
      // 서버에 변환 로직이 없어 그대로 두면 .heic가 S3에 올라가 일부 기기에서 표시가 깨진다.
      // Compatible로 두면 시스템이 JPEG로 전사해 넘겨준다. iOS 전용 옵션.
      // quality 1과 조합하면 이 전사 결과가 곧 업로드 바이트이므로, 전사가 EXIF를 보존하는지에
      // EXIF 기능이 걸려 있다. 날아가는 게 확인되면 .current + 서버 HEIC 변환으로 가야 한다.
      preferredAssetRepresentationMode: ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Compatible,
    });
    if (result.canceled) return;

    // quality 1이라 양 플랫폼 모두 재인코딩 없이 원본 바이트를 그대로 올린다
    // (iOS는 rawData 통과, Android는 RawImageExporter의 copyFile). 따라서 fileSize가 곧 전송
    // 크기이고, 플랫폼 구분 없이 서버 한도를 그대로 적용할 수 있다.
    // 압축을 다시 켜면(quality < 1) Android의 fileSize는 압축 전 크기가 되어 오탐이 나므로,
    // 그때는 여유 배수를 되살려야 한다.
    // 서버도 초과를 400 + 한국어 message로 알려주지만, 20MB를 다 올려보낸 뒤 거부당하는 낭비는
    // 그대로여서 클라에서 미리 걸러낸다.
    const sizeLimit = MAX_PHOTO_BYTES;

    const picked: PickedPhoto[] = [];
    let tooLarge = 0;
    let unsupported = 0;
    let overBudget = 0;
    // 수정 모드는 새로 고른 것만 별도 요청으로 올라가므로 기존 사진을 합산하지 않는다.
    let totalBytes = isEdit ? 0 : photos.reduce((sum, p) => sum + p.bytes, 0);
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
      const bytes = asset.fileSize ?? 0;
      if (totalBytes + bytes > MAX_TOTAL_BYTES) {
        overBudget += 1;
        return;
      }
      totalBytes += bytes;
      picked.push({
        bytes,
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
    if (overBudget > 0) skipped.push(`${overBudget}장은 전체 용량 한도를 넘어 담지 못했어요`);
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
      if (!isExpired(err)) Alert.alert('사진을 삭제하지 못했어요', errorTextOf(err));
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
      if (!isExpired(err)) Alert.alert('사진을 추가하지 못했어요', errorTextOf(err));
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
      // tags와 같은 이유로 빈 배열도 보낸다. 수정은 전체 교체라 []가 곧 "장비 전부 해제"다.
      equipmentInfo: equipment,
    };
    const handlers = {
      onSuccess: () => setLeaving(true),
      onSettled: () => {
        submitLock.current = false;
      },
      onError: (err: unknown) => {
        // 스팟당 1리뷰(409). 정상 경로는 myReviewId로 버튼 단계에서 갈라지지만(ReviewTab),
        // 작성 화면을 열어둔 사이 다른 기기에서 리뷰가 생기는 경우가 남는다. 서버도 동시 요청을
        // 완전히 막지 않아 마지막 방어선으로 둔다. 안내 후 목록으로 돌려보낸다.
        if (err instanceof ApiError && err.status === 409) {
          // 유실이 아니라 중복이므로 이탈 확인창을 건너뛴다.
          Alert.alert('이미 리뷰를 작성했어요', errorTextOf(err), [
            { text: '확인', onPress: () => setLeaving(true) },
          ]);
          return;
        }
        if (!isExpired(err)) Alert.alert(isEdit ? '수정 실패' : '등록 실패', errorTextOf(err));
      },
    };

    if (isEdit) {
      // PUT은 JSON이라 사진을 다루지 않는다. 사진은 전용 엔드포인트로 이미 반영돼 있어 여기서 보낼 것이 없다.
      updateReview.mutate({ reviewId: edit.reviewId, body }, handlers);
      return;
    }
    createReview.mutate({
      body: {
        ...body,
        technicalExifConsent: technicalExifEnabled ? 'GRANTED' : 'DECLINED',
        locationExifConsent: locationExifEnabled ? 'GRANTED' : 'DECLINED',
      },
      photos: photos.map(({ uri, name, type }) => ({ uri, name, type })),
    }, handlers);
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
        className="flex-row items-center border-b-[0.5px] border-hairline"
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

      {/* 안드로이드도 behavior가 필요하다 — 엣지투엣지(app.config.js)라 adjustResize가 창을
          줄여 주지 않는다. 근거는 BottomSheet.tsx 주석 참고. */}
      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={{ paddingBottom: normalize(36) }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* 스팟 정보 */}
          <View
            className="flex-row items-center border-b-[0.5px] border-hairline"
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
                style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_XS, color: TEXT_SUB }}
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
                  <Text className="font-normal"
                    allowFontScaling={false}
                    style={{ fontSize: normalizeFontSize(36), lineHeight: normalizeFontSize(36), color: value <= rating ? STAR_ON : 'rgba(0,0,0,0.1)' }}
                  >
                    ★
                  </Text>
                </Pressable>
              ))}
              <Text
                allowFontScaling={false}
                style={{ fontFamily: 'Pretendard-Medium', fontSize: normalizeFontSize(14), color: TEXT_SUB, letterSpacing: -0.15, marginLeft: normalize(8) }}
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
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    className="flex-1 items-center justify-center"
                    style={{
                      height: normalize(48),
                      borderRadius: INPUT_RADIUS,
                      borderWidth: BORDER_CONTROL,
                      borderColor: active ? BRAND : 'transparent',
                      backgroundColor: active ? BRAND_TINT_ACTIVE : SURFACE,
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

          {/* 리뷰 본문 — Section은 onLayout을 받지 않으므로 y를 재려고 한 겹 감싼다. */}
          <View onLayout={(e) => { contentSectionY.current = e.nativeEvent.layout.y; }}>
            <Section label="리뷰" required>
              <TextInput
                value={content}
                onChangeText={setContent}
                onFocus={focusContent}
                onBlur={() => setContentFocused(false)}
                multiline
                textAlignVertical="top"
                maxLength={CONTENT_MAX}
                placeholder={`촬영 팁, 혼잡도, 주차 정보 등 다른 사진가에게 도움이 될 내용을 자유롭게 작성해 주세요. (최소 ${CONTENT_MIN}자)`}
                placeholderTextColor="rgba(0,0,0,0.28)"
                style={{
                  height: normalize(130),
                  borderRadius: INPUT_RADIUS,
                  borderWidth: BORDER_CONTROL,
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
          </View>

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
                      backgroundColor: selected ? BRAND_TINT_ACTIVE : SURFACE,
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
                    backgroundColor: SURFACE, borderWidth: BORDER_CONTROL, borderColor: 'rgba(0,0,0,0.12)',
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
          </Section>

          {!isEdit && photos.length > 0 && (
            <ExifConsentSection
              technicalEnabled={technicalExifEnabled}
              locationEnabled={locationExifEnabled}
              onTechnicalChange={setTechnicalExifEnabled}
              onLocationChange={setLocationExifEnabled}
              style={{ paddingHorizontal: GRID_PADDING, paddingTop: normalize(24) }}
            />
          )}

          {/* 사용 장비 */}
          <Section label="사용 장비" hint="선택">
            <View style={{ borderRadius: CARD_RADIUS, backgroundColor: SURFACE, overflow: 'hidden' }}>
              {equipmentLoading && (
                <View style={{ paddingVertical: normalize(28) }}>
                  <ActivityIndicator color={BRAND} />
                </View>
              )}

              {!equipmentLoading && equipmentError && (
                <Text
                  allowFontScaling={false}
                  className="text-center"
                  style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_SM, color: 'rgba(0,0,0,0.35)', paddingVertical: normalize(24) }}
                >
                  장비를 불러오지 못했어요
                </Text>
              )}

              {/* 여기서 마이페이지로 보내면 작성 중인 내용 이탈 확인창이 먼저 뜬다. 안내만 한다. */}
              {!equipmentLoading && !equipmentError && equipmentOptions.length === 0 && (
                <Text
                  allowFontScaling={false}
                  className="text-center"
                  style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_SM, color: 'rgba(0,0,0,0.3)', paddingVertical: normalize(24) }}
                >
                  등록한 장비가 없어요 · 마이페이지에서 추가할 수 있어요
                </Text>
              )}

              {/* 로딩 중에는 myEquipments가 비어 저장된 선택이 전부 "내 장비에 없는 항목"으로
                  찍힌다. 토큰 회전으로 쿼리 키가 바뀌면 편집 중에도 이 상태가 온다. */}
              {!equipmentLoading && equipmentOptions.map(({ name, type, isCamera }, idx) => {
                const selected = equipment.includes(name);
                const blocked = equipmentBlocked(name);
                const Icon = isCamera ? Camera : CircleDot;
                return (
                  <Pressable
                    key={name}
                    onPress={() => toggleEquipment(name)}
                    disabled={blocked}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: selected, disabled: blocked }}
                    className="flex-row items-center"
                    style={{
                      gap: normalize(12),
                      paddingHorizontal: normalize(16),
                      paddingVertical: normalize(14),
                      borderBottomWidth: idx < equipmentOptions.length - 1 ? HAIRLINE_WIDTH : 0,
                      borderBottomColor: HAIRLINE,
                      opacity: blocked ? 0.4 : 1,
                    }}
                  >
                    <View
                      className="items-center justify-center"
                      style={{
                        width: normalize(22), height: normalize(22), borderRadius: normalize(11),
                        borderWidth: BORDER_CONTROL,
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
            {!equipmentLoading && equipmentOptions.some((o) => equipmentBlocked(o.name)) && (
              <Text
                allowFontScaling={false}
                style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_XS, color: 'rgba(0,0,0,0.28)', letterSpacing: -0.1, marginTop: normalize(8) }}
              >
                장비는 최대 {MAX_EQUIPMENT}개 · 이름 합계 {MAX_EQUIPMENT_CHARS}자까지 선택할 수 있어요
              </Text>
            )}
          </Section>

        </ScrollView>

        {/* 등록 — 스크롤 밖 고정.
            SafeAreaView의 edges에 bottom을 넣는 대신 인셋을 직접 더한다. edges 방식은 아래 14pt와
            겹쳐 아이폰에서 48pt가 된다. Math.max면 안드로이드 내비바·아이폰 홈 인디케이터를 덮으면서
            인셋이 0인 기기에서는 기존 여백 그대로다.
            ponytail: 키보드가 열린 동안에는 이 인셋만큼 빈 공간이 남는다(iOS padding KAV·안드로이드
            adjustResize 공통). 버튼을 가리지 않는 여백이라 키보드 리스너는 두지 않는다. 거슬리면
            Keyboard 이벤트로 열림 여부를 받아 열렸을 때만 normalize(14)로 되돌리면 된다. */}
        <View style={{ paddingHorizontal: GRID_PADDING, paddingTop: normalize(10), paddingBottom: Math.max(insets.bottom, normalize(14)) }}>
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
          <Text className="font-normal" allowFontScaling={false} style={{ fontSize: normalizeFontSize(14), color: BRAND, lineHeight: normalizeFontSize(14) }}>
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
