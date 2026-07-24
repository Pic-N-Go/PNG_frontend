# PR Drafts

`/png-pr` 커맨드는 PR 제목/본문 초안을 만들어 사용자에게 승인받은 뒤, 승인 시 현재 브랜치에 실제 PR(`gh pr create`)까지 생성합니다.

이 폴더는 사용자가 **보류**(수정 없이 파일로만 남기기)를 선택했을 때만 초안이 저장되는 곳입니다. 승인해서 PR이 실제로 생성되면 임시 초안 파일은 자동으로 정리되므로, 이 폴더에 남아 있는 파일은 "아직 PR로 올리지 않은" 초안입니다.

- 기본 생성 경로(보류 시): `docs/ai/pr-drafts/<branch>-pr.md`
- 사용자 지정 생성: `/png-pr <draft-file-name>`
- 삭제: `/png-pr-clean <draft-file-name 또는 경로>`
