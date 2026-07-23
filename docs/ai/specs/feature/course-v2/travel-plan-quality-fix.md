# 기능 스펙 — travel-plan-quality-fix

## 1) 기능 정보

- 기능명: 출사 계획(TravelPlanScreen) 드래그 재정렬 도입 후 잔여 품질 이슈 정리
- 담당자: 미정
- 관련 이슈: 없음 (코드 리뷰 후속 수정)
- 대상 플랫폼: iOS / Android

## 2) 문제와 목표

`TravelPlanScreen`의 스팟 순서 변경을 버튼 방식 → 드래그 방식(`react-native-sortables`)으로 교체하는 과정에서 코드 리뷰로 아래 잔여 이슈가 확인됨. 기능 자체는 정상 동작하나 아래 항목은 아직 수정되지 않은 상태.

- 해결하려는 문제:
  1. 편집 모드에서 삭제 버튼(카드 우상단)과 드래그 손잡이(`Sortable.Handle`, 카드 우측 전체)의 히트영역이 겹칠 수 있음 — 실기기 확인 필요
  2. `TravelPlanScreen.tsx`에 `text-[13px]` 등 raw pixel 폰트 사이즈가 다수 남아 있어 `CLAUDE.md`의 "폰트는 `layout.ts` 상수 또는 `normalizeFontSize` 사용" 규칙과 불일치
  3. `scrollRef.current as any` 불필요한 캐스팅 — `useAnimatedRef<ScrollView>()`로 타입이 이미 확보되어 있음
  4. 숫자 배지(`bg-black`)에 `shadow-sm`이 남아 있어 "카드는 배경색 대비로만 구분(보더·섀도우 없음)" 디자인 시스템 규칙과 불일치
  5. ~~스팟 삭제 시 `rowHeights` ref의 죽은 인덱스가 정리되지 않음~~ — **[해결됨]** 코드 리뷰(CodeRabbit)로 더 근본적인 문제가 드러나 함께 수정: `react-native-sortables`는 재정렬 시 Reanimated로 UI 스레드에서만 위치를 바꾸므로 JS 쪽 `onLayout`이 다시 호출되지 않음. 즉 인덱스 기준으로 저장한 높이는 재정렬 후 실제 스팟과 매핑이 어긋나 지도 마커 클릭 시 잘못된 위치로 스크롤될 수 있었음. `rowHeights`를 인덱스(`number`) 대신 스팟 고유 id(`string`) 기준으로 저장/조회하도록 변경, `removeSpot`에서도 해당 id 캐시를 정리하도록 수정함
- 사용자 가치: 편집 모드 조작 정확도 향상, 기기별 폰트 렌더링 일관성, 디자인 시스템 준수, 지도 마커 클릭 시 스크롤 정확도 보장
- 완료 기준(한 줄): 5개 항목 확인/수정 후 tsc + lint 통과

## 3) 범위

- 포함(In Scope):
  - `TravelPlanScreen.tsx` — 삭제 버튼/드래그 손잡이 히트영역 겹침 확인 및 필요 시 `zIndex`/`hitSlop` 조정
  - `TravelPlanScreen.tsx` — raw pixel 폰트(`text-[Npx]`) → `FONT_SM`/`FONT_XS`/`normalizeFontSize` 전환
  - `TravelPlanScreen.tsx` — `scrollRef.current as any` 캐스팅 제거
  - `TravelPlanScreen.tsx` — 숫자 배지 `shadow-sm` 제거 여부 재검토
  - [x] `TravelPlanScreen.tsx` — `rowHeights`를 스팟 id 기준 lookup으로 전환, `removeSpot` 시 정리 로직 추가
- 제외(Out of Scope):
  - 드래그 재정렬 기능 자체의 재설계 (이미 완료됨)
  - `transports` 데이터 구조 변경 (스팟 id 쌍 기반 lookup으로 이미 별도 수정 완료)
  - 신규 기능 추가

## 4) 사용자 시나리오

- 시나리오 A (히트영역 겹침):
  - Given: 편집 모드에서 스팟 카드가 보임
  - When: 카드 우상단 삭제 버튼 근처를 탭
  - Then: 드래그가 아니라 삭제 동작이 확실하게 실행됨

- 시나리오 B (폰트 반응형):
  - Given: 360dp~430dp 범위의 기기에서 출사 계획 화면 진입
  - When: 화면 전체 텍스트 확인
  - Then: 모든 텍스트가 기기 너비에 비례해 스케일링됨 (고정 픽셀 없음)

## 5) UI/UX 요구사항

- 참조 목업 파일: `src/components/ui/travel/travel-plan.html`
- 화면 전환 규칙: 변경 없음
- 빈 상태/에러 상태: 변경 없음

## 6) 데이터/API 요구사항

- 없음 (목업 데이터 기준 작업)

## 7) 상태 관리

- `rowHeights` ref 정리 로직 추가 시에도 상태 관리 구조 변경 없음 (`removeSpot` 내부 로직만 보강)

## 8) 기술 제약 체크

- [ ] NativeWind `className`만 사용 (폰트 전환 시 `style` prop 병행 — 프로젝트 내 기존 `FONT_*` 사용 패턴과 동일하게 처리)
- [x] `StyleSheet.create()` 미사용
- [x] `@/` alias 사용
- [x] 타입 정의 명확
- [ ] 디자인 토큰 준수 (숫자 배지 `shadow-sm` 재검토 대상)

## 9) 수용 기준 (Acceptance Criteria)

- [ ] AC1: 편집 모드에서 삭제 버튼 탭 시 드래그가 발동하지 않음 (실기기 확인)
- [ ] AC2: `TravelPlanScreen.tsx`에 `text-[Npx]` 형태의 raw pixel 폰트 클래스가 남아있지 않음
- [x] AC3: `scrollRef.current as any` 캐스팅이 제거되고 타입 에러 없이 `scrollTo` 호출됨
- [ ] AC4: 숫자 배지의 `shadow-sm` 유지/제거 여부가 결정되고 그에 맞게 적용됨
- [x] AC5: `rowHeights`가 스팟 id 기준으로 저장/조회되며, 재정렬·삭제 후에도 지도 마커 클릭 시 정확한 위치로 스크롤됨
- [ ] AC6: `pnpm exec tsc --noEmit` 및 `pnpm lint` 오류 없음

## 10) 테스트 시나리오

- 정상 케이스: 편집 모드 진입 → 삭제 버튼 탭 → 스팟 삭제됨 (드래그 미발동)
- 경계 케이스: 360dp 기기에서 화면 전체 텍스트 크기가 시각적으로 어색하지 않음
- 실패 케이스: tsc/lint 오류 없어야 함

## 11) 오픈 이슈 / 결정 필요

- 삭제 버튼/드래그 손잡이 히트영역이 실제로 겹치는지는 실기기 확인 전까지 미확정 — 확인 후 겹치지 않으면 AC1은 조치 불필요로 종료
- 숫자 배지 `shadow-sm`을 의도적 예외로 유지할지, 디자인 시스템 규칙대로 제거할지 디자인 판단 필요
