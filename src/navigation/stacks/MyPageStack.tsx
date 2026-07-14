import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MyPageScreen from '@/screens/mypage/MyPageScreen';
import UserProfileScreen from '@/screens/mypage/UserProfileScreen';
import SettingScreen from '@/screens/mypage/SettingScreen';
import NotificationScreen from '@/screens/mypage/NotificationScreen';
import ProfileEditScreen from '@/screens/mypage/ProfileEditScreen';
import FollowScreen from '@/screens/mypage/FollowScreen';
import MyPhotosScreen from '@/screens/mypage/MyPhotosScreen';
import MyReviewsScreen from '@/screens/mypage/MyReviewsScreen';
import PhotoMapScreen from '@/screens/mypage/PhotoMapScreen';

export type MyPageStackParamList = {
  MyPage: undefined;
  UserProfile: { userId: string };
  Setting: undefined;
  Notification: undefined;
  ProfileEdit: undefined;
  Follow: { initialTab: 'followers' | 'following' };
  MyPhotos: undefined;
  MyReviews: undefined;
  PhotoMap: undefined;
};

const Stack = createNativeStackNavigator<MyPageStackParamList>();

export default function MyPageStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MyPage" component={MyPageScreen} />
      <Stack.Screen name="UserProfile" component={UserProfileScreen} />
      <Stack.Screen name="Setting" component={SettingScreen} />
      <Stack.Screen name="Notification" component={NotificationScreen} />
      <Stack.Screen name="ProfileEdit" component={ProfileEditScreen} />
      <Stack.Screen name="Follow" component={FollowScreen} />
      <Stack.Screen name="MyPhotos" component={MyPhotosScreen} />
      <Stack.Screen name="MyReviews" component={MyReviewsScreen} />
      <Stack.Screen name="PhotoMap" component={PhotoMapScreen} />
    </Stack.Navigator>
  );
}
