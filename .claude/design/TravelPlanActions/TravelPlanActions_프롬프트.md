# TravelPlanActions — 공유 · 더보기 · 저장될 이미지

## 개요
여행 계획 상단 3개 아이콘 중 **공유 (upload)** 와 **더보기 (⋯)** 의 다음 화면, 그리고 공유 시트의 "이미지로 저장" 이 만들어낼 **저장 이미지 컴포넌트** 3종.

지도 전체보기(map 아이콘)는 별도 라운드에서 진행.

## 파일
- `TravelPlanShareSheet.native.jsx` — 공유 바텀시트
- `TravelPlanMoreSheet.native.jsx` — 더보기 바텀시트
- `TravelPlanShareImage.native.jsx` — 저장될 이미지 (1080×1920) 렌더링 컴포넌트
- `TravelPlanActions.dc.html` — 3개 흐름 + 저장 이미지 시안 (참고용)

## 폰트 토큰 (프로젝트 규약)
10 / 11 / 13 / 14 / 15 / 17 / 22 / 28px 만 사용. `normalize()` 로 감쌈.

| 이름 | 값 | 용도 |
| --- | --- | --- |
| 2xs | 10 | BETA 뱃지, D1/D2 뱃지 |
| xs | 11 | 캡션 · 서브라벨 |
| sm | 13 | 행 값 · 링크 · 버튼 · 스팟 이름 |
| md | 15 | 행 제목 · 요약 값 |
| xl | 22 | 시트 타이틀 |
| 2xl | 28 | 저장 이미지 메인 타이틀 |

## 팔레트

| 이름 | 값 | 용도 |
| --- | --- | --- |
| brand | `#e31b59` | 마이페이지 계열 · 저장 이미지 로고/타이틀 강조 · destructive |
| brandBgSoft | `#fef2f5` | 삭제 액션 카드 배경 |
| bgTintTop | `#fff0f4` | 저장 이미지 상단 배경 (핑크 옅은 톤) |
| day1 | `#f59e0b` | 여행 계획 DAY 1 · 공유 시트 강조 |
| day2 | `#3b82f6` | 여행 계획 DAY 2 |

## 1. TravelPlanShareSheet
### Props

| 이름 | 타입 | 설명 |
| --- | --- | --- |
| visible | boolean | 시트 표시 |
| onClose | () => void | 닫기 |
| plan | `{ name, spotCount, shareUrl, onSaveImage, onExportPdf }` | 계획 정보 + 액션 콜백 |

### 인터랙션
- 그랩 핸들 스와이프 다운 · 스크림 탭으로 닫힘
- **앱 shortcut 5개**: 카카오톡 · 인스타 스토리 · 페이스북 · X · 시스템 더보기 (`Share.share()`)
- **링크 복사** — `Clipboard.setString`, 토스트로 피드백 (구현 필요)
- **이미지로 저장** — `plan.onSaveImage` 콜백 (아래 참고)
- **PDF 로 내보내기** — BETA 뱃지, `plan.onExportPdf` 콜백

## 2. TravelPlanMoreSheet
### Props

| 이름 | 타입 |
| --- | --- |
| visible | boolean |
| onClose | () => void |
| plan | `{ name }` |
| onRename | () => void |
| onDuplicate | () => void |
| onInvite | () => void |
| onAddToCalendar | () => void |
| onDelete | () => void |

### 인터랙션
- **이 계획 전체 삭제** → `Alert.alert` 확인 다이얼로그 (취소 / 삭제 destructive)
- **공동 편집자 초대** — BETA 뱃지, 셰브론 없음 (다음 라운드에서 초대 시트)
- 스팟 개별 삭제와 혼동 방지: `이 계획 전체 삭제` 라벨 + 서브카피 `스팟 개별 삭제는 "코스 편집" 에서`

## 3. TravelPlanShareImage
공유 > "이미지로 저장" 이 눌렸을 때, 이 컴포넌트를 **off-screen 마운트** 후 `react-native-view-shot` 로 캡처 → CameraRoll 저장.

### 캡처 방법
```jsx
import { captureRef } from 'react-native-view-shot';
import CameraRoll from '@react-native-community/cameraroll';

const shareImgRef = useRef(null);

const onSaveImage = async () => {
  const uri = await captureRef(shareImgRef, {
    format: 'png',
    quality: 1,
    width: 1080,
    height: 1920,
    result: 'tmpfile',
  });
  await CameraRoll.save(uri, { type: 'photo' });
  // Toast: "이미지가 저장됐어요"
};

// 렌더 트리 어딘가 (off-screen, opacity:0, pointerEvents:none)
<TravelPlanShareImage ref={shareImgRef} plan={{
  name: '부산 1박 2일',
  dateRange: '2026.05.17 (토) ~ 05.18 (일)',
  spots: [
    { day: 1, name: '광안리 해수욕장', time: '06:30', tag: '야경/바다', thumb: 'https://...' },
    { day: 1, name: '해동용궁사',     time: '09:00', tag: '한옥/바다', thumb: 'https://...' },
    { day: 2, name: '흰여울문화마을',  time: '09:30', tag: '뷰/감성',   thumb: 'https://...' },
  ],
  totalSpots: 9,
  distanceKm: 142,
  days: 2,
  mapImage: 'https://png.travel/api/render/map?planId=abc123', // 서버 렌더 지도 PNG
  qrImage: 'https://png.travel/api/qr?url=...',
  shareUrl: 'https://png.travel/plan/abc123',
}} />
```

### 이미지 컨텐츠
- 상단: PNG 로고 + `MY TRAVEL PLAN` 워터마크
- 타이틀: `DAY 1 · DAY 2` · 계획명 (28px) · 기간
- 지도: 서버에서 렌더된 정적 PNG (핀 + 루트 포함)
- 범례: DAY 1 (오렌지) · DAY 2 (블루)
- HIGHLIGHTS: 대표 3곳 (D1/D2 뱃지 + 썸네일 + 시간/태그)
- 요약 스탯: 포토스팟 / 이동 / 일정 3분할 카드 (대표 3곳과 28px 간격)
- QR: 계획 공유 URL 로 딥링크 (스캔한 사람이 앱에서 미리보기 → "내 여행에 저장" 흐름)

### 정적 이미지 원칙
저장된 이미지는 픽셀이므로 **어떤 요소도 탭 반응 없음**. 그래서:
- 버튼 스타일 텍스트(`전체 일정 보기` 등) 금지
- DAY 필터처럼 보이는 UI 금지 → 범례(legend) 로만 표시
- 더 보기가 필요하면 → QR 로만 유도

## 의존성
- `react-native`
- `@tabler/icons-react-native` — `IconChevronRight`, `IconLink`, `IconPhoto`, `IconFileText`, `IconPencil`, `IconCopy`, `IconUsers`, `IconCalendar`, `IconTrash`
- `react-native-view-shot` — 이미지 캡처
- `@react-native-community/cameraroll` — 갤러리 저장 (또는 Expo `MediaLibrary`)
- `@/utils/normalize`

## 접근성
- 시트 모든 Pressable `hitSlop=8`, 최소 히트 영역 44pt
- destructive 액션 (`이 계획 전체 삭제`) 은 반드시 `Alert.alert` 확인
- BETA 뱃지는 시각적 힌트일 뿐 · 스크린리더는 label 그대로 읽음

## v2 로드맵
- 저장 이미지 1:1 (인스타 피드) / PDF 포맷 추가
- 저장 이미지 렌더링 옵션 시트 (지도만 · 일정만 · 통합)
- 공동 편집자 초대 시트 (이메일/카톡)
