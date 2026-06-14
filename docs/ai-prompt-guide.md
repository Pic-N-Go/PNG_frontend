# AI 프롬프트 가이드

> 이 문서는 **개인 단위 프롬프트 작성용** 보조 가이드입니다.  
> 팀 표준 프로세스(스펙/계획/리뷰 체크리스트)는 `docs/ai/README.md`를 단일 기준으로 사용하세요.

> 어떤 AI 도구를 사용하든 이 파일을 기준으로 프롬프트를 작성하세요.  
> Claude Code 사용자는 `CLAUDE.md`가 자동으로 로드되므로 아래 **제약 조건**만 참고하면 됩니다.  
> Cursor, Copilot, ChatGPT 등 다른 도구 사용자는 **프롬프트 템플릿**을 복붙해서 사용하세요.

---

## 프로젝트 핵심 규칙 (모든 AI에 공통 적용)

```
- 프레임워크: React Native (Expo)
- 스타일링: NativeWind (Tailwind CSS v3) — className만 사용, StyleSheet 사용 금지
- 서버 상태: TanStack Query (useQuery / useMutation)
- 클라이언트 상태: Zustand
- import 경로: @/ → src/ (예: @/store/useAuthStore)
- 화면 파일 위치: src/screens/
- API 함수 위치: src/api/
- 디자인 토큰:
    - 브랜드 색상: #E31B59 (핑크)
    - 배경: #ffffff / 카드·인풋: #f5f5f7
    - 버튼 높이: 52px, pill shape (border-radius: 26px)
    - 인풋 높이: 52px
    - 콘텐츠 좌우 패딩: 28px (카드 그리드는 20px)
    - 폰트: Pretendard Variable, 최대 weight 600, 음수 letter-spacing
    - 카드: 테두리·그림자 없음, border-radius: 16px
    - 이모지 사용 금지
```

---

## 프롬프트 템플릿

### 기본형 (화면 구현)

```
[참조 HTML 경로] 파일을 참고해서 [출력 파일 경로].tsx 를 구현해줘.

제약 조건:
- 스타일: NativeWind className만 사용 (StyleSheet 사용 금지)
- 디자인: 아래 토큰 기준으로 HTML과 동일한 레이아웃·색상·간격 유지
    - 브랜드 색상 #E31B59, 버튼 52px pill, 인풋 52px, 카드 radius 16px
    - 콘텐츠 패딩 28px, 카드 그리드 20px
- import: @/ alias 사용 (예: @/components/...)
- API: [src/api/파일.ts 의 함수명()] 연결
- 완료 후 이동: [다음 화면]
```

### 예시: 로그인 화면

```
src/components/ui/auth/login.html 파일을 참고해서
src/screens/auth/LoginScreen.tsx 를 구현해줘.

제약 조건:
- 스타일: NativeWind className만 사용 (StyleSheet 사용 금지)
- 디자인: HTML과 동일한 레이아웃·색상·간격 유지
    - hero 그라디언트 (#1a1530 → #f0c89a), 버튼 52px pill, 인풋 52px
- import: @/ alias 사용
- API: src/api/auth.ts 의 loginWithEmail() 연결
- 로그인 성공 시 HomeScreen으로 이동
- 카카오·애플 소셜 로그인 버튼 포함
```

### 예시: 스팟 상세 화면

```
src/components/ui/spot/spot-detail.html 파일을 참고해서
src/screens/spot/SpotDetailScreen.tsx 를 구현해줘.

제약 조건:
- 스타일: NativeWind className만 사용 (StyleSheet 사용 금지)
- 디자인: HTML과 동일한 탭(정보·사진·리뷰·AI분석) 구조 유지
- import: @/ alias 사용
- API: src/api/spots.ts 의 getSpotDetail(id) 연결
- route params: spotId 받아서 API 호출
```

---

## HTML 목업 파일 위치

```
src/components/ui/
  auth/         login, signup, oauth-onboarding
  home/         home, map
  travel/       travel-list, travel-plan, travel-new
  community/    community-feed
  spot/         spot-detail, spot-register, spot-change, spot-list, review-write
  mypage/       mypage, my-photos, profile-edit, setting, notification, photo-map
  wishlist/     wishlist, wishlist-setting
```

전체 구조 및 화면 간 네비게이션 흐름 → `docs/ui-publishing.md`

---

## 도구별 설정 파일 위치

| AI 도구 | 규칙 파일 | 비고 |
|---|---|---|
| Claude Code | `CLAUDE.md` | 자동 로드됨 |
| Cursor | `.cursorrules` | 없으면 이 파일 내용 복붙 |
| GitHub Copilot | `.github/copilot-instructions.md` | 없으면 이 파일 내용 복붙 |
| ChatGPT / 기타 | - | 프롬프트 템플릿 직접 복붙 |

> 규칙 파일이 없는 도구를 사용할 경우, **프로젝트 핵심 규칙** 블록을 프롬프트 앞에 붙여넣고 시작하세요.

---

## 팀 작업 시 최소 절차

팀 작업 순서는 `docs/ai/README.md`를 단일 기준으로 따릅니다.

- 표준 흐름: Intake → spec → plan → [구현] → commit → handoff(선택) → doc-sync(선택) → review → pr
- 이 문서는 개인 단위 프롬프트 작성 보조 용도로만 사용합니다.

---

## 참고 우선순위

1. 팀 표준 프로세스: `docs/ai/README.md`
2. 프로젝트 규칙/디자인 제약: `CLAUDE.md`
3. 화면 구조/흐름: `docs/ui-publishing.md`
4. 이 문서: 개인 프롬프트 작성 보조
