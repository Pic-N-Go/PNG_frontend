import "./global.css";

import { useFonts } from "expo-font";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StatusBar } from "expo-status-bar";
import { Text, View } from "react-native";

const queryClient = new QueryClient();

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    PretendardVariable: require("./assets/fonts/PretendardVariable.ttf"),
  });

  if (!fontsLoaded && !fontError) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <View className="flex-1 items-center justify-center bg-white">
        <Text className="text-xl font-bold">PNG</Text>
        <StatusBar style="auto" />
      </View>
    </QueryClientProvider>
  );
}
