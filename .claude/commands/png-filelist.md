---
allowed-tools: Read, Edit, AskUserQuestion, Bash(pnpm filelist), Bash(date +%F), Bash(git status:*), Bash(git diff:*)
description: filelist-data.json 진행 상태를 카테고리→파일 선택으로 갱신하고 pnpm filelist로 filelist.html 재생성
---

## 참고 스킬

- `.claude/skills/filelist-updater/SKILL.md`

## Context

- 현재 데이터: !`cat scripts/filelist-data.json`

## 실행 지침

1. `.claude/skills/filelist-updater/SKILL.md`를 Read해 동작 규칙과 출력 포맷을 확인합니다.
2. `$ARGUMENTS`에 `<rel path> 필드=값 [필드=값 ...]` 형식의 줄이 하나라도 있으면 **일괄 입력 모드**로 처리합니다 (SKILL.md 참고).
   - 각 줄을 파싱해 유효성(파일 존재 여부, uiStatus/apiStatus 값, date 형식)을 검사하고, 유효한 줄만 Edit로 한 번에 반영합니다.
   - `date`를 명시하지 않은 줄은 `date +%F`로 구한 오늘 날짜를 자동으로 채웁니다 (uiStatus/apiStatus/note 중 하나라도 바뀌는 경우에만; date만 단독으로 바꾸는 줄은 자동 채우기 대상 아님).
   - 실패한 줄은 되묻지 않고 실패 사유와 함께 결과에 표시합니다.
   - 모든 줄 처리 후 `pnpm filelist`를 **한 번만** 실행합니다.
3. `$ARGUMENTS`에 그런 줄이 없으면 **대화형 모드**로 진행합니다.
   a. Context의 JSON에서 `_how_to_update`를 제외한 키를 `/` 앞부분 기준으로 묶어 카테고리 목록을 만들고, `AskUserQuestion`으로 하나를 선택받습니다. 카테고리가 4개를 넘으면(실제 항목 3개 + 4번째 슬롯은 `더 보기`, 마지막 페이지는 `◀ 이전 단계로` — SKILL.md 참고) "Other" 자유 입력에 숨기지 않고 전부 방향키로 도달 가능하게 합니다.
   b. 선택된 카테고리에 속한 파일 목록을 `AskUserQuestion`의 options로 제시합니다 (각 option description에 현재 uiStatus/apiStatus/date/note 요약 포함), 대상 파일을 선택받습니다. 파일이 4개를 넘어도 동일하게 페이지네이션하고, `◀ 이전 단계로`는 카테고리 선택(a)으로 되돌립니다.
   c. `AskUserQuestion`으로 변경할 필드(uiStatus/apiStatus/note — date는 기본 제외, 직접 지정하고 싶을 때만 옵션에 노출, multiSelect 허용, `◀ 이전 단계로`는 파일 선택(b)으로 되돌림)를 고르게 한 뒤:
      - uiStatus/apiStatus는 `AskUserQuestion`으로 `미시작`|`진행중`|`완료` 중 하나를 고르게 합니다 (자유 입력 금지, `◀ 이전 단계로`는 필드 선택(c)으로 되돌림).
      - note는 텍스트로 새 값을 받습니다 (빈 값 허용).
      - date를 직접 지정하지 않으면 `date +%F`로 구한 오늘 날짜를 자동으로 채웁니다.
   d. Edit로 `scripts/filelist-data.json`의 해당 항목만 수정합니다. `pnpm filelist`는 아직 실행하지 않습니다.
   e. `AskUserQuestion`으로 "더 변경하시겠어요?"를 묻습니다 — `같은 카테고리에서 다른 파일`(b로), `다른 카테고리`(a로), `아니요, 마무리`(4번으로). 파일을 2개 이상 연달아 바꾸는 상황이면 일괄 입력 모드 문법(`<rel path> 필드=값 ...`, 여러 줄)으로 전환하도록 안내할 수 있습니다.
4. `pnpm filelist`를 실행합니다 (일괄 모드는 2번에서 이미 실행했으면 건너뜁니다; 대화형 모드는 "아니요, 마무리"를 고른 이 시점에 세션당 정확히 한 번 실행).
5. `git status`로 두 파일(`scripts/filelist-data.json`, `src/html/filelist.html`) 변경을 확인하고 함께 커밋하라고 안내합니다. 커밋 자체는 사용자 승인 후에만 실행합니다.

## 출력 형식

1) 변경 내역 (세션 중 누적된 모든 파일, 파일별 필드: 이전값 → 새 값, 실패 줄은 "✗ <rel path>: <사유>")
2) pnpm filelist 실행 결과
3) 커밋 안내 (대상 파일 목록)
