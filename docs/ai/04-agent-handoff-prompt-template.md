# 에이전트 핸드오프 프롬프트 템플릿

아래 템플릿은 Cursor, Claude, Copilot, ChatGPT 등 어떤 도구에도 사용할 수 있는 공통 형식입니다.

---

## 공통 템플릿

```md
너는 이 레포의 프론트엔드 구현을 담당하는 시니어 엔지니어야.

반드시 아래 문서를 먼저 읽고 그 규칙을 지켜서 구현해줘:
- docs/ai/00-context.md
- docs/ai/specs/<feature-name>.md
- docs/ai/plans/<feature-name>-plan.md
- docs/guide/dev/ui-publishing.md (필요 시)

요청 작업:
- [구현할 태스크 이름/번호]

필수 제약:
- NativeWind className만 사용 (StyleSheet.create 금지)
- import는 @/ alias 사용
- API 함수는 src/api, 쿼리/뮤테이션은 src/hooks 사용
- 목업 구조와 화면 흐름 유지

작업 방식:
1) 먼저 변경 파일 목록과 구현 순서를 제시
2) 그 다음 실제 코드 변경
3) 마지막에 검증 결과를 아래 형식으로 보고
   - tsc:
   - lint:
   - 수동 테스트:
   - 남은 리스크:
```

---

## 빠른 사용 예시

```md
요청 작업:
- Task 2 - API/Hook 연결

대상 기능:
- docs/ai/specs/login-flow.md
- docs/ai/plans/login-flow-plan.md
```

---

## 템플릿 작성 시 참고 문서

- 팀 표준 진행 순서: `docs/ai/README.md`
- 개인 프롬프트 보조: `docs/guide/dev/prompt-writing-guide.md`
- 화면 상세 흐름: `docs/guide/dev/ui-publishing.md`
- 요구사항 정제(Intake): `docs/ai/05-intake-workflow.md`
