import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MyPageScreen from '@/screens/mypage/MyPageScreen';
import UserProfileScreen from '@/screens/mypage/UserProfileScreen';
import SettingScreen from '@/screens/mypage/SettingScreen';
import BookmarkedSpotListScreen from '@/screens/mypage/BookmarkedSpotListScreen';
import NotificationScreen from '@/screens/mypage/NotificationScreen';
import InquiryListScreen from '@/screens/mypage/InquiryListScreen';
import InquiryDetailScreen from '@/screens/mypage/InquiryDetailScreen';
import ComposeInquiryScreen from '@/screens/mypage/ComposeInquiryScreen';
import FAQScreen from '@/screens/mypage/FAQScreen';
import TermsOfServiceScreen from '@/screens/mypage/TermsOfServiceScreen';
import PrivacyPolicyScreen from '@/screens/mypage/PrivacyPolicyScreen';
import OpenSourceLicensesScreen from '@/screens/mypage/OpenSourceLicensesScreen';
import ProfileEditScreen from '@/screens/mypage/ProfileEditScreen';
import FollowScreen from '@/screens/mypage/FollowScreen';
import MyPhotosScreen from '@/screens/mypage/MyPhotosScreen';
import MyPostsScreen from '@/screens/mypage/MyPostsScreen';
import MyReviewsScreen from '@/screens/mypage/MyReviewsScreen';
import PhotoMapScreen from '@/screens/mypage/PhotoMapScreen';
import AdminDashboardScreen from '@/screens/admin/AdminDashboardScreen';

export type MyPageStackParamList = {
  MyPage: undefined;
  // collectionId: MY 탭 컬렉션 줄에서 그 컬렉션만 선택된 상태로 진입한다.
  BookmarkedSpotList: { collectionId?: number } | undefined;
  UserProfile: { userId: string };
  // openThemeSheet: 홈 "관심 스팟" 안내에서 바로 관심 테마 시트를 열며 진입한다.
  Setting: { openThemeSheet?: boolean } | undefined;
  ProfileEdit: undefined;
  Notification: undefined;
  Inquiry: undefined;
  InquiryDetail: { id: string };
  ComposeInquiry: undefined;
  FAQ: undefined;
  TermsOfService: undefined;
  PrivacyPolicy: undefined;
  OpenSourceLicenses: undefined;
  Follow: { initialTab: 'followers' | 'following'; userId?: number };
  MyPhotos: undefined;
  MyPosts: undefined;
  MyReviews: undefined;
  PhotoMap: undefined;
  AdminDashboard: undefined;
};

const Stack = createNativeStackNavigator<MyPageStackParamList>();

export default function MyPageStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MyPage" component={MyPageScreen} />
      <Stack.Screen name="BookmarkedSpotList" component={BookmarkedSpotListScreen} />
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
      <Stack.Screen name="Follow" component={FollowScreen} />
      <Stack.Screen name="MyPhotos" component={MyPhotosScreen} />
      <Stack.Screen name="MyPosts" component={MyPostsScreen} />
      <Stack.Screen name="MyReviews" component={MyReviewsScreen} />
      <Stack.Screen name="PhotoMap" component={PhotoMapScreen} />
      <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
    </Stack.Navigator>
  );
}
