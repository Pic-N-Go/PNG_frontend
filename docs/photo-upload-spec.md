# Photo Upload Specification

PNG 앱에서 사용자가 업로드하는 사진에 대한 기술 스펙 문서입니다.

---

## 허용 파일 형식

| 형식 | 허용 | 비고 |
|---|---|---|
| JPEG / JPG | ✅ | 기본 저장 형식 |
| HEIC / HEIF | ✅ | iOS 기본 카메라 형식 — 서버에서 JPEG 변환 |
| PNG | ✅ | 투명 배경 무시, JPEG로 변환 |
| WebP | ❌ | 브라우저 지원 불균일 |
| GIF | ❌ | 정적 이미지만 허용 |
| RAW (DNG 등) | ❌ | 용량 과다, 처리 복잡 |

서버 수신 후 모든 형식은 **JPEG (quality 85)** 또는 **WebP** 로 변환하여 저장합니다.

---

## 파일 크기 제한

| 구분 | 기준 |
|---|---|
| 최대 | **10MB** (초과 시 업로드 거부) |
| 최소 | 제한 없음 |

> 클라이언트에서 1차 검증 후, 서버에서 2차 검증합니다.

---

## 해상도 (픽셀) 기준

| 구분 | 기준 | 처리 |
|---|---|---|
| 최소 권장 | 1080 × 1080px | 미만 시 화질 경고 표시 (업로드는 허용) |
| 최소 허용 | 400 × 400px | 미만 시 업로드 거부 |
| 최대 | 제한 없음 | 서버에서 리사이징 후 저장 |

---

## 표시용 크롭 규격

업로드된 원본은 그대로 보관하고, 용도별로 썸네일을 자동 생성합니다.

| 용도 | 비율 | 리사이즈 크기 | 비고 |
|---|---|---|---|
| 갤러리 / 출품 썸네일 | 1:1 | 600 × 600px | center crop |
| 게시글 카드 | 4:3 | 800 × 600px | center crop |
| 라이트박스 / 상세 | 원본 비율 유지 | 최대 폭 1200px | 비율 유지 리사이즈 |
| 마이페이지 그리드 | 1:1 | 400 × 400px | center crop |

---

## 클라이언트 검증 (업로드 전)

```ts
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/heic', 'image/heif'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MIN_DIMENSION = 400; // px

function validatePhoto(file: File): { valid: boolean; error?: string } {
  const extension = file.name.split('.').pop()?.toLowerCase();
  const isHeic = extension === 'heic' || extension === 'heif';
  if (!ALLOWED_TYPES.includes(file.type) && !isHeic) {
    return { valid: false, error: 'JPEG, PNG, HEIC 형식만 업로드할 수 있어요.' };
  }
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: '파일 크기는 10MB 이하여야 해요.' };
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
  → 원본 저장 (S3 또는 Supabase Storage)
  → 썸네일 자동 생성 (Lambda / Edge Function)
      ├── 600×600 (1:1, gallery)
      ├── 800×600 (4:3, feed card)
      └── max-width 1200 (lightbox)
  → CDN 배포 (Cloudflare Images 또는 CloudFront)
```

---

## EXIF 처리

- 업로드 시 EXIF 데이터 **읽기 허용** — 촬영 정보(카메라, 렌즈, 날짜, GPS) 자동 추출
- 저장 시 GPS 정보는 **제거** (개인정보 보호) — 스팟 정보는 별도 필드로 관리
- 촬영 일시, 카메라 모델, 조리개/셔터스피드/ISO는 보관하여 게시글에 표시 가능

---

## 콘테스트 출품 추가 제한

일반 게시글 업로드 기준에 더해 아래 조건을 추가 적용합니다.

| 항목 | 기준 |
|---|---|
| 최소 해상도 | **1920 × 1080px** 이상 권장 (미만 시 경고) |
| 출품 가능 수 | 콘테스트당 **1장** |
| 수정 가능 여부 | 출품 후 **수정 불가** (기간 내 철회 후 재출품은 가능) |
| 중복 출품 | 동일 사진 다른 콘테스트 출품 **허용** |
