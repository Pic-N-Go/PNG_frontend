import "./global.css";

import { useEffect } from "react";
import { useFonts } from "expo-font";
import { FugazOne_400Regular } from "@expo-google-fonts/fugaz-one";
import { QueryClientProvider } from "@tanstack/react-query";
import { StatusBar } from "expo-status-bar";
import * as ExpoSplashScreen from "expo-splash-screen";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import RootNavigator from "@/navigation";
import { queryClient } from "@/store/queryClient";
import { configureReanimatedLogger, ReanimatedLogLevel } from "react-native-reanimated";

// 폰트 로딩 동안 App이 null을 반환해 흰 화면이 뜨는 걸 막는다.
// 네이티브 스플래시(핑크+핀)를 폰트 준비될 때까지 붙잡아 둔다.
ExpoSplashScreen.preventAutoHideAsync();

configureReanimatedLogger({
  level: ReanimatedLogLevel.warn,
  strict: false, // Suppresses 'Writing to value during component render' from older libraries
});

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    "Pretendard-Regular": require("./assets/fonts/Pretendard-Regular.otf"),
    "Pretendard-Medium": require("./assets/fonts/Pretendard-Medium.otf"),
    "Pretendard-SemiBold": require("./assets/fonts/Pretendard-SemiBold.otf"),
    FugazOne_400Regular,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) ExpoSplashScreen.hideAsync();
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
          <StatusBar style="light" />
          <RootNavigator />
        </SafeAreaProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
