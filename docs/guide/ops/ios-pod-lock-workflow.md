# iOS Podfile.lock 운영 가이드

`pnpm ios` 실행 시 `ios/Podfile.lock`이 자동 변경되는 상황을 팀에서 일관되게 처리하기 위한 문서입니다.

## 선행 조건: `bundle install` (필수)

CocoaPods 버전은 루트 `Gemfile`에 고정되어 있습니다(cocoapods 1.17.0, xcodeproj 1.28.1). **최초 1회 `bundle install`을 실행해야** 고정이 적용됩니다(Ruby 3.2+ 필요).

건너뛰면 `pnpm ios`가 **경고 없이** 시스템 `pod`으로 폴백해 각자의 버전으로 pod을 돌리고, 아래에서 말하는 lockfile noise가 그대로 되살아납니다. 즉 **이 문서의 noise 처리 절차를 자주 쓰게 된다면 `bundle install`을 건너뛴 것이 원인일 가능성이 높습니다.** 실행 경로 확인은 `EXPO_DEBUG=1 pnpm ios` 로그의 `> bundle exec pod install` 줄로.

### `bundle install` 직후 1회는 `bundle exec pod install`도 수동 실행

이전에 다른 pod 버전으로 빌드한 적이 있다면 `ios/Pods/Manifest.lock`에 그 버전이 박혀 있어, 고정 버전으로 바꾼 뒤 첫 빌드가 아래처럼 실패합니다.

```
error: The sandbox is not in sync with the Podfile.lock. Run 'pod install' or update your CocoaPods installation.
```

`expo run:ios`는 `ios/Pods/`가 이미 있으면 `pod install`을 건너뛰므로 스스로 복구하지 못합니다. `bundle exec pod install`을 한 번 직접 실행해 샌드박스를 맞춰주세요. 이때 `ios/Podfile.lock`·`project.pbxproj`는 변하지 않아야 정상입니다(변한다면 pod 버전 고정이 안 걸린 것). 진단은 아래 두 줄 비교:

```bash
grep 'COCOAPODS:' ios/Podfile.lock ios/Pods/Manifest.lock
```

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
  - `git diff feature/course -- ios/Podfile.lock`
  - `git diff --name-status feature/course...HEAD`
- 브랜치 커밋 차이는 없고 워킹트리에서만 `Podfile.lock`이 달라졌다면, 로컬 자동 동기화 변경일 가능성이 큽니다.

## 자주 쓰는 명령어

```bash
# 변경 확인
git status
git diff -- ios/Podfile.lock

# 원본 브랜치 기준 비교
git diff feature/course -- ios/Podfile.lock

# 불필요한 자동 변경 되돌리기 (상시 처방이 아니라 예외 처리 — 위 '선행 조건' 참고)
git restore ios/Podfile.lock .claude/launch.json
```

## 환경 정렬

- Node 버전은 `.nvmrc` 기준으로 통일합니다.
- **CocoaPods 버전은 루트 `Gemfile`로 고정**되어 있습니다(위 '선행 조건' 참고). 버전 차이로 인한 lockfile noise는 여기서 차단됩니다.
- 단, `Gemfile.lock`의 `RUBY VERSION` / `BUNDLED WITH` 2줄은 각자의 ruby·bundler 버전에 따라 갱신될 수 있습니다. 기능과 무관한 이 2줄 변경은 커밋하지 않습니다(bundler 2.6 미만에서는 `CHECKSUMS` 블록까지 사라질 수 있으니, 그 경우도 커밋 대상이 아닙니다).
- `git restore Gemfile.lock`은 **`GEM` / `PLATFORMS` / `DEPENDENCIES` 섹션에 변경이 없을 때만** 사용합니다. 파일 전체를 되돌리므로, 의존성 변경이 섞여 있으면 그것까지 날아갑니다. `git diff -- Gemfile.lock`으로 먼저 확인하고, 의존성 변경이 있다면 그 부분은 그대로 두고 커밋하세요(`CHECKSUMS` 유무만으로 메타데이터 변경이라고 판단하지 않습니다).
- 가능한 한 `pod update` 대신 `bundle exec pod install` 중심으로 운영합니다.
