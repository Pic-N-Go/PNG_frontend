# GitHub 자동화 가이드

> 이 레포에 설정된 GitHub Actions 및 자동화 규칙을 정리합니다.  
> 팀원 모두가 참고할 수 있도록 작성되었습니다.

---

## 워크플로우 목록

| 파일 | 실행 조건 | 역할 |
|---|---|---|
| `ci.yml` | PR 오픈·업데이트, main/develop push | 타입 체크 + 린트 |
| `labeler.yml` | PR 오픈·업데이트 | PR 제목/브랜치 기준 라벨 자동 적용 |
| `gemini-review.yml` | PR 오픈·업데이트 (main/develop 대상) | Gemini AI 코드 리뷰 코멘트 |
| `reviewdog.yml` | PR 오픈·업데이트 (src 파일 변경 시) | ESLint 결과 인라인 코멘트 |
| `issue-labeler.yml` | 이슈 생성·수정 | 이슈 제목 기준 라벨 자동 적용 |

---

## PR 작성 규칙

### 제목 prefix

PR 제목은 아래 prefix 중 하나로 시작합니다. prefix에 따라 라벨이 자동으로 붙습니다.

| prefix | 라벨 | 사용 시점 |
|---|---|---|
| `feat:` | feature | 새 기능 추가 |
| `fix:` | bug | 버그 수정 |
| `refactor:` | refactor | 기능 변화 없는 코드 개선 |
| `style:` | style | UI/스타일 변경 |
| `chore:` | chore | 설정, 의존성, 기타 잡무 |
| `docs:` | docs | 문서 수정 |
| `test:` | test | 테스트 추가·수정 |

scope가 필요한 경우 `feat(auth): 소셜 로그인 추가` 형식으로 작성합니다.

> 라벨은 PR 생성 후 labeler 워크플로우가 자동으로 적용합니다. 직접 선택하지 않아도 됩니다.

---

## 이슈 작성 규칙

이슈 작성 시 **버그 리포트** / **기능 요청** 템플릿 중 하나를 선택합니다.  
빈 이슈는 비활성화되어 있습니다.

- 템플릿 선택 시 라벨(`bug` / `feature`)이 자동 적용됩니다.
- 이슈 제목을 PR과 동일한 prefix로 작성하면 라벨이 자동 적용됩니다.

PR에 이슈를 연결하려면 PR 본문에 아래처럼 작성합니다.

```
Closes #이슈번호
```

PR 머지 시 연결된 이슈가 자동으로 닫힙니다.

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
| 패치 (`x.x.0 → x.x.1`) | zustand 5.0.13 → 5.0.14 | 바로 머지 |
| 마이너 (`x.0.x → x.1.x`) | react-query 5.100 → 5.101 | 릴리즈 노트 확인 후 머지 |
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

### pnpm-lock.yaml 불일치

```bash
pnpm install --no-frozen-lockfile
git add pnpm-lock.yaml
git commit -m "chore: pnpm-lock.yaml 동기화"
git push
```

### Gemini / Reviewdog 실패

`src/` 파일 변경이 없는 PR(예: Dependabot PR)에서는 Reviewdog가 자동으로 스킵됩니다.  
Gemini나 Reviewdog가 실패해도 머지를 막지는 않습니다 (`fail_level: none`).

---

## 브랜치 upstream 설정

로컬에서 새 브랜치를 만들고 push한 경우 아래 명령어로 upstream을 설정합니다.

```bash
git branch --set-upstream-to=origin/<브랜치명> <브랜치명>
```

설정 후에는 `git pull`만으로 최신 변경사항을 받을 수 있습니다.
