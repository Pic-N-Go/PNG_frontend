# iOS Podfile.lock 운영 가이드

`pnpm ios` 실행 시 `ios/Podfile.lock`이 자동 변경되는 상황을 팀에서 일관되게 처리하기 위한 문서입니다.

## 왜 바뀌는가

- `pnpm ios` (`expo run:ios`) 과정에서 내부적으로 CocoaPods 설치/동기화가 수행됩니다.
- 이때 `ios/Podfile.lock`이 재생성/갱신될 수 있습니다.
- 즉, `pnpm install` 자체보다 `pod install` 단계에서 lockfile 변경이 주로 발생합니다.

## 팀 원칙

- `ios/Podfile.lock`은 Git 추적 대상이며, iOS 의존성 재현성을 위해 관리합니다.
- 기능과 무관한 lockfile 변경은 커밋하지 않습니다.
- 네이티브 의존성 추가/업데이트에 따른 lockfile 변경은 커밋합니다.
- PR에 `Podfile.lock` 변경이 포함되면 변경 이유를 반드시 남깁니다.

## 개발 플로우

1. 최신 기준 브랜치(`main` 또는 작업 원본 브랜치) pull
2. `pnpm install`
3. 필요 시 `pnpm ios` 실행
4. 작업 전/후 diff 확인 (`git status`, `git diff`)
5. 불필요한 자동 변경 제거 후 커밋

## 커밋 기준

### 커밋해야 하는 경우

- `package.json`에서 네이티브 모듈 버전이 변경되었고, 그 결과 `Podfile.lock`이 갱신된 경우
- 새 기능이 iOS 네이티브 의존성 추가/변경을 실제로 요구하는 경우

### 커밋하지 않는 경우

- 현재 작업과 무관하게 `pnpm ios` 실행만으로 발생한 noise 변경
- 팀 공유 필요가 없는 로컬 설정 파일 변경 (예: `.claude/launch.json`)

> ⚠️ 단, `package.json`에 이미 선언된 의존성인데 `Podfile.lock`에 해당 pod가 없다면 noise가 아니라 **누락**입니다. 이 경우엔 반드시 커밋하세요. (`git diff <base-branch> -- package.json`으로 새로 추가/기존 선언된 네이티브 패키지인지 먼저 확인)

## 브랜치 기준 확인 방법

- 현재 브랜치가 `feature/course-v2`, 원본이 `feature/course`라면 `feature/course` 기준으로 비교합니다.
- 예시:
  - `git diff -- feature/course -- ios/Podfile.lock`
  - `git diff --name-status feature/course...HEAD`
- 브랜치 커밋 차이는 없고 워킹트리에서만 `Podfile.lock`이 달라졌다면, 로컬 자동 동기화 변경일 가능성이 큽니다.

## 자주 쓰는 명령어

```bash
# 변경 확인
git status
git diff -- ios/Podfile.lock

# 원본 브랜치 기준 비교
git diff -- feature/course -- ios/Podfile.lock

# 불필요한 자동 변경 되돌리기
git restore ios/Podfile.lock .claude/launch.json
```

## 환경 정렬 권장사항

- Node 버전은 `.nvmrc` 기준으로 통일합니다.
- 팀 내 CocoaPods/Xcode 버전 차이가 lockfile noise를 만들 수 있으므로 환경 버전 공유를 권장합니다.
- 가능한 한 `pod update` 대신 `pod install` 중심으로 운영합니다.
