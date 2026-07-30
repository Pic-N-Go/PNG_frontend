# Photo Upload Specification

PNG 앱에서 사용자가 업로드하는 사진에 대한 기술 스펙 문서입니다.

> **문서 성격**: 초기 설계 기준으로 작성돼 미구현 항목이 섞여 있습니다. 2026-07-29 기준으로
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

클라이언트에서 1차 검증합니다. 단 **플랫폼별로 기준이 다릅니다** —
iOS의 `fileSize`는 압축 후(실제 전송) 크기라 서버 한도를 그대로 적용하지만,
Android는 압축 전 원본 크기라 같은 기준을 쓰면 압축하면 통과할 사진을 오탐으로 막습니다.
그래서 Android에서는 압축률을 감안한 관대한 상한만 둬 명백히 과대한 파일만 걸러냅니다
(`ReviewWriteScreen.tsx`의 `ANDROID_SIZE_SLACK`).

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

**GPS 제거 방침은 2026-07-29에 철회됐습니다.** 사진 정보 화면에서 촬영 위치(위도·경도)를
표시하기로 결정해, EXIF를 **그대로 보존**합니다. 클라이언트도 서버도 GPS를 지우지 않습니다.

- 업로드 시 EXIF **보존** — 촬영 정보(카메라, 렌즈, 날짜, GPS)가 원본 그대로 저장됩니다
- 촬영 일시, 카메라 모델, 조리개/셔터스피드/ISO도 보관

> ⚠️ **GPS 제거 로직을 추가하지 마세요.** 위치 표시 기능이 조용히 깨집니다.
> 반대로 위치 표시 계획이 취소되면 그때는 제거해야 합니다 — 아래 노출 범위 때문입니다.

리뷰 사진은 `GET /spots/{id}/reviews`로 **인증 없이 조회**되므로 촬영 좌표가 공개됩니다.
사용자가 스팟이 아닌 곳(집 등)에서 찍은 사진을 첨부하면 그 위치가 노출됩니다.
그래서 리뷰 작성 화면 사진 첨부 영역에 고지 문구를 두었습니다 —
"사진에 담긴 촬영 위치가 다른 사용자에게 보일 수 있어요".

> `계획` 위치 표시 기능 자체는 아직 없습니다. 백엔드 `ExifExtractor`가 작성돼 있으나
> 업로드 경로에서 호출되지 않습니다(담당자 추후 작업 예정). 즉 현재는 좌표가
> **공개되기만 하고 활용되지는 않는** 중간 상태입니다.

---

## 콘테스트 출품 추가 제한

일반 게시글 업로드 기준에 더해 아래 조건을 추가 적용합니다.

| 항목 | 기준 |
|---|---|
| 최소 해상도 | **1920 × 1080px** 이상 권장 (미만 시 경고) |
| 출품 가능 수 | 콘테스트당 **1장** |
| 수정 가능 여부 | 출품 후 **수정 불가** (기간 내 철회 후 재출품은 가능) |
| 중복 출품 | 동일 사진 다른 콘테스트 출품 **허용** |
