import { useEffect, useState } from 'react';
import messaging from '@react-native-firebase/messaging';
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
    async function requestPermissionAndGetToken() {
      try {
        const authStatus = await messaging().requestPermission();
        const enabled =
          authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
          authStatus === messaging.AuthorizationStatus.PROVISIONAL;

        if (enabled) {
          console.log('Notification permission granted.');
          // getToken returns the FCM token
          const token = await messaging().getToken();
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
    const unsubscribe = messaging().onTokenRefresh((token) => {
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
