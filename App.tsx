import "./global.css";

import { useCallback, useState } from "react";
import { useFonts } from "expo-font";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StatusBar } from "expo-status-bar";
import { Text, View } from "react-native";
import * as SplashScreen from "expo-splash-screen";
import SplashScreenView from "@/components/SplashScreenView";

// 네이티브 스플래쉬를 앱이 준비될 때까지 유지
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

export default function App() {
  const [splashDone, setSplashDone] = useState(false);

  const [fontsLoaded] = useFonts({
    PretendardVariable: require("./assets/fonts/PretendardVariable.ttf"),
  });

  // SplashScreenView 애니메이션 완료 후 호출
  const handleSplashFinish = useCallback(async () => {
    await SplashScreen.hideAsync();
    setSplashDone(true);
  }, []);

  // 폰트 로드 전: 네이티브 스플래쉬(핑크 배경)가 그대로 유지됨
  if (!fontsLoaded) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <View className="flex-1 items-center justify-center bg-white">
        <Text className="text-xl font-bold">PNG</Text>
        <StatusBar style="auto" />
      </View>

      {/* 폰트 로드 완료 후 JS 스플래쉬로 전환, 애니메이션 재생 */}
      {!splashDone && (
        <SplashScreenView onFinish={handleSplashFinish} />
      )}
    </QueryClientProvider>
  );
}
