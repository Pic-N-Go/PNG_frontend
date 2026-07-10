# docs/guide/

오래 유지되는 기준 문서 모음. AI 작업 산출물(specs/plans/handoffs)은 `docs/ai/`에 있습니다.

## 폴더 구조

| 폴더 | 기준 질문 | 포함 문서 |
|---|---|---|
| [`dev/`](dev/README.md) | **코드를 어떻게 구현하는가?** | [development-guide.md](dev/development-guide.md) · [ui-publishing.md](dev/ui-publishing.md) · [device-support.md](dev/device-support.md) · [prompt-writing-guide.md](dev/prompt-writing-guide.md) |
| [`api/`](api/README.md) | **백엔드와 무엇을 주고받는가?** | [auth-api.md](api/auth-api.md) · [photo-upload-spec.md](api/photo-upload-spec.md) |
| [`ops/`](ops/README.md) | **팀을 어떻게 운영하는가?** | [github-actions-guide.md](ops/github-actions-guide.md) · [ios-pod-lock-workflow.md](ops/ios-pod-lock-workflow.md) · [team-assignments.md](ops/team-assignments.md) |

## 문서 메타 규칙 (선택 권장)

새 문서를 추가할 때 파일 맨 위에 아래 메타를 포함하면 관리에 도움됩니다.

```
<!-- Owner: @github-username | Last Updated: YYYY-MM-DD | Status: active | draft | deprecated -->
```

**분류 헷갈릴 때**: 각 폴더 README의 포함/제외 기준 확인 → 그래도 모호하면 `dev/`에 두고 PR에서 논의.

- 새 가이드 문서를 추가/이동/삭제할 때는 `docs/guide/README.md` 인덱스 표를 반드시 함께 갱신합니다.
