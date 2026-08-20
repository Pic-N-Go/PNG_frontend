# docs/guide/dev/

**"코드를 어떻게 구현하는가"** — 구현 기준, 스타일링 규칙, 기기 대응, 목업 구조에 관한 문서.

## 문서 목록

| 파일 | 용도 |
|---|---|
| `development-guide.md` | RN 구현 기준 — 폴더 구조, 상태 관리, 스타일링, 네비게이션 |
| `design-tokens.md` | 색·테두리·그림자·폰트 토큰 — 하드코딩 금지 규칙, 예외 목록 |
| `design-handoff-brief.md` | 디자이너·design Claude용 핸드오프 브리프 |
| `bottom-tab-usage.md` | 하단탭(TabBar) 사용법 — 탭 화면 구현 예시, 하단 여백/탭 이동 규칙 |
| `ui-publishing.md` | HTML 목업 구조 및 화면 간 네비게이션 흐름 |
| `device-support.md` | 지원 기기 범위(360dp–430dp), normalize/layout 상수 사용법 |
| `prompt-writing-guide.md` | 화면 구현용 AI 프롬프트 템플릿 |

## 포함 기준

- 컴포넌트/화면을 **어떻게** 만드는지 설명하는 문서
- 스타일링·레이아웃·기기 대응·목업→RN 변환 기준

## 제외 기준

API 스펙 → `api/` / CI·팀 운영 → `ops/` / AI 산출물 → `docs/ai/`
