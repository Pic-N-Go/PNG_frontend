import React from 'react';
import { NavigationContainer, createNavigationContainerRef, type NavigatorScreenParams } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AuthStack from './AuthStack';
import MainTab from './MainTab';
import SpotStack, { type SpotStackParamList } from './stacks/SpotStack';
import CommunityDetailStack, { type CommunityDetailStackParamList } from './stacks/CommunityDetailStack';
import WishlistScreen from '@/screens/wishlist/WishlistScreen';
import WishlistSettingScreen from '@/screens/wishlist/WishlistSettingScreen';
import MapScreen from '@/screens/home/MapScreen';
import MapSearchScreen from '@/screens/search/MapSearchScreen';
import { useAuthStore } from '@/store/useAuthStore';
import { usePushNotifications } from '@/hooks/usePushNotifications';

export type RootStackParamList = {
  Main: undefined;
  SpotStack: NavigatorScreenParams<SpotStackParamList>;
  CommunityDetailStack: NavigatorScreenParams<CommunityDetailStackParamList>;
  Wishlist: undefined;
  WishlistSetting: { id?: number; wishlist?: any; spotId?: string; newSpot?: any; newWishlist?: any };
  Map: {
    source?: string;
    newSpot?: any;
    // MapSearch가 돌려주는 값 (MapStack의 Map과 동일 규약)
    searchSelectedSpot?: any;
    searchKeyword?: string;
    searchNonce?: number;
  };
  // MapScreen이 이 스택에도 등록돼 있어 검색 화면도 함께 둔다.
  // 없으면 이 스택의 Map에서 검색창을 눌렀을 때 NAVIGATE가 처리되지 않는다.
  MapSearch: undefined;
};

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

let pendingSpotId: string | null = null;
let pendingInquiryId: string | null = null;
let pendingPostId: string | null = null;
let pendingUserId: string | null = null;

function navigateToSpotDetail(spotId: string) {
  (navigationRef as any).navigate('SpotStack', {
    screen: 'SpotDetail',
    params: { id: spotId, spotId },
  });
}

function navigateToInquiryDetail(inquiryId: string) {
  (navigationRef as any).navigate('Main', {
    screen: 'MyPageTab',
    params: {
      screen: 'InquiryDetail',
      params: { id: inquiryId },
    },
  });
}

function navigateToPostDetail(postId: string) {
  (navigationRef as any).navigate('CommunityDetailStack', {
    screen: 'PostDetail',
    params: { postId: String(postId) },
  });
}

function navigateToUserProfile(userId: string) {
  (navigationRef as any).navigate('CommunityDetailStack', {
    screen: 'UserProfile',
    params: { userId: String(userId) },
  });
}

function handleDeepLinkNav(deepLink: string) {
  if (!deepLink) return;

  // 1. 1:1 문의 딥링크 (/mypage/inquiry/123 또는 inquiryId=123)
  const inquiryMatch = deepLink.match(/(?:inquiryId=|\/mypage\/inquiry\/|\/inquiry\/)(\d+)/);
  if (inquiryMatch && inquiryMatch[1]) {
    const inquiryId = inquiryMatch[1];
    const isLoggedIn = !!useAuthStore.getState().accessToken;
    if (navigationRef.isReady() && isLoggedIn) {
      navigateToInquiryDetail(inquiryId);
    } else {
      pendingInquiryId = inquiryId;
    }
    return;
  }

  // 2. 커뮤니티 게시글 딥링크 (/community/post/123 또는 postId=123)
  const postMatch = deepLink.match(/(?:postId=|\/community\/post\/|\/post\/)(\d+)/);
  if (postMatch && postMatch[1]) {
    const postId = postMatch[1];
    if (navigationRef.isReady()) {
      navigateToPostDetail(postId);
    } else {
      pendingPostId = postId;
    }
    return;
  }

  // 3. 유저 프로필 딥링크 (/users/123 또는 userId=123)
  const userMatch = deepLink.match(/(?:userId=|\/users\/)(\d+)/);
  if (userMatch && userMatch[1]) {
    const userId = userMatch[1];
    if (navigationRef.isReady()) {
      navigateToUserProfile(userId);
    } else {
      pendingUserId = userId;
    }
    return;
  }

  // 4. 스팟 딥링크
  const spotIdMatch = deepLink.match(/(?:spotId=|\/spot\/|\/wishlist\/|\/spot-alerts\/|^)(\d+)/);
  if (!spotIdMatch || !spotIdMatch[1]) return;

  const spotId = spotIdMatch[1];
  if (navigationRef.isReady()) {
    navigateToSpotDetail(spotId);
  } else {
    pendingSpotId = spotId;
  }
}

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const isLoggedIn = useAuthStore((s) => !!s.accessToken);
  const [hydrated, setHydrated] = React.useState(false);
  const [isNavReady, setIsNavReady] = React.useState(false);

  // 푸시 알림 초기화 및 토큰 갱신 훅 호출 (딥링크 이동 콜백 연결)
  usePushNotifications(handleDeepLinkNav);

  React.useEffect(() => {
    const unsub = useAuthStore.persist.onFinishHydration(() => setHydrated(true));
    if (useAuthStore.persist.hasHydrated()) setHydrated(true);
    return unsub;
  }, []);

  // 인증 완료 및 네비게이션 준비 시 대기 중인 pending deepLink가 있으면 네비게이션 실행
  React.useEffect(() => {
    if (isLoggedIn && isNavReady) {
      if (pendingInquiryId) {
        const targetInquiryId = pendingInquiryId;
        pendingInquiryId = null;
        navigateToInquiryDetail(targetInquiryId);
      } else if (pendingPostId) {
        const targetPostId = pendingPostId;
        pendingPostId = null;
        navigateToPostDetail(targetPostId);
      } else if (pendingUserId) {
        const targetUserId = pendingUserId;
        pendingUserId = null;
        navigateToUserProfile(targetUserId);
      } else if (pendingSpotId) {
        const targetSpotId = pendingSpotId;
        pendingSpotId = null;
        navigateToSpotDetail(targetSpotId);
      }
    }
  }, [isLoggedIn, isNavReady]);

  const handleContainerReady = React.useCallback(() => {
    setIsNavReady(true);
    if (isLoggedIn) {
      if (pendingInquiryId) {
        const targetInquiryId = pendingInquiryId;
        pendingInquiryId = null;
        navigateToInquiryDetail(targetInquiryId);
      } else if (pendingPostId) {
        const targetPostId = pendingPostId;
        pendingPostId = null;
        navigateToPostDetail(targetPostId);
      } else if (pendingUserId) {
        const targetUserId = pendingUserId;
        pendingUserId = null;
        navigateToUserProfile(targetUserId);
      } else if (pendingSpotId) {
        const targetSpotId = pendingSpotId;
        pendingSpotId = null;
        navigateToSpotDetail(targetSpotId);
      }
    }
  }, [isLoggedIn]);

  if (!hydrated) return null;

  return (
    <NavigationContainer ref={navigationRef} onReady={handleContainerReady}>
      {isLoggedIn ? (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Main" component={MainTab} />
          <Stack.Screen name="SpotStack" component={SpotStack} />
          <Stack.Screen name="CommunityDetailStack" component={CommunityDetailStack} />
          <Stack.Screen name="Wishlist" component={WishlistScreen} />
          <Stack.Screen name="WishlistSetting" component={WishlistSettingScreen} />
          <Stack.Screen name="Map" component={MapScreen} />
          <Stack.Screen name="MapSearch" component={MapSearchScreen} />
        </Stack.Navigator>
      ) : (
        <AuthStack />
      )}
    </NavigationContainer>
  );
}
