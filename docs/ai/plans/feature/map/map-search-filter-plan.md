# 구현 계획 - 지도 검색/필터 및 편의 기능 고도화

## 1) 입력 스펙

- 스펙 문서: `docs/ai/specs/feature/map/map-search-filter.md`
- 관련 도메인: `search`, `spot`
- 관련 목업: `src/components/ui/home/map.html`, `src/components/ui/home/home.html`
- 완료 목표: 목업 시안과 일치하는 검색/필터 컴포넌트 개선, FilterBottomSheet 모달 연동, 줌 인/아웃 컨트롤 및 내 위치 탐색 버튼 WebView 연동 구현

## 2) 구현 전략

- **검색 및 필터 UI**:
  - `MapScreen.tsx` 내부의 상단 오버레이 레이아웃을 수정하여 목업의 둥근 모서리, 흰색 배경, 그림자 처리와 스크롤 칩 디자인을 완벽히 매칭.
  - 카테고리 필터는 `CategoryFilter.tsx` 컴포넌트를 사용하고 있었으나, 목업과 완벽히 맞추기 위해 NativeWind 스타일을 미세 조정하거나 `MapScreen` 내에서 직접 칩 리스트를 렌더링하도록 커스텀 처리.
  - **상세 필터 모달**: 홈 화면과 규격을 맞춰 `FilterBottomSheet`를 임포트하고 검색 바 영역 우측에 배치. 필터링 로직 구현을 위해 선택된 필터 조건에 맞게 `spots` 배열을 동적으로 가공하여 WebView로 갱신 주입.
- **지도 컨트롤 WebView 통신**:
  - React Native 영역의 줌 인/아웃, 내 위치 버튼 터치 시, WebView 인스턴스에 `injectJavaScript`를 호출하여 WebView 내부의 카카오 맵 API를 원격 제어.
  - WebView 내 카카오 맵 전역 인스턴스 `map`을 선언하여 외부 `window` 스코프에 연결함으로써 리액트 네이티브에서 직접 메소드 호출이 가능하도록 설정.
- 리스크:
  - WebView 내 `map` 객체가 로드되기 전에 `injectJavaScript`를 호출할 경우 에러 또는 무반응 발생 가능.
- 리스크 완화:
  - WebView 로딩 여부 또는 `map` 객체 초기화 여부를 체크하거나, 로딩 완료 상태를 `onLoad` 콜백을 통해 관리.

## 3) 작업 태스크 (작게 분할)

### Task 1 - 카카오 맵 WebView 스크립트 수정 (SDK API 노출)

- 대상 파일:
  - `src/screens/home/MapScreen.tsx`
- 변경 내용:
  - WebView 내부 HTML의 `initMap` 내에서 생성된 `map` 객체를 `window.kakaoMap = map;` 형태로 바인딩하여 외부 주입 스크립트가 참조할 수 있도록 설정.
  - 내 위치(Geolocation) 처리를 위한 WebView 내부용 리스너 또는 헬퍼 함수 정의.
- 완료 조건:
  - WebView가 로드된 후 `window.kakaoMap`을 통해 지도 인스턴스 조작이 가능해야 함.
- 검증 방법:
  - 수동으로 스크립트를 주입해 지도의 레벨이 변경되는지 테스트.

### Task 2 - 우측 지도 편의 컨트롤 UI 구현

- 대상 파일:
  - `src/screens/home/MapScreen.tsx`
- 변경 내용:
  - `+` 및 `-` 버튼이 들어간 줌 컨트롤 그룹 UI 구성.
  - 내 위치 버튼 그룹 UI 구성.
  - NativeWind 스타일을 사용해 `absolute right-4 top-[160px] z-10`에 배치하고 목업 그림자 및 라운드 적용.
- 완료 조건:
  - 목업 시안의 우측 편의 기능 디자인과 동일하게 마운트되어야 함.
- 검증 방법:
  - 화면 상에 편의 버튼들이 정상적으로 노출되고 터치가 반응하는지 확인.

### Task 3 - 줌 및 내 위치 기능 연동

- 대상 파일:
  - `src/screens/home/MapScreen.tsx`
- 변경 내용:
  - `useRef`를 사용하여 WebView의 ref를 연결.
  - 줌 인 버튼 클릭 시: `map.setLevel(map.getLevel() - 1)` 실행 스크립트 주입.
  - 줌 아웃 버튼 클릭 시: `map.setLevel(map.getLevel() + 1)` 실행 스크립트 주입.
  - 내 위치 버튼 클릭 시: Geolocation API 또는 모킹 좌표를 사용해 `map.setCenter(...)` 실행 스크립트 주입.
- 완료 조건:
  - 각 버튼 클릭 시 실제 지도 화면이 확대/축소 및 이동해야 함.
- 검증 방법:
  - 기기 실행 후 버튼들을 터치하여 실시간 연동성 검증.

### Task 4 - 검색바 디자인 및 상세 필터 모달 연동

- 대상 파일:
  - `src/screens/home/MapScreen.tsx`
- 변경 내용:
  - 상단 뒤로가기 버튼 및 검색 영역의 크기, 여백, 그림자를 목업의 CSS 수치(`width: 40px`, `height: 40px`, `box-shadow` 등)에 맞추어 NativeWind 클래스로 전환.
  - 검색바 우측 영역에 `IconAdjustmentsHorizontal` 버튼 추가 및 적용된 필터 개수 배지 추가.
  - `FilterBottomSheet` 컴포넌트를 연동하여 상세 필터 모달 열기 상태(`filterVisible`) 관리.
- 완료 조건:
  - 상단 오버레이가 제공된 스크린샷 및 목업 이미지와 시각적으로 동일하고 필터 기능이 정상적으로 트리거되어야 함.
- 검증 방법:
  - 필터 클릭 시 모달이 오픈되고 필터 적용 후 개수 배지가 정상적으로 표시되는지 확인.

### Task 5 - 카테고리 필터 디자인 개선 및 마커 필터링 구현

- 대상 파일:
  - `src/screens/home/MapScreen.tsx`
- 변경 내용:
  - 카테고리 칩 선택 상태에 따른 스타일 전이를 목업의 색상 가이드라인에 맞춤.
  - 상세 필터(거리, 시간대, 날씨 등) 혹은 카테고리가 변경될 때, `spots` 데이터를 필터링하여 웹뷰 내부 지도로 전달해 마커가 리렌더링되도록 수정.
- 완료 조건:
  - 필터 및 카테고리 변경 시 화면의 마커 수가 알맞게 변경됨.
- 검증 방법:
  - 특정 태그 카테고리(예: 바다) 선택 시 해당 마커들만 남아있는지 확인.

## 4) 검증 체크포인트

- [ ] Type check 통과 (`pnpm exec tsc --noEmit`)
- [ ] Lint 통과 (`pnpm lint`)
- [ ] 줌 인/아웃 기능 및 내 위치 버튼 수동 검증 완료
- [ ] 검색/필터 UI 디테일 목업 대조 검증 완료

## 5) 롤백 계획

- 영향 파일: `src/screens/home/MapScreen.tsx`
- 되돌림 방법: `git checkout src/screens/home/MapScreen.tsx`
- 데이터 영향: 없음

## 6) PR 구성

- PR 제목(컨벤션): `feat(map): 지도 화면 검색/필터 UI 개선, 필터 모달 연동 및 줌·내위치 편의 버튼 추가`
- 변경 요약(3줄 이내):
  - 지도 화면 상단 검색창 및 카테고리 필터의 디자인을 목업 시안에 맞춰 고도화하고 상세 필터 바텀시트 연동을 완료했습니다.
  - WebView 내 카카오 맵 인스턴스를 외부 노출하고, React Native 오버레이 줌 인/아웃 버튼 및 내 위치 버튼을 추가해 연동했습니다.
  - 선택된 카테고리 및 상세 필터 조건에 매칭되는 마커만 지도상에 띄우도록 필터링 로직을 개발했습니다.
