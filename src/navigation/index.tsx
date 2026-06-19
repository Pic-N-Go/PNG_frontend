import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AuthStack from './AuthStack';
import MainTab from './MainTab';
import SpotStack from './stacks/SpotStack';

export type RootStackParamList = {
  Main: undefined;
  SpotStack: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

// TODO: useAuthStore에서 isLoggedIn 읽어서 분기
export default function RootNavigator() {
  const isLoggedIn = false;

  return (
    <NavigationContainer>
      {isLoggedIn ? (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Main" component={MainTab} />
          <Stack.Screen name="SpotStack" component={SpotStack} />
        </Stack.Navigator>
      ) : (
        <AuthStack />
      )}
    </NavigationContainer>
  );
}
