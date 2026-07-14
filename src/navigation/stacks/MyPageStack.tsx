import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MyPageScreen from '@/screens/mypage/MyPageScreen';
import UserProfileScreen from '@/screens/mypage/UserProfileScreen';
import SettingScreen from '@/screens/mypage/SettingScreen';
import NotificationScreen from '@/screens/mypage/NotificationScreen';
import InquiryListScreen from '@/screens/mypage/InquiryListScreen';
import InquiryDetailScreen from '@/screens/mypage/InquiryDetailScreen';
import ComposeInquiryScreen from '@/screens/mypage/ComposeInquiryScreen';

export type MyPageStackParamList = {
  MyPage: undefined;
  UserProfile: { userId: string };
  Setting: undefined;
  Notification: undefined;
  Inquiry: undefined;
  InquiryDetail: { id: string };
  ComposeInquiry: undefined;
};

const Stack = createNativeStackNavigator<MyPageStackParamList>();

export default function MyPageStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MyPage" component={MyPageScreen} />
      <Stack.Screen name="UserProfile" component={UserProfileScreen} />
      <Stack.Screen name="Setting" component={SettingScreen} />
      <Stack.Screen name="Notification" component={NotificationScreen} />
      <Stack.Screen name="Inquiry" component={InquiryListScreen} />
      <Stack.Screen name="InquiryDetail" component={InquiryDetailScreen} />
      <Stack.Screen name="ComposeInquiry" component={ComposeInquiryScreen} />
    </Stack.Navigator>
  );
}
