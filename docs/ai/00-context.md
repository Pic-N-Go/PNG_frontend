> 이 문서는 `CLAUDE.md` 기반 요약 컨텍스트입니다. 규칙 충돌 시 `CLAUDE.md`를 단일 기준으로 따릅니다.

# 프로젝트 컨텍스트 (AI 공통 입력)

이 문서는 어떤 AI를 사용하든 프롬프트에 공통으로 제공할 기본 컨텍스트입니다.

---

## 프로젝트 개요

- 프로젝트: PNG (Pick N Go)
- 도메인: 포토스팟 탐색/여행 계획 앱
- 현재 레포 범위: 프론트엔드 (React Native + Expo)

---

## 기술 및 구조 제약

- 프레임워크: React Native (Expo)
- 언어: TypeScript
- 클라이언트 상태: Zustand (`src/store/`)
- 서버 상태: TanStack Query (`src/hooks/`)
- API 함수: `src/api/` (순수 fetch 함수만)
- 경로 alias: `@/` -> `src/`

---

## 스타일링 규칙

- NativeWind `className` 사용
- `StyleSheet.create()` 사용 금지
- 디자인 기준:
  - 브랜드 색상: `#E31B59`
  - 배경: `#ffffff`
  - 카드/인풋 배경: `#f5f5f7`
  - 기본 버튼 높이: 52px (pill)
  - 인풋 높이: 52px
  - 카드 radius: 16px
  - 콘텐츠 좌우 패딩: 28px (그리드 20px)
- 폰트: Pretendard Variable, 최대 600 weight
- 이모지 금지

---

## 화면/목업 참조 규칙

- HTML 목업 기준: `src/components/ui/`
- 화면 구현 위치: `src/screens/`
- 전체 구조/흐름 참조: `docs/ui-publishing.md`

---

## 작업 시 금지/주의

- 목업 구조와 전혀 다른 네비게이션/레이아웃으로 임의 변경 금지
- API 로직을 screen 컴포넌트에 하드코딩 금지
- 상대경로 import (`../../`) 남발 금지, `@/` alias 사용
- 타입 누락/`any` 남용 금지

---

## 참고 문서

- 기본 규칙 원문: `CLAUDE.md`
- 화면 흐름/목업 상세: `docs/ui-publishing.md`
- 기기/레이아웃 상수 기준: `docs/device-support.md`
- 프론트 구현 상세: `docs/development-guide.md`
- 팀 AI 협업 표준 (스펙/계획/리뷰): `docs/ai/README.md`
