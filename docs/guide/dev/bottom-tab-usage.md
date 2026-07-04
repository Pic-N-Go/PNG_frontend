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
import { TAB_BAR_HEIGHT, CONTENT_PADDING } from '@/constants/layout';

export default function TravelListScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        // ↓ 이 한 줄만 지키면 콘텐츠가 하단탭에 가려지지 않음
        contentContainerStyle={{ paddingBottom: TAB_BAR_HEIGHT + insets.bottom }}
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

1. **스크롤 화면 하단 여백** — 콘텐츠가 탭바에 가려지지 않게 `TAB_BAR_HEIGHT`(`src/constants/layout.ts`)만큼 패딩:
   ```tsx
   contentContainerStyle={{ paddingBottom: TAB_BAR_HEIGHT + insets.bottom }}
   ```
   (참고: [`HomeScreen.tsx`](../../../src/screens/home/HomeScreen.tsx))

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
