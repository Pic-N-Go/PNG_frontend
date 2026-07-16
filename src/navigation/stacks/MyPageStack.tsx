import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MyPageScreen from '@/screens/mypage/MyPageScreen';
import UserProfileScreen from '@/screens/mypage/UserProfileScreen';
import SettingScreen from '@/screens/mypage/SettingScreen';
import NotificationScreen from '@/screens/mypage/NotificationScreen';
import InquiryListScreen from '@/screens/mypage/InquiryListScreen';
import InquiryDetailScreen from '@/screens/mypage/InquiryDetailScreen';
import ComposeInquiryScreen from '@/screens/mypage/ComposeInquiryScreen';
import FAQScreen from '@/screens/mypage/FAQScreen';
import TermsOfServiceScreen from '@/screens/mypage/TermsOfServiceScreen';
import PrivacyPolicyScreen from '@/screens/mypage/PrivacyPolicyScreen';
import OpenSourceLicensesScreen from '@/screens/mypage/OpenSourceLicensesScreen';
import ProfileEditScreen from '@/screens/mypage/ProfileEditScreen';

export type MyPageStackParamList = {
  MyPage: undefined;
  UserProfile: { userId: string };
  Setting: undefined;
  ProfileEdit: undefined;
  Notification: undefined;
  Inquiry: undefined;
  InquiryDetail: { id: string };
  ComposeInquiry: undefined;
  FAQ: undefined;
  TermsOfService: undefined;
  PrivacyPolicy: undefined;
  OpenSourceLicenses: undefined;
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
      <Stack.Screen name="FAQ" component={FAQScreen} />
      <Stack.Screen name="TermsOfService" component={TermsOfServiceScreen} />
      <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
      <Stack.Screen name="OpenSourceLicenses" component={OpenSourceLicensesScreen} />
      <Stack.Screen name="ProfileEdit" component={ProfileEditScreen} />
    </Stack.Navigator>
  );
}
