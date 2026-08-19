import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SplashScreen from '@/screens/auth/SplashScreen';
import LoginScreen from '@/screens/auth/LoginScreen';
import SignupScreen from '@/screens/auth/SignupScreen';
import OnboardingScreen from '@/screens/auth/OnboardingScreen';
import type { TokenResponse } from '@/api/auth';

export type AuthStackParamList = {
  Splash: undefined;
  Login: undefined;
  Signup: undefined;
  /**
   * 소셜 신규 가입자만 들어온다. accessToken을 스토어에 넣지 않고 파라미터로 들고 오는 이유는,
   * setAuth를 호출하는 순간 앱이 MainTab으로 전환되며 이 화면이 언마운트되기 때문이다
   * (navigation/index.tsx의 isLoggedIn 분기). 온보딩을 마친 뒤에 setAuth를 부른다.
   * 애플은 아직 미연동이라 토큰 없이 들어온다.
   */
  Onboarding: { provider: 'kakao' | 'apple'; tokens?: TokenResponse };
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

export default function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
    </Stack.Navigator>
  );
}
