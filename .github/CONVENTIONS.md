# Frontend Conventions

이 문서는 이 레포의 브랜치/PR/라벨 기본 규칙을 정리합니다.

## Branch Naming

- `feature/<short-description>`
- `fix/<short-description>` 또는 `bugfix/<short-description>`
- `refactor/<short-description>`
- `style/<short-description>`
- `chore/<short-description>`
- `docs/<short-description>`
- `test/<short-description>`

예시:

- `feature/login-screen`
- `fix/token-refresh`
- `chore/update-eslint-config`

## PR Title Convention

PR 제목은 아래 prefix 중 하나로 시작합니다.

- `feat: ...`
- `fix: ...`
- `refactor: ...`
- `style: ...`
- `chore: ...`
- `docs: ...`
- `test: ...`

scope가 필요하면 아래 형식을 사용합니다.

- `feat(auth): add social login button`
- `fix(api): handle empty response`

## Label Rules

`labeler` workflow가 PR 제목/브랜치명을 기준으로 자동 라벨을 적용합니다.

- `feat` / `feature/*` -> `feature`
- `fix` / `bugfix` / `fix/*` / `bugfix/*` -> `bug`
- `refactor` / `refactor/*` -> `refactor`
- `style` / `style/*` -> `style`
- `chore` / `chore/*` -> `chore`
- `docs` / `docs/*` -> `docs`
- `test` / `test/*` -> `test`

## PR Template Guideline

PR 작성 시 아래 항목을 반드시 채웁니다.

- 개요
- 관련 이슈 (예: `Closes #123`)
- 작업 내용
- 테스트 방법
- 스크린샷 (UI 변경 시)
- 체크리스트

## CI Checks

`main`/`develop` 대상 `push` 및 `pull_request`에서 CI가 자동 실행됩니다.

- Type check: `pnpm exec tsc --noEmit`
- Lint: `pnpm lint`

## Dependency Sync After Pull

`post-merge` hook(Husky)을 사용합니다.

- `git pull` 이후 `pnpm-lock.yaml` 또는 `package.json`이 바뀌면 자동으로 `pnpm install --frozen-lockfile` 실행
- 두 파일이 바뀌지 않으면 설치를 자동으로 건너뜀

## Merge Checklist

머지 전 아래를 확인합니다.

- CI 통과
- 셀프 리뷰 완료
- 필요한 문서/주석 업데이트 완료
