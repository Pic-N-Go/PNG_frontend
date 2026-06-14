# Git Message Helper Skill

변경사항을 분석해 한국어 커밋 메시지 초안을 제안하고, 승인 후 커밋합니다.

## 컨텍스트 수집

- 현재 git 상태 확인
- 변경 내용(staged + unstaged) 확인
- 현재 브랜치 확인
- 최근 커밋 이력 확인

## 커밋 메시지 규칙

`.github/CONVENTIONS.md`의 PR Title Convention을 따릅니다.

타입:

- `feat`: 새 기능 추가
- `fix`: 버그 수정
- `refactor`: 기능 변화 없는 코드 개선
- `style`: UI/스타일 변경
- `chore`: 설정, 의존성, 기타 잡무
- `docs`: 문서 수정
- `test`: 테스트 추가/수정

형식:

- `타입: 한국어 요약`
- scope 필요 시 `타입(범위): 요약`

## 진행 순서

1. 변경사항을 분석해 커밋 메시지 초안을 제안만 한다. (커밋 금지)
2. 사용자에게 아래 형식으로 확인 요청한다.

```text
커밋 메시지 초안:
  feat: (작업 내용)

이대로 커밋할까요? 수정이 필요하면 알려주세요.
```

3. 사용자 승인 후 `git add` + `git commit` 실행
4. push는 하지 않는다
5. `.env`, `.env.local` 등 민감 파일은 절대 포함하지 않는다
