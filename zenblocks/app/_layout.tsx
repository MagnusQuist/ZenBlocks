import { useEffect } from "react";
import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useGameStore } from "../src/state/gameStore";

export default function RootLayout() {
  useEffect(() => {
    useGameStore.getState().initApp();
  }, []);

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="game" />
          <Stack.Screen name="settings" />
          <Stack.Screen name="unlocks" />
        </Stack>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}
