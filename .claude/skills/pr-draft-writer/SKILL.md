# PR Draft Writer Skill

PR을 자동 생성하지 않고, 팀 템플릿에 맞는 PR 제목/본문 초안 파일만 생성하는 스킬입니다.

## 목적

- `.github/pull_request_template.md` 형식에 맞는 PR 초안을 일관되게 생성한다.
- 리뷰어가 바로 검토 가능한 테스트 절차/체크리스트를 포함한다.
- 실제 `gh pr create`는 사용자 수동 실행으로 남긴다.

## 입력

- 현재 변경사항 (`git status`, `git diff HEAD`, `git log`)
- 필요 시 사용자 전달 컨텍스트 (`$ARGUMENTS`)

## 동작 규칙

1. `.github/pull_request_template.md`를 읽고 섹션 구조를 그대로 유지한다.
2. 변경사항 기반으로 아래를 채운다.
   - 개요
   - 관련 이슈 (없으면 `없음` 또는 TODO)
   - 작업 내용 체크박스
   - 테스트 방법 (재현 가능한 단계)
   - 스크린샷 (UI 변경 없으면 섹션 삭제, 있으면 `TODO:` 로 마킹)
   - 체크리스트 (PR 템플릿 항목 그대로 유지)
3. 불확실한 정보는 빈칸 대신 `TODO:`로 명시한다.
4. 초안 파일은 `docs/ai/pr-drafts/` 아래에 생성한다.
5. PR을 실제로 생성하거나 push하지 않는다.

## 출력 형식

1) Draft Title  
2) Draft File Path  
3) Filled Sections Summary  
4) Remaining TODOs
