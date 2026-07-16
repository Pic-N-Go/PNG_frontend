# VersionInfoSheet + TermsOfService

## 개요
마이페이지 > 설정 > **버전 정보 바텀시트** 와 그 시트에서 진입하는 **이용약관 화면**.
이전 라운드 피드백 6가지 반영 완료 (그룹 분리 · 강조 낮추기 · 그랩 핸들 · 업데이트 확인 · 컨텐츠 높이 · CJK 폰트).

## 폰트 토큰 (프로젝트 규약)
raw px 금지. 아래 8개 토큰(10/11/13/14/15/17/22/28px)만 사용. `normalize()` 로 감쌈.

| 이름 | 값 | 용도 |
| --- | --- | --- |
| 2xs | 10 | 배지 |
| xs | 11 | 캡션 (섹션 라벨 · 개정일/버전 라벨 · "이하 생략") |
| sm | 13 | 우측 값 · 링크 · 본문 · 버튼 |
| base | 14 | 토스트 등 (여기서 미사용) |
| md | 15 | Row 제목 · 조 제목 · 좌측 라벨 |
| lg | 17 | 네비바 타이틀 |
| xl | 22 | 시트 타이틀 "버전 정보" |
| 2xl | 28 | (여기서 미사용) |

## 파일
- `VersionInfoSheet.native.jsx` — 바텀시트 컴포넌트 (Modal + PanResponder + Animated)
- `TermsOfService.native.jsx` — 이용약관 스크린
- `Figma_export.html` — Figma import 용 클린 아트보드 HTML

## 라우팅
바텀시트에서 3개 문서 route:
- `TermsOfService` — 이용약관 (본 파일)
- `PrivacyPolicy` — 개인정보처리방침 (별도)
- `OpenSourceLicenses` — 오픈소스 라이선스 (별도)

## VersionInfoSheet 사용법
```jsx
const [visible, setVisible] = useState(false);

// SettingsScreen 의 버전 정보 Row
<Row onPress={() => setVisible(true)}>...</Row>

<VersionInfoSheet
  visible={visible}
  onClose={() => setVisible(false)}
  appVersion="v1.0.0"
  releaseDate="2026.05.01"
  isLatest={true}
  developer="多多益Shot"
/>
```

### Props
| 이름 | 타입 | 기본값 | 설명 |
| --- | --- | --- | --- |
| visible | boolean | — | 시트 표시 여부 |
| onClose | () => void | — | 닫기 콜백 (스와이프 다운 · 스크림 탭) |
| appVersion | string | `'v1.0.0'` | |
| releaseDate | string | `'2026.05.01'` | |
| isLatest | boolean | `true` | 최신이면 초록 점 + `최신 버전`, 아니면 브랜드 색 + `업데이트 필요` |
| developer | string | `'多多益Shot'` | |

### 인터랙션
- **그랩 핸들** 만 있고 X 버튼 없음 (iOS 표준). 스와이프 다운(120px 또는 vy>0.8) 시 닫힘.
- **스크림 탭** 시 닫힘.
- **업데이트 확인** 텍스트 버튼 → 스토어 딥링크(`itms-apps://` / `market://`). codepush 사용 시 이 부분에 codepush check 붙이면 됨.

## TermsOfService 컨텐츠
`TOS_META` + `TOS_ARTICLES` 배열로 관리. 실서비스에서는:
- CMS 또는 서버 API 로 조 별 컨텐츠 fetch
- 응답: `{ meta: { lastRevision, version, pdfUrl, totalArticles }, articles: [{ title, body }] }`

## 액션 버튼
- **공유** — `Share.share()` 로 시스템 공유 시트, 메시지에 PDF URL 포함
- **원문(PDF) 열기** — `Linking.openURL(pdfUrl)` → 시스템 브라우저 또는 PDF 뷰어

## 의존성
- `react-native`
- `@react-navigation/native`
- `@tabler/icons-react-native` — `IconChevronRight`, `IconRefresh`, `IconChevronLeft`, `IconUpload`, `IconExternalLink`
- `@/utils/normalize`

## 접근성
- 그랩 핸들 영역 `paddingVertical: 9` 로 히트 확장
- 버튼 hitSlop=8, 최소 히트 영역 44pt
- 색상 대비: 최신 버전 초록(#22a05a on #f5f5f7) · 본문(rgba(0,0,0,0.7) on #fff) WCAG AA 만족

## 반영된 이전 피드백 6가지
1. 앱 메타(4행) / 약관 및 정책(3행) **2개 그룹으로 카드 분리**
2. "보기 →" 핑크 제거 → 셰브론(›) 만
3. 그랩 핸들만, X 버튼 제거
4. `업데이트 확인` 텍스트 버튼 추가
5. Modal + 컨텐츠 높이 기반 시트 (반쪽 스냅 없음)
6. `多多益Shot` 폰트 폴백: Pretendard → Apple SD Gothic Neo → PingFang SC → Noto Sans CJK KR
