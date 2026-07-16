# MyPageSettings — FAQ 진입 지점 수정본

## 배경
기존 마이페이지 설정 화면에서 `자주 묻는 질문` 섹션 내부 리스트의 마지막 항목으로 **"FAQ 전체 보기 (더 보기)"** 가 들어가 있었음. 아래 이유로 UX 상 어색:

1. 리스트 아이템(질문)과 네비게이션 액션(전체 보기)이 같은 시각 위계로 섞여 있음 → "이것도 질문인가?" 헷갈림
2. 강조 컬러(#e31b59 · "더 보기") 가 실제 질문들보다 눈에 띄어 정보 계층이 뒤집힘
3. 탭 가능한 4개 아이템 중 3개는 상세로, 1개만 리스트로 이동 → 예측 불가능

## 변경 사항
- **"FAQ 전체 보기" 항목을 카드 안에서 제거**
- **섹션 헤더 우측에 `전체 보기 >`** 텍스트 링크로 이동 (iOS 설정 앱 · App Store · 유튜브 등 표준 패턴)
- 카드 안 3개 아이템은 모두 `FAQDetail` 로 이동, 동작 방식 통일
- 강조 컬러는 배지(1:1 문의 미확인 답변 카운트)와 회원 탈퇴에만 사용

## 파일
- `MyPageSettings.native.jsx` — RN 실구현
- `MyPage_FAQ.dc.html` — BEFORE/AFTER + 전체 화면 시안 (디자인 미리보기용)

## 라우팅 매핑
| 아이템 | route |
| --- | --- |
| 위치 권한 | `LocationPermission` |
| 차단 목록 | `BlockList` |
| 자주 묻는 질문 · **전체 보기** | `FAQ` |
| 자주 묻는 질문 · 개별 질문 | `FAQDetail` (params: `{ id }`) |
| 1:1 문의 | `Inquiry` |
| 버전 정보 | `VersionInfo` |
| 로그아웃 | `Logout` |
| 회원 탈퇴 | `Withdraw` |

## 스타일 토큰 (마이페이지 공용)
| 이름 | 값 |
| --- | --- |
| bg | `#ffffff` |
| card | `#f5f5f7` |
| brand | `#e31b59` |
| brandBg | `#fce9ee` |
| text1 | `#000000` |
| text2 | `rgba(0,0,0,0.5)` |
| text3 | `rgba(0,0,0,0.35)` |
| divider | `rgba(0,0,0,0.05)` |
| iconBg | `rgba(0,0,0,0.06)` |

## 의존성
- `react-native`
- `@react-navigation/native`
- `@tabler/icons-react-native` — `IconChevronRight`, `IconCurrentLocation`, `IconBan`, `IconMessageCircle2`, `IconInfoCircle`, `IconLogout`, `IconTrash`
- `@/utils/normalize`

## FAQ 프리뷰 데이터
현재는 상수(`FAQ_PREVIEW`)로 상위 3개를 하드코딩. 실서비스에서는:
- 조회수 Top 3 또는 최근 업데이트 순으로 서버에서 가져오는 것을 권장
- 응답 형태: `[{ id: string, title: string }]`

## 접근성
- `SectionHeader` 의 `전체 보기` Pressable 은 `hitSlop={8}` 로 히트 영역 확장
- 각 Row 의 `activeOpacity` 는 `pressed ? 0.6 : 1` 로 시각 피드백
- 최소 폰트 크기 12px 유지, 히트 영역 44pt 이상
