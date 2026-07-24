import { useEffect, useState } from 'react';
import { Platform, PermissionsAndroid } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  getMessaging, 
  requestPermission, 
  getToken, 
  onTokenRefresh, 
  onMessage,
  onNotificationOpenedApp,
  getInitialNotification,
  AuthorizationStatus 
} from '@react-native-firebase/messaging';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationApi } from '@/api/notification';
import { useAuthStore } from '@/store/useAuthStore';

export const usePushNotifications = (onDeepLinkNav?: (deepLink: string) => void) => {
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const accessToken = useAuthStore((state) => state.accessToken);
  const queryClient = useQueryClient();

  const { mutate: sendTokenToServer } = useMutation({
    mutationFn: (token: string) => notificationApi.postToken(token, accessToken!),
    onSuccess: () => {
      console.log('FCM token successfully registered with the server.');
    },
    onError: (err) => {
      console.error('Failed to register FCM token:', err);
    },
  });

  useEffect(() => {
    const messaging = getMessaging();

    async function requestPermissionAndGetToken() {
      try {
        let enabled = false;

        if (Platform.OS === 'android') {
          if (Number(Platform.Version) >= 33) {
            const hasPermission = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
            const hasAsked = await AsyncStorage.getItem('hasAskedPushPermission');
            
            if (!hasPermission && !hasAsked) {
              await AsyncStorage.setItem('hasAskedPushPermission', 'true');
              const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
              enabled = granted === PermissionsAndroid.RESULTS.GRANTED;
            } else {
              enabled = hasPermission;
            }
          } else {
            // 안드로이드 12 이하 기기는 기본적으로 허용됨
            enabled = true;
          }
        } else {
          const authStatus = await requestPermission(messaging);
          enabled =
            authStatus === AuthorizationStatus.AUTHORIZED ||
            authStatus === AuthorizationStatus.PROVISIONAL;
        }

        if (enabled) {
          console.log('Notification permission granted.');
          // getToken returns the FCM token
          const token = await getToken(messaging);
          setFcmToken(token);
        } else {
          console.log('Notification permission denied.');
        }
      } catch (error) {
        console.error('Failed to request permission or get FCM token:', error);
      }
    }

    requestPermissionAndGetToken();

    // 1. FCM 토큰 갱신 리스너
    const unsubscribeTokenRefresh = onTokenRefresh(messaging, (token) => {
      setFcmToken(token);
    });

    // 2. 포그라운드 알림 수신 시
    const unsubscribeForegroundMessage = onMessage(messaging, async (remoteMessage) => {
      console.log('Foreground Push Received:', remoteMessage);
      // 포그라운드 수신 시 알림 쿼리 무효화 (알림 목록 자동 최신화)
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    });

    // 3. 백그라운드 상태에서 상단 알림 터치 시
    const unsubscribeNotificationOpened = onNotificationOpenedApp(messaging, (remoteMessage) => {
      console.log('Notification Opened App from background:', remoteMessage);
      const deepLink = remoteMessage.data?.deepLink || remoteMessage.data?.link;
      if (deepLink && typeof deepLink === 'string' && onDeepLinkNav) {
        onDeepLinkNav(deepLink);
      }
    });

    // 4. 완전 종료 상태에서 상단 알림 터치로 앱 실행 시
    getInitialNotification(messaging).then((remoteMessage) => {
      if (remoteMessage) {
        console.log('Notification Opened App from quit state:', remoteMessage);
        const deepLink = remoteMessage.data?.deepLink || remoteMessage.data?.link;
        if (deepLink && typeof deepLink === 'string' && onDeepLinkNav) {
          onDeepLinkNav(deepLink);
        }
      }
    });

    return () => {
      unsubscribeTokenRefresh();
      unsubscribeForegroundMessage();
      unsubscribeNotificationOpened();
    };
  }, [queryClient, onDeepLinkNav]);

  useEffect(() => {
    // If we have an FCM token and the user is logged in, send the token to the backend
    if (fcmToken && accessToken) {
      sendTokenToServer(fcmToken);
    }
  }, [fcmToken, accessToken, sendTokenToServer]);

  return { fcmToken };
};
