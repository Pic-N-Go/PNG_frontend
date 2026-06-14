---
allowed-tools: Read, Bash(ls docs/ai/handoffs:*), Bash(rm -- docs/ai/handoffs/*)
description: PNG handoff 문서(docs/ai/handoffs) 삭제
---

## 실행 지침

1. 삭제 대상은 `docs/ai/handoffs/` 하위 파일만 허용합니다. 이 경로 밖의 파일은 절대 삭제하지 않습니다.
2. `$ARGUMENTS`를 아래 규칙으로 정규화해 삭제 경로를 결정합니다.
   - `../`가 포함된 경우: 즉시 거부하고 사용자에게 알립니다.
   - 파일명만 전달된 경우 (예: `login-flow-handoff.md`): `docs/ai/handoffs/login-flow-handoff.md`로 해석합니다.
   - 전체 경로가 전달된 경우 (예: `docs/ai/handoffs/login-flow-handoff.md`): 그대로 사용합니다.
   - 위 두 경우 모두 최종 경로가 `docs/ai/handoffs/`로 시작하는지 재확인합니다.
3. `$ARGUMENTS`가 없으면 `docs/ai/handoffs/` 목록을 보여주고 삭제할 파일을 요청합니다.
4. 삭제 실행은 반드시 `rm -- <정규화된_경로>` 형태로 수행합니다.
5. 삭제 후 어떤 파일이 삭제되었는지 결과를 보고합니다.
