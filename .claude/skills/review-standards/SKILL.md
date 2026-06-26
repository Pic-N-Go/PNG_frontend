# Review Standards Skill

현재 변경사항을 팀 기준으로 리뷰하는 스킬입니다.

## 목적

- 규칙 위반, 회귀 위험, 테스트 누락을 조기에 식별한다.
- 감상평보다 수정 가능한 이슈 목록을 우선 제공한다.

## 리뷰 기준

- `CLAUDE.md`
- `docs/ai/03-pr-review-checklist.md`
- `.github/CONVENTIONS.md`
- `docs/guide/dev/ui-publishing.md` (UI 변경이 있을 때)
- `docs/guide/dev/device-support.md` (레이아웃/스케일링 변경이 있을 때)

## 실행 규칙

1. 먼저 현재 변경사항을 확인한다.
2. 이슈를 심각도 순으로 정리한다.
3. 각 이슈마다 아래를 포함한다.
   - 파일 경로
   - 문제 설명
   - 실제 리스크
   - 수정 제안
4. 이슈가 없으면 "주요 이슈 없음"을 명시하고 잔여 리스크/테스트 공백을 적는다.

## 심각도 기준

- **Critical**: 배포 시 데이터 손실·보안·빌드 실패 위험
- **Major**: 기준 문서 위반, 회귀 위험, 테스트 공백
- **Minor**: 일관성·가독성·유지보수성 이슈

## 출력 형식

1) Critical  
2) Major  
3) Minor  
4) Open Questions  
5) Quick Wins  
6) Final Assessment (배포 가능/보완 필요)

각 이슈 항목은 아래 4가지를 반드시 포함합니다.

- 파일 경로
- 문제 설명
- 실제 리스크
- 수정 제안
