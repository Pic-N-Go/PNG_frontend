# Photo Upload Specification

PNG 앱에서 사용자가 업로드하는 사진에 대한 기술 스펙 문서입니다.

> **문서 성격**: 초기 설계 기준으로 작성돼 미구현 항목이 섞여 있습니다. 2026-08-18 기준으로
> 실제 구현과 어긋난 부분을 정정하고, 계획 단계인 항목에 `계획` 표기를 달았습니다.
> **구현 여부가 불확실하면 이 문서가 아니라 코드를 기준으로 판단하세요.**
> 리뷰 사진 업로드 구현: `src/screens/spot/ReviewWriteScreen.tsx`, `src/api/spot.ts`

---

## 허용 파일 형식

| 형식 | 허용 | 비고 |
|---|---|---|
| JPEG / JPG | ✅ | 기본 저장 형식 |
| HEIC / HEIF | ✅ | iOS 기본 카메라 형식 — 클라이언트에서 JPEG 전사 |
| PNG | ✅ | 원본 그대로 저장 (변환 없음) |
| WebP | ❌ | 브라우저 지원 불균일 |
| GIF | ❌ | 정적 이미지만 허용 |
| RAW (DNG 등) | ❌ | 용량 과다, 처리 복잡 |

**서버는 형식을 변환하지 않습니다.** 수신한 바이트를 그대로 S3에 저장합니다
(`S3ImageStorageService`). 따라서 확장자·MIME을 클라이언트가 정확히 붙여야 합니다.

HEIC 변환은 **클라이언트에서** 처리합니다 — iOS 피커의
`preferredAssetRepresentationMode: Compatible`이 시스템 JPEG 전사를 거쳐 넘겨줍니다.
이 옵션 없이는 HEIC 원본이 그대로 올라가 일부 기기에서 표시가 깨집니다.

> `계획` 서버측 JPEG(quality 85)/WebP 변환은 미구현입니다.

---

## 파일 크기 제한

| 구분 | 기준 | 근거 |
|---|---|---|
| 파일당 최대 | **20MB** | 서버 `spring.servlet.multipart.max-file-size` |
| 요청 전체 최대 | **100MB** | 서버 `max-request-size` (리뷰 사진 5장 × 20MB와 일치) |
| 최소 | 제한 없음 | |

초과 시 서버는 400 `INVALID_INPUT_VALUE` + `"업로드 용량이 허용 범위를 초과했습니다."`를 반환합니다.

클라이언트에서 1차 검증합니다. **양 플랫폼 동일하게 20MB 기준을 그대로 적용합니다** —
image-picker `quality`가 1이라(아래 [EXIF 처리](#exif-처리) 참고) 재인코딩이 없어
`fileSize`가 곧 실제 전송 크기이기 때문입니다.

> 2026-08-18 변경: 이전에는 Android만 압축률을 감안한 여유 배수(`ANDROID_SIZE_SLACK`)를
> 뒀습니다. `quality: 1`로 바뀌며 압축 자체가 사라져 그 보정의 전제가 없어졌고, 상수도
> 삭제했습니다. **회귀 주의** — 예전에는 압축 후 통과했을 20MB 초과 원본이 이제 업로드
> 전에 거부됩니다. 사용자에겐 "되던 게 안 되는" 변화라, 초과 시 압축 폴백을 제안하는 건
> 후속 과제입니다.

---

## 해상도 (픽셀) 기준

> `계획` **아래 기준은 전부 미구현입니다.** 클라이언트·서버 어느 쪽에도 해상도 검증이 없고,
> 서버 리사이징도 없습니다. 현재는 어떤 해상도든 원본이 그대로 저장됩니다.

| 구분 | 기준 | 처리 |
|---|---|---|
| 최소 권장 | 1080 × 1080px | 미만 시 화질 경고 표시 (업로드는 허용) |
| 최소 허용 | 400 × 400px | 미만 시 업로드 거부 |
| 최대 | 제한 없음 | 서버에서 리사이징 후 저장 |

---

## 표시용 크롭 규격

> `계획` **썸네일 자동 생성은 미구현입니다.** 현재는 원본 하나만 저장되고, 목록 썸네일도
> 같은 원본을 축소 표시합니다. 아래는 도입 시의 목표 규격입니다.

| 용도 | 비율 | 리사이즈 크기 | 비고 |
|---|---|---|---|
| 갤러리 / 출품 썸네일 | 1:1 | 600 × 600px | center crop |
| 게시글 카드 | 4:3 | 800 × 600px | center crop |
| 라이트박스 / 상세 | 원본 비율 유지 | 최대 폭 1200px | 비율 유지 리사이즈 |
| 마이페이지 그리드 | 1:1 | 400 × 400px | center crop |

---

## 클라이언트 검증 (업로드 전)

> 아래 예시는 웹 `File` API 기준입니다. React Native에는 `File`이 없어 그대로 쓸 수 없습니다.
> 실제 구현은 `expo-image-picker`의 `ImagePickerAsset`(`uri`/`fileSize`/`width`/`height`)를
> 검사합니다 — `ReviewWriteScreen.tsx`의 `pickPhotos` 참고.

```ts
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/heic', 'image/heif'];
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB — 서버 max-file-size와 동일
const MIN_DIMENSION = 400; // px

function validatePhoto(file: File): { valid: boolean; error?: string } {
  const extension = file.name.split('.').pop()?.toLowerCase();
  const isHeic = extension === 'heic' || extension === 'heif';
  if (!ALLOWED_TYPES.includes(file.type) && !isHeic) {
    return { valid: false, error: 'JPEG, PNG, HEIC, HEIF 형식만 업로드할 수 있어요.' };
  }
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: '파일 크기는 20MB 이하여야 해요.' };
  }
  return { valid: true };
}
```

> 해상도 검증은 `Image` 객체로 로드 후 `naturalWidth / naturalHeight` 확인

---

## 서버 처리 플로우

```
클라이언트 업로드
  → 형식/크기 검증
  → 원본 저장 (S3)
  → [계획] 썸네일 자동 생성 (Lambda / Edge Function)
      ├── 600×600 (1:1, gallery)
      ├── 800×600 (4:3, feed card)
      └── max-width 1200 (lightbox)
  → [계획] CDN 배포 (Cloudflare Images 또는 CloudFront)
```

현재 구현은 원본 저장까지입니다. 조회 시에는 presigned URL을 발급합니다
(만료는 환경 설정값 `AWS_S3_PRESIGNED_URL_EXPIRATION_MINUTES`, 로컬 60분).
만료가 있으므로 URL을 캐싱하거나 영구 저장하면 안 됩니다.

---

## EXIF 처리

### 사용자 동의 계약 (2026-09-01)

커뮤니티 게시글과 리뷰를 새로 작성할 때 기술 EXIF와 위치 EXIF 동의를 각각 받습니다.
두 필드는 생성 요청의 JSON 파트에 반드시 포함하며 허용값은 `GRANTED`와 `DECLINED`뿐입니다.

```ts
type ExifConsentStatus = 'GRANTED' | 'DECLINED';

interface ExifConsentRequest {
  technicalExifConsent: ExifConsentStatus;
  locationExifConsent: ExifConsentStatus;
}
```

| 필드 | `GRANTED`일 때 | `DECLINED`일 때 |
|---|---|---|
| `technicalExifConsent` | 카메라·렌즈·ISO·노출 등 기술 EXIF 추출·저장 | 해당 DB 필드를 `NULL`로 저장 |
| `locationExifConsent` | 위도·경도 추출 및 촬영 주소 역지오코딩·저장 | 좌표·주소를 `NULL`로 저장 |

- 동의는 사진별이 아니라 게시글 또는 리뷰 생성 요청 단위이며, 첨부한 모든 사진에 동일하게 적용됩니다.
- 게시글 수정 및 리뷰 사진 추가는 생성 시 저장한 동의 상태를 그대로 사용합니다.
- 동의했더라도 원본 사진에 값이 없거나 운영체제·사진 선택기가 제거한 값은 `NULL`입니다.
- 파일명과 파일 크기는 EXIF가 아닌 업로드 관리 정보이므로 동의 여부와 관계없이 저장될 수 있습니다.
- EXIF 제거 업로드는 후속 작업입니다. 현재 서버는 원본 바이트를 S3에 저장하므로 다운로드한 파일에 원본 EXIF가 남을 수 있습니다.
- 게시글·리뷰 작성 화면은 두 동의를 독립적인 스위치로 받으며 기본값은 모두 `DECLINED`입니다.
- 프론트는 동의 전에 사진 EXIF를 별도로 파싱하지 않고 원본 바이트만 전달합니다. 실제 추출은 서버가 동의 상태를 확인한 뒤 수행합니다.

현재 백엔드는 동의한 범위의 EXIF만 추출합니다. 운영체제나 사진 선택기가 개인정보 보호를 위해
GPS를 가릴 수 있으므로 위치 필드는 항상 nullable입니다.

- 기술 EXIF 동의 시 촬영 일시, 카메라 모델, 조리개/셔터스피드/ISO 등을 보관
- 위치 EXIF 동의 시 유효한 위도·경도를 카카오 좌표 변환 API로 역지오코딩해 `address`에 저장
- GPS가 없거나 위도·경도가 모두 `0`이면 좌표와 주소를 `NULL`로 저장하고 카카오 API 호출 생략

> ⚠️ GPS와 주소가 항상 존재한다고 가정하지 마세요. 정상적인 원본 사진이라도 플랫폼의
> 개인정보 보호 처리, 스크린샷, 편집본, 메신저 전송본에서는 위치정보가 없을 수 있습니다.

### 클라이언트 전제 조건 — `quality: 1`

EXIF 보존은 서버 방침만으로 성립하지 않습니다. `ReviewWriteScreen.tsx`의 image-picker
옵션이 `quality: 1`이어야 원본 바이트가 그대로 전송됩니다.

- **iOS**: `quality < 1`이면 `ImageUtils.swift:153`이 `UIImage`에서 JPEG를 재인코딩하는데,
  `UIImage`는 메타데이터를 들고 있지 않아 결과 파일에 EXIF가 한 줄도 남지 않습니다.
  `quality >= 1.0`이면 같은 파일 151행에서 원본 바이트를 그대로 반환합니다.
- **Android**: `MediaHandler.kt:50`이 `quality == 1.0`일 때만 `RawImageExporter`(단순 copy)를
  타고, 그 외에는 `CompressionImageExporter`로 재인코딩합니다.

> ⚠️ **화질 조정 목적으로 `quality`를 낮추지 마세요.** 사진 정보 화면이 통째로 빈 값이 됩니다.
> 되돌려야 한다면 [파일 크기 제한](#파일-크기-제한)의 Android 여유 배수도 함께 되살려야 합니다.

`quality: 1`은 ImagePicker 내부의 재인코딩으로 일반 EXIF가 사라지는 것을 막는 설정입니다.
Android Photo Picker가 GPS를 가리는 동작까지 막지는 못합니다.

`preferredAssetRepresentationMode: Compatible`(iOS)이 HEIC를 JPEG로 전사하므로,
그 전사가 EXIF를 보존하는지에도 기능이 걸려 있습니다. 날아가는 게 확인되면
`.current` + 서버 HEIC 변환으로 가야 합니다.

### Android Photo Picker 위치정보 제한

Android는 앱이 Photo Picker로 선택한 사진을 읽을 때 원본 파일 자체를 변경하지 않고,
앱에 제공하는 파일 스트림의 민감한 GPS 메타데이터를 가릴 수 있습니다. 실제 검증에서는
GPS가 있는 원본 사진도 백엔드에 전달된 파일에서 GPS 태그 값이 `0,0`으로 확인됐습니다.

- 백엔드는 `0,0`을 유효한 좌표로 취급하지 않고 `NULL`로 정규화합니다
- 광범위한 사진 보관함 권한은 Google Play 심사 위험이 있어 도입하지 않습니다
- 시스템 Photo Picker를 유지하며 Android 갤러리 업로드에서 주소 저장을 보장하지 않습니다
- 원본 파일을 Postman으로 직접 업로드하면 GPS 추출·역지오코딩·주소 저장을 검증할 수 있습니다

커뮤니티와 리뷰 사진의 EXIF 조회 엔드포인트는 **인증 없이 조회**됩니다.
`locationExifConsent`가 `GRANTED`이고 원본에 유효한 GPS가 있으면 촬영 좌표와 주소가
공개될 수 있으므로, 위치 동의 UI에는 이 공개 범위를 명확히 고지해야 합니다.

**위치 표시 기능은 2026-08-18 구현 완료**됐고, 이후 역지오코딩한 주소 표시가 추가됐습니다.

- 조회(모두 permitAll — 토큰 불필요)
  - 커뮤니티: `GET /posts/{postId}/exif`
    → `communityApi.getExif` / `usePost` / `mapPostDetail`
  - 리뷰: `GET /reviews/{reviewId}/exif`
    → `spotApi.getReviewExif` / `useReviewExif` / `mapReviewExif`
- 응답: `images[].address`, `images[].latitude`, `images[].longitude`는 nullable
- 노출: 사진 확대(라이트박스) 우상단 정보 버튼 → 사진 정보 시트의 **위치** 섹션
  - 스팟 상세 → 리뷰 탭 사진
  - 마이페이지 → 내 리뷰 사진
  - 커뮤니티 → 게시글 사진
- 화면에는 주소만 텍스트로 표시하며 위도·경도 값은 노출하지 않습니다
- 좌표는 지도 렌더링에만 사용하고, 위도·경도가 모두 있을 때만 지도를 표시합니다
- 응답의 `images[].imageId`를 리뷰 목록의 `photos[].photoId`로 매칭합니다
  (presigned URL은 만료가 있어 키로 쓸 수 없습니다)

> `계획` `PhotoExifResponse`에 `takenAt`이 빠져 있어 시트의 **촬영일시** 행은 비어 있습니다
> (DB `ReviewPhoto.takenAt`에는 값이 있음). 해상도·색공간 행도 같은 이유로 공백입니다.
> 응답 DTO에 필드가 추가되면 `mapPhotoExif`에서 채우면 됩니다.
>
> `계획` 스팟 사진(TourAPI 외부 이미지)은 서버에 EXIF가 없습니다. `GET /spots/{id}/photos`가
> `originUrl`·`thumbnailUrl`·`imgName`만 반환하고 exif 엔드포인트도 없어, 스팟 상세 히어로
> 사진의 정보 시트는 URL에서 파싱한 파일명·형식만 표시합니다(`exifFromPhotoUrl`).

---

## 콘테스트 출품 추가 제한

일반 게시글 업로드 기준에 더해 아래 조건을 추가 적용합니다.

| 항목 | 기준 |
|---|---|
| 최소 해상도 | **1920 × 1080px** 이상 권장 (미만 시 경고) |
| 출품 가능 수 | 콘테스트당 **1장** |
| 수정 가능 여부 | 출품 후 **수정 불가** (기간 내 철회 후 재출품은 가능) |
| 중복 출품 | 동일 사진 다른 콘테스트 출품 **허용** |
