# chore: Node 버전 로컬/CI 통일 (.nvmrc, engines 필드, CI 워크플로우 반영)

## 개요

`react-native@0.81.5`가 자체적으로 `engines.node >= 20.19.4`를 요구하는데, 이 프로젝트엔 Node 버전을 고정하는 설정이 전혀 없었습니다. 로컬 개발 환경과 CI(`node-version: 20` — 항상 최신 20.x 패치를 그때그때 받아옴)가 서로 다른 기준으로 동작할 수 있는 상태라, `.nvmrc` + `package.json engines` + CI 워크플로우가 전부 하나의 기준(`.nvmrc`)을 보도록 정리했습니다.

## 관련 이슈

없음

## 작업 내용

- [x] `.nvmrc` 추가 (`20.19.5`) — 로컬 Node 버전 기준점
- [x] `package.json`에 `"engines": { "node": ">=20.19.4" }` 추가 — `react-native` 요구사항과 동일하게 명시
- [x] `.github/workflows/ci.yml`, `.github/workflows/reviewdog.yml`의 `actions/setup-node@v4`를 `node-version: 20` → `node-version-file: '.nvmrc'`로 변경 — CI가 `.nvmrc`를 단일 기준으로 참조하도록 통일

## 테스트 방법

1. `cat .nvmrc` → `20.19.5` 확인
2. `node -v` (로컬) → `.nvmrc` 값과 일치하는지 확인 (또는 `>=20.19.4` 만족하는지)
3. `pnpm exec tsc --noEmit`, `pnpm lint` 정상 통과 확인 (Node/engines 변경이 기존 빌드에 영향 없음을 확인)
4. PR 생성 후 GitHub Actions에서 `CI`, `Reviewdog` 워크플로우가 정상적으로 트리거되고, Node 버전이 `.nvmrc` 값으로 세팅되는지 로그 확인

## 스크린샷 (UI 변경 시)

UI 변경 없음 — 섹션 삭제

## 체크리스트

- [x] 타입 에러 없음 (`tsc --noEmit`)
- [x] lint 통과 (`pnpm lint`)
- [x] 셀프 코드 리뷰 완료 (Critical 0건, Important 2건 모두 "동작상 문제 아님 — 문서화 필요" 성격으로 본 PR 설명에 반영)
- [ ] CI 통과 — TODO: PR 생성 후 확인
- [x] 문서/주석 업데이트 필요 여부 확인 (doc-sync-checker 매핑 대상 없음, None)

---

### 코드리뷰에서 나온 참고사항 (팀 공유용)

- **`.nvmrc`는 자동으로 Node 버전을 바꿔주지 않습니다.** `nvm` 사용자는 이 저장소 폴더에서 `nvm use`를 직접 실행해야 반영됩니다. 자동 전환을 원하면 각자 쉘 설정(`.zshrc` 등)에 `.nvmrc` 자동 로드 훅을 추가해야 합니다.
- **`engine-strict`는 의도적으로 켜지 않았습니다.** 지금은 버전이 안 맞아도 `pnpm install`/`pnpm start`가 경고 없이 그냥 진행됩니다 (강제 아님, 안내용). 나중에 팀 전원이 `.nvmrc` 기준으로 맞춘 게 확인되면 `.npmrc`에 `engine-strict=true`를 추가해 강제로 전환하는 걸 고려할 수 있습니다.
- **라이브러리 버전 통일은 이번 PR과 무관하게 이미 해결되어 있었습니다** — `pnpm-lock.yaml`이 git에 커밋돼 있고 `.husky/post-merge`가 `git pull` 이후 lockfile 변경을 감지해 자동으로 `pnpm install --frozen-lockfile`을 실행합니다.
