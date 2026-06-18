# GitHub 자동화 가이드

> 이 레포에 설정된 GitHub Actions 및 자동화 규칙을 정리합니다.  
> 팀원 모두가 참고할 수 있도록 작성되었습니다.

> 문서 역할 분리:
> - 브랜치/PR 네이밍 규칙: `.github/CONVENTIONS.md` (단일 기준)
> - 프로젝트 온보딩/실행: `README.md`
> - 이 문서: **GitHub Actions 자동화 동작과 운영 대응**

---

## 워크플로우 목록

| 파일 | 실행 조건 | 역할 |
|---|---|---|
| `ci.yml` | PR 오픈·업데이트, main/develop push | 타입 체크 + 린트 |
| `labeler.yml` | PR 오픈·업데이트 | PR 제목/브랜치 기준 라벨 자동 적용 |
| `reviewdog.yml` | PR 오픈·업데이트 (src 파일 변경 시) | ESLint 결과 인라인 코멘트 |
| `issue-labeler.yml` | 이슈 생성·수정 | 이슈 제목 기준 라벨 자동 적용 |

---

## 규칙 기준 문서

- PR/브랜치/라벨 규칙은 `.github/CONVENTIONS.md`를 따릅니다.
- 이 문서에는 규칙 자체를 중복 기재하지 않고, 자동화 동작만 설명합니다.

## 자동화별 동작 요약

### Labeler (`.github/workflows/labeler.yml`)

- PR 제목/브랜치명을 기준으로 라벨을 자동 적용합니다.
- 실제 매핑 규칙은 `.github/labeler.yml`에 정의됩니다.

### Issue Labeler (`.github/workflows/issue-labeler.yml`)

- 이슈 제목 prefix(`feat:`, `fix:` 등)와 매칭되는 라벨을 자동 적용합니다.
- 템플릿 기반 라벨(`bug`/`feature`)과 함께 동작할 수 있습니다.

### CI (`.github/workflows/ci.yml`)

- `main`/`develop` 대상 `push`, `pull_request`에서 실행됩니다.
- 수행 항목:
  - Type check: `pnpm exec tsc --noEmit`
  - Lint: `pnpm lint`

### Reviewdog (`.github/workflows/reviewdog.yml`)

- `src/**/*.ts`, `src/**/*.tsx` 변경이 있는 PR에서 실행됩니다.
- ESLint 결과를 PR 인라인 리뷰 코멘트로 남깁니다.
- `fail_level: none`이므로 코멘트는 남기되 머지를 직접 차단하지는 않습니다.

---

## Dependabot

매주 월요일 오전 9시(KST)에 의존성 업데이트 PR을 자동으로 생성합니다.

### 업데이트 범위

| 패키지 | 허용 범위 |
|---|---|
| `expo`, `react-native` | 패치만 (`x.x.1`) |
| `react`, `nativewind`, `tailwindcss` | 패치 + 마이너 |
| 나머지 (`zustand`, `react-query` 등) | 전부 허용 |

### PR 처리 기준

| 업데이트 종류 | 예시 | 처리 방법 |
|---|---|---|
| 패치 (`x.x.0 → x.x.1`) | zustand 5.0.13 → 5.0.14 | CI 통과 후 우선 머지 |
| 마이너 (`x.0.x → x.1.x`) | react-query 5.100 → 5.101 | 변경사항 확인 후 머지 |
| 메이저 (`1.x.x → 2.x.x`) | expo 54 → 56 | 테스트 브랜치에서 검증 후 머지 |

### Dependabot 명령어

Dependabot PR에 댓글로 아래 명령어를 입력할 수 있습니다.

| 명령어 | 설명 |
|---|---|
| `@dependabot rebase` | 최신 main 기준으로 PR 브랜치 재정렬 |
| `@dependabot recreate` | PR을 처음부터 다시 생성 |
| `@dependabot merge` | CI 통과 시 자동 머지 |
| `@dependabot ignore this major version` | 해당 메이저 버전 업데이트 무시 |
| `@dependabot ignore this minor version` | 해당 마이너 버전 업데이트 무시 |

---

## CI 실패 시 대응

### Type Check & Lint 실패

```bash
# 로컬에서 확인
pnpm exec tsc --noEmit   # 타입 에러 확인
pnpm lint                # 린트 에러 확인
```

에러 수정 후 커밋하면 CI가 자동으로 재실행됩니다.

### lockfile 불일치

```bash
pnpm install --no-frozen-lockfile
git add pnpm-lock.yaml
git commit -m "chore: pnpm-lock.yaml 동기화"
git push
```

### Reviewdog 실패

`src/` 파일 변경이 없는 PR(예: Dependabot PR)에서는 Reviewdog가 자동으로 스킵됩니다.  
Reviewdog가 실패해도 머지를 막지는 않습니다 (`fail_level: none`).

---

## 관련 참고 문서

- 브랜치/PR/라벨 규칙: `.github/CONVENTIONS.md`
- 프로젝트 온보딩/실행: `README.md`
- 팀 AI 협업 표준: `docs/ai/README.md`
