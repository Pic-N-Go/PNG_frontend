import { useEffect, useState } from 'react';
import { Platform, PermissionsAndroid } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getMessaging, requestPermission, getToken, onTokenRefresh, AuthorizationStatus } from '@react-native-firebase/messaging';
import { useMutation } from '@tanstack/react-query';
import { notificationsApi } from '@/api/notifications';
import { useAuthStore } from '@/store/useAuthStore';

export const usePushNotifications = () => {
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const accessToken = useAuthStore((state) => state.accessToken);

  const { mutate: sendTokenToServer } = useMutation({
    mutationFn: (token: string) => notificationsApi.postToken(token, accessToken!),
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
          if (Platform.Version >= 33) {
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

    // Listen for token refresh
    const unsubscribe = onTokenRefresh(messaging, (token) => {
      setFcmToken(token);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    // If we have an FCM token and the user is logged in, send the token to the backend
    if (fcmToken && accessToken) {
      sendTokenToServer(fcmToken);
    }
  }, [fcmToken, accessToken, sendTokenToServer]);

  return { fcmToken };
};
