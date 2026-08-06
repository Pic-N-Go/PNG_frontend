# 하단탭(TabBar) 사용 가이드

**하단탭은 이미 완성돼 있어 팀원이 탭바 코드를 작성할 필요가 없습니다.** 탭바는 [`MainTab.tsx`](../../../src/navigation/MainTab.tsx)에서 `tabBar={...}`로 한 번만 렌더되고, 모든 탭 화면 아래에 자동으로 깔립니다. 활성 탭 표시(핑크색)도 React Navigation이 현재 라우트를 보고 **자동 계산**하므로 화면마다 지정할 필요가 없습니다.

## 팀원이 할 일

자기 탭의 스택 안에 화면 컴포넌트만 구현하면 됩니다. (예: 출사 화면 → `TravelStack`에 스크린 추가) 탭바·활성표시는 자동으로 따라옵니다.

## 화면 컴포넌트 작성 예시

기존 탭에 화면을 붙일 때 실제로 작성하는 코드입니다. 탭바 관련 코드는 **한 줄도 없습니다.** 스크롤 화면의 하단 여백(`paddingBottom`)만 신경 쓰면 됩니다.

```tsx
// src/screens/travel/TravelListScreen.tsx (예시)
import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CONTENT_PADDING, SPACING_LG } from '@/constants/layout';

export default function TravelListScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        // ↓ 탭바 높이를 더하지 않는다. 마지막 콘텐츠와 탭바 사이 최소 여백만 준다.
        contentContainerStyle={{ paddingBottom: SPACING_LG }}
      >
        <View style={{ paddingHorizontal: CONTENT_PADDING, paddingTop: insets.top }}>
          <Text>출사 화면 내용</Text>
        </View>
      </ScrollView>
    </View>
  );
}
```

그리고 이미 있는 스택 파일에 `<Stack.Screen>` 한 줄만 추가하면 탭바 위에 자동으로 표시됩니다. (스택 파일도 이미 존재하므로 새로 만들 필요 없음)

```tsx
// src/navigation/stacks/TravelStack.tsx — 이미 등록돼 있는 형태
<Stack.Screen name="TravelList" component={TravelListScreen} />
```

## 지켜야 할 규칙 2가지

1. **스크롤 화면 하단 여백** — `TAB_BAR_HEIGHT`도 `insets.bottom`도 **더하지 않습니다**:
   ```tsx
   contentContainerStyle={{ paddingBottom: SPACING_LG }}
   ```
   `MainTab`은 기본(non-absolute) 하단 탭 내비게이터라 화면 영역이 **이미** 탭바 높이만큼 줄어든 상태로 잡힙니다. 시스템 내비바·홈 인디케이터는 탭바 자신의 `paddingBottom: insets.bottom`(`TabBar.tsx`)이 덮습니다. 여기서 또 더하면 그만큼 죽은 공백이 두 배로 생깁니다(안드로이드 기준 128dp).

   여기서 필요한 건 마지막 콘텐츠가 탭바 경계선에 붙지 않게 하는 **최소 여백**뿐입니다.
   (참고: [`HomeScreen.tsx`](../../../src/screens/home/HomeScreen.tsx))

   > **탭바가 없는 화면은 다릅니다.** `SpotStack`·`Wishlist`·`WishlistSetting`·`Map`처럼 `MainTab`의 형제로 루트 스택에 등록된 화면(`src/navigation/index.tsx`)은 탭바를 덮으므로 아무것도 자동으로 확보되지 않습니다. 그쪽은 `paddingBottom: SPACING_LG + insets.bottom`으로 직접 인셋을 챙겨야 합니다. (참고: [`SpotDetailScreen.tsx`](../../../src/screens/spot/SpotDetailScreen.tsx))

2. **다른 탭으로 이동** — 스택 내부에서 탭 전환 시:
   ```ts
   navigation.getParent()?.navigate('MapTab' as never);
   ```
   (참고: `HomeScreen.tsx` 지도 배너 `onPress`)

## 참고: 새 탭을 추가하는 경우 (거의 없음)

탭바([`TabBar.tsx`](../../../src/components/common/TabBar.tsx))는 한 파일로 빠져 있고 `MainTab.tsx`에서 import로 한 번만 사용됩니다. 5개 탭의 스택(`HomeStack`~`MyPageStack`)도 모두 존재하므로 팀원이 복사·재작성할 파일은 없습니다.

6번째 새 탭을 추가하는 경우에만 아래 두 곳을 함께 수정하면 됩니다.

- `MainTab.tsx` — `MainTabParamList`에 라우트명 추가 + `<Tab.Screen>` 등록
- `TabBar.tsx` — `TABS` 배열에 route/label/Icon 추가 (route명이 `MainTabParamList`와 정확히 일치해야 함. 불일치 시 해당 탭은 `index === -1` 가드로 렌더 제외)

새 탭 스택은 [`MapStack.tsx`](../../../src/navigation/stacks/MapStack.tsx) 형태를 참고하세요.
