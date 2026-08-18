import React from 'react';
import { Animated, BackHandler, Dimensions, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { Aperture, Camera, MapPin, X } from 'lucide-react-native';
import BottomSheet from '@/components/common/BottomSheet';
import { PhotoExifData } from '@/types/photo';
import { hasAnyExif } from '@/utils/spotMappers';
import { BOTTOM_SHEET_RADIUS, FONT_2XS, FONT_LG, FONT_SM, FONT_XS, GRID_PADDING } from '@/constants/layout';
import { normalize, normalizeFontSize } from '@/utils/normalize';

const SURFACE = '#f5f5f7';
const ACCENT = '#E31B59';
const KAKAO_KEY = process.env.EXPO_PUBLIC_KAKAO_MAP_API_KEY;
const MAP_PREVIEW_HEIGHT = 120;
/** 미리보기 지도의 핀 너비(px). 높이는 SVG viewBox 24:30 비율로 따라간다.
 *  120px 지도에 PhotoMapScreen의 24px 핀은 커 보여서 한 단계 줄였다. */
const MAP_PIN_WIDTH = 20;

interface Props {
  visible: boolean;
  onClose: () => void;
  exif: PhotoExifData;
}

function GearRow({ icon, label, value }: { icon: React.ReactNode; label: string; value?: string }) {
  if (!value) return null;
  return (
    <View
      className="flex-row items-center"
      style={{ gap: normalize(12), backgroundColor: SURFACE, borderRadius: normalize(14), paddingVertical: normalize(12), paddingHorizontal: normalize(14) }}
    >
      <View
        className="items-center justify-center"
        style={{ width: normalize(36), height: normalize(36), borderRadius: normalize(10), backgroundColor: 'rgba(227,27,89,0.08)' }}
      >
        {icon}
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_2XS, color: 'rgba(0,0,0,0.4)', letterSpacing: 0.4 }}>
          {label}
        </Text>
        <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: normalizeFontSize(14), color: '#000', letterSpacing: -0.2, marginTop: normalize(2) }}>
          {value}
        </Text>
      </View>
    </View>
  );
}

function StatCell({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <View style={{ flex: 1, backgroundColor: SURFACE, borderRadius: normalize(14), paddingVertical: normalize(12), paddingHorizontal: normalize(8), alignItems: 'center' }}>
      <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_2XS, color: 'rgba(0,0,0,0.4)', letterSpacing: 0.4 }}>
        {label}
      </Text>
      <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_LG, color: '#000', letterSpacing: -0.3, marginTop: normalize(2) }}>
        {value}
        {unit && (
          <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_XS, color: 'rgba(0,0,0,0.4)', letterSpacing: -0.1 }}>
            {unit}
          </Text>
        )}
      </Text>
    </View>
  );
}

const MAP_BOX_STYLE = {
  height: normalize(MAP_PREVIEW_HEIGHT),
  borderRadius: normalize(12),
  backgroundColor: SURFACE,
  marginTop: normalize(12),
} as const;

/** 지도를 못 그릴 때(키 없음·SDK 로드 실패) 자리를 지키는 아이콘 박스. */
function MapPlaceholder() {
  return (
    <View className="items-center justify-center" style={MAP_BOX_STYLE}>
      <MapPin size={normalize(28)} color="rgba(0,0,0,0.25)" strokeWidth={1.6} />
    </View>
  );
}

/**
 * 촬영 위치 미리보기. **조작 없는 정지 지도**다 — 필요한 건 "대충 어디쯤"이지 탐색이 아니다.
 * 탐색이 필요해지면 좌표를 넘겨 지도 화면으로 보내는 편이 맞다.
 *
 * 조작 차단은 두 겹이다. SDK의 `setDraggable/setZoomable`은 지도 내부 동작만 끄고, 그 아래
 * Android WebView가 터치를 삼켜 부모 ScrollView의 스크롤을 막는 건 별개 문제라
 * `pointerEvents="none"`으로 터치 자체를 통과시킨다.
 *
 * 지도를 못 그리는 경우(키 없음·오프라인·SDK 401)는 빈 회색 박스로 두지 않고
 * 아이콘 플레이스홀더로 떨어뜨린다 — 이 시트는 지도가 없어도 나머지 정보로 제 역할을 한다.
 */
function LocationPreview({ lat, lng }: { lat: number; lng: number }) {
  const [failed, setFailed] = React.useState(false);
  React.useEffect(() => setFailed(false), [lat, lng]);

  const source = React.useMemo(
    () => ({
      // Number()로 한 번 걸러 넣는다. 타입상 number지만 서버 DTO를 런타임 검증 없이 믿는
      // 구조라, 문자열이 새어 들어와도 NaN이 될 뿐 스크립트로 해석되지 않게 한다.
      html: `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0">
  <!-- baseUrl을 https로 주면 카카오 SDK가 내부 라이브러리를 https로 받는다(iOS ATS 통과).
       단 Referer가 붙으면 미등록 도메인이라 401이 되므로 no-referrer로 억제한다. -->
  <meta name="referrer" content="no-referrer">
  <script type="text/javascript" src="https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_KEY}&autoload=false"></script>
  <style>body, html { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; background: ${SURFACE}; }
    #map { width: 100%; height: 100%; }</style>
</head>
<body>
  <div id="map"></div>
  <script>
    // 오프라인이면 script 태그가 안 붙어 kakao가 undefined다. 그대로 두면 ReferenceError로
    // 스크립트가 죽어 빈 회색 박스만 남으므로, RN에 알려 플레이스홀더로 되돌린다.
    if (window.kakao && window.kakao.maps) {
      kakao.maps.load(function () {
        var center = new kakao.maps.LatLng(${Number(lat)}, ${Number(lng)});
        var map = new kakao.maps.Map(document.getElementById('map'), { center: center, level: 4 });
        map.setDraggable(false);
        map.setZoomable(false);
        // 기본 Marker는 크기가 고정이라 CustomOverlay로 그린다(PhotoMapScreen과 같은 핀 모양).
        // yAnchor: 1 — 핀 끝(뾰족한 아래쪽)이 실제 좌표에 닿아야 한다.
        var pin = document.createElement('div');
        pin.innerHTML =
          '<svg width="${MAP_PIN_WIDTH}" height="${Math.round((MAP_PIN_WIDTH * 30) / 24)}" viewBox="0 0 24 30" fill="none">' +
          '<path d="M12 0C5.4 0 0 5.4 0 12C0 20 12 30 12 30S24 20 24 12C24 5.4 18.6 0 12 0Z" fill="${ACCENT}"/>' +
          '<circle cx="12" cy="10.5" r="4.5" fill="#fff"/></svg>';
        new kakao.maps.CustomOverlay({ position: center, content: pin, yAnchor: 1, map: map });
      });
    } else if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage('MAP_FAILED');
    }
  </script>
</body>
</html>`,
      baseUrl: 'https://localhost',
    }),
    [lat, lng],
  );

  if (!KAKAO_KEY || failed) return <MapPlaceholder />;

  return (
    <View pointerEvents="none" style={{ ...MAP_BOX_STYLE, overflow: 'hidden' }}>
      <WebView
        source={source}
        originWhitelist={['*']}
        javaScriptEnabled
        scrollEnabled={false}
        bounces={false}
        overScrollMode="never"
        // Android WebView가 overflow:hidden + borderRadius 클리핑을 무시하고 사각으로 그리는 걸 막는다.
        androidLayerType="hardware"
        onError={() => setFailed(true)}
        onHttpError={() => setFailed(true)}
        onMessage={(e) => e.nativeEvent.data === 'MAP_FAILED' && setFailed(true)}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        style={{ flex: 1, backgroundColor: SURFACE }}
      />
    </View>
  );
}

function SectionLabel({ label }: { label: string }) {
  return (
    <Text
      allowFontScaling={false}
      style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_XS, color: 'rgba(0,0,0,0.4)', letterSpacing: 0.4, paddingTop: normalize(20), paddingBottom: normalize(8) }}
    >
      {label}
    </Text>
  );
}

function DetailRow({ label, value, isLast, valueAlignRight }: { label: string; value: string; isLast?: boolean; valueAlignRight?: boolean }) {
  return (
    <View
      className="flex-row items-center justify-between"
      style={{ height: normalize(44), borderBottomWidth: isLast ? 0 : 0.5, borderBottomColor: 'rgba(0,0,0,0.08)' }}
    >
      <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_XS, color: 'rgba(0,0,0,0.45)', letterSpacing: -0.1 }}>
        {label}
      </Text>
      <Text
        allowFontScaling={false}
        numberOfLines={1}
        style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_SM, color: '#000', letterSpacing: -0.2, maxWidth: valueAlignRight ? '60%' : undefined, textAlign: valueAlignRight ? 'right' : 'left' }}
      >
        {value}
      </Text>
    </View>
  );
}

/** 값이 있는 행만 남기고, 마지막 남은 행에만 isLast를 다시 매겨준다 (구분선이 중간에서 끊기지 않게). */
function withIsLast<T extends { value?: string }>(rows: (T & { isLast?: boolean })[]): (T & { isLast?: boolean })[] {
  const present = rows.filter((row) => !!row.value);
  return present.map((row, index) => ({ ...row, isLast: index === present.length - 1 }));
}

/**
 * 라이트박스(별도 Modal) 위에 겹쳐 열리는 레이어로 쓰일 수 있어 컨텐츠만 따로 export한다 —
 * RN에서 Modal 두 개를 동시에 띄우면 두 번째가 안 뜨는 경우가 있어(iOS 네이티브 모달 프레젠테이션
 * 제약), 그런 화면에서는 부모 Modal 안에 이 컨텐츠만 직접 넣는다(`PhotoLightbox` 참고).
 */
export function PhotoExifSheetContent({
  onClose,
  exif,
  showMap = true,
}: Omit<Props, 'visible'> & {
  /**
   * 지도 미리보기 마운트 여부. `PhotoExifLayer`처럼 시트를 상시 마운트해두는 호출부는
   * 시트를 실제로 연 뒤에만 true로 넘긴다 — 안 그러면 사용자가 열지도 않은 시트 때문에
   * 카카오 SDK·타일 요청이 나가고, 촬영 좌표가 조회된다.
   */
  showMap?: boolean;
}) {
  const statCells = [
    { label: 'ISO', value: exif.iso != null ? String(exif.iso) : undefined },
    { label: '조리개', value: exif.aperture },
    { label: '셔터', value: exif.shutter, unit: undefined as string | undefined },
    { label: '초점', value: exif.focalLength, unit: 'mm' },
  ].filter((cell): cell is { label: string; value: string; unit?: string } => !!cell.value);

  const detailRows = withIsLast([
    { label: '노출 모드', value: exif.exposureMode },
    { label: '측광 모드', value: exif.metering },
    { label: '화이트밸런스', value: exif.whiteBalance },
    { label: '플래시', value: exif.flash },
    { label: '35mm 환산', value: exif.focalLength35mm },
    { label: '소프트웨어', value: exif.software, valueAlignRight: true },
  ]);

  const fileRows = withIsLast([
    { label: '파일명', value: exif.filename },
    { label: '크기', value: exif.fileSize },
    { label: '형식', value: exif.format },
    { label: '수정일', value: exif.modifiedAtLabel },
  ]);

  const hasLocation = exif.gpsLat != null && exif.gpsLng != null;
  const hasGear = !!exif.camera || !!exif.lens;

  return (
    <View style={{ paddingHorizontal: GRID_PADDING + normalize(8), paddingBottom: normalize(4) }}>
      <View className="flex-row items-center justify-between">
        <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_LG, color: '#000', letterSpacing: -0.4 }}>
          사진 정보
        </Text>
        <Pressable
          onPress={onClose}
          className="items-center justify-center"
          style={{ width: normalize(30), height: normalize(30), borderRadius: normalize(15), backgroundColor: SURFACE }}
          accessibilityLabel="닫기"
        >
          <X size={normalize(13)} color="rgba(0,0,0,0.5)" strokeWidth={2} />
        </Pressable>
      </View>

      {hasGear && (
        <View style={{ gap: normalize(8), marginTop: normalize(16) }}>
          <GearRow icon={<Camera size={normalize(18)} color={ACCENT} strokeWidth={1.8} />} label="카메라" value={exif.camera} />
          <GearRow icon={<Aperture size={normalize(18)} color={ACCENT} strokeWidth={1.8} />} label="렌즈" value={exif.lens} />
        </View>
      )}

      {statCells.length > 0 && (
        <View className="flex-row" style={{ gap: normalize(6), marginTop: normalize(8) }}>
          {statCells.map((cell) => (
            <StatCell key={cell.label} label={cell.label} value={cell.value} unit={cell.unit} />
          ))}
        </View>
      )}

      {detailRows.length > 0 && (
        <>
          <SectionLabel label="촬영 상세" />
          <View style={{ backgroundColor: SURFACE, borderRadius: normalize(14), paddingHorizontal: normalize(16) }}>
            {detailRows.map((row) => (
              <DetailRow key={row.label} label={row.label} value={row.value as string} isLast={row.isLast} valueAlignRight={row.valueAlignRight} />
            ))}
          </View>
        </>
      )}

      {hasLocation && (
        <>
          <SectionLabel label="위치" />
          <View style={{ backgroundColor: SURFACE, borderRadius: normalize(14), paddingHorizontal: normalize(16) }}>
            {/* EXIF의 GPS는 도/분/초를 나눈 값이라 그대로 문자열화하면 37.512319444444444처럼
                소수점 15자리가 나온다. 목업과 같은 6자리로 자른다(≈0.1m 해상도로 충분). */}
            <DetailRow label="위도" value={exif.gpsLat!.toFixed(6)} />
            <DetailRow label="경도" value={exif.gpsLng!.toFixed(6)} isLast />
          </View>
          {showMap ? <LocationPreview lat={exif.gpsLat!} lng={exif.gpsLng!} /> : <MapPlaceholder />}
        </>
      )}

      {fileRows.length > 0 && (
        <>
          <SectionLabel label="파일" />
          <View style={{ backgroundColor: SURFACE, borderRadius: normalize(14), paddingHorizontal: normalize(16), marginBottom: normalize(8) }}>
            {fileRows.map((row) => (
              <DetailRow key={row.label} label={row.label} value={row.value as string} isLast={row.isLast} />
            ))}
          </View>
        </>
      )}
    </View>
  );
}

export default function PhotoExifSheet({ visible, onClose, exif }: Props) {
  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <PhotoExifSheetContent onClose={onClose} exif={exif} />
    </BottomSheet>
  );
}

const SCREEN_HEIGHT = Dimensions.get('window').height;

/**
 * 라이트박스 Modal **안에** 겹쳐 올리는 EXIF 시트. 별도 Modal이 아닌 이유는
 * `PhotoExifSheetContent` 주석 참고(RN에서 Modal 2개 동시 표시 제약).
 *
 * 부모의 최상위 View 안에 그대로 두면 된다 — 딤과 시트를 absolute 형제로 깐다.
 * exif 자체가 비거나(EXIF 제거된 사진) 로딩·에러면 안내 문구로 대체한다.
 */
export function PhotoExifLayer({
  open,
  onClose,
  exif,
  loading,
  error,
}: {
  open: boolean;
  onClose: () => void;
  exif: PhotoExifData | undefined;
  loading?: boolean;
  error?: boolean;
}) {
  const insets = useSafeAreaInsets();
  const translateY = React.useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  // 시트는 항상 마운트된 채 화면 밖으로 밀려 있을 뿐이라, 지도까지 그대로 두면 사용자가
  // 열지도 않은 시트가 네트워크를 쓴다. 한 번 연 뒤에만 마운트한다 — `open`으로 직접 걸면
  // 닫기 애니메이션 도중 지도가 사라져 시트가 무너져 보인다.
  const [everOpened, setEverOpened] = React.useState(false);
  React.useEffect(() => {
    if (open) setEverOpened(true);
  }, [open]);

  React.useEffect(() => {
    Animated.timing(translateY, {
      toValue: open ? 0 : SCREEN_HEIGHT,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [open, translateY]);

  // 시트는 Modal이 아니라 레이어라 onRequestClose를 못 가진다. 그대로 두면 Android 백 버튼이
  // 부모 Modal의 onRequestClose로 흘러가 라이트박스까지 통째로 닫힌다 — 시트만 닫아야 한다.
  React.useEffect(() => {
    if (!open) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      onClose();
      return true;
    });
    return () => sub.remove();
  }, [open, onClose]);

  return (
    <>
      {open && (
        <Pressable
          onPress={onClose}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 5 }}
        />
      )}
      <Animated.View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          maxHeight: '80%',
          backgroundColor: '#fff',
          borderTopLeftRadius: BOTTOM_SHEET_RADIUS,
          borderTopRightRadius: BOTTOM_SHEET_RADIUS,
          paddingBottom: insets.bottom + normalize(8),
          transform: [{ translateY }],
          zIndex: 6,
        }}
      >
        <View style={{ alignItems: 'center', paddingTop: normalize(10), paddingBottom: normalize(8) }}>
          <View style={{ width: normalize(36), height: normalize(4), borderRadius: normalize(2), backgroundColor: 'rgba(0,0,0,0.12)' }} />
        </View>
        <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
          {/* EXIF는 카톡·인스타를 거친 사진에서 제거되는 일이 흔해 '없음'이 정상 케이스다. */}
          {loading || error || !hasAnyExif(exif) ? (
            <View style={{ paddingHorizontal: normalize(28), paddingVertical: normalize(32), alignItems: 'center' }}>
              <Text
                allowFontScaling={false}
                style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_SM, color: 'rgba(0,0,0,0.4)', letterSpacing: -0.2 }}
              >
                {loading ? '사진 정보를 불러오는 중' : error ? '사진 정보를 불러올 수 없어요' : '이 사진에는 촬영 정보가 없어요'}
              </Text>
            </View>
          ) : (
            <PhotoExifSheetContent exif={exif!} onClose={onClose} showMap={everOpened} />
          )}
        </ScrollView>
      </Animated.View>
    </>
  );
}
