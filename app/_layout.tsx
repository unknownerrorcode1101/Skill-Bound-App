// template
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { GameProvider, useGame } from "@/contexts/GameContext";
import LevelUpModal from "@/components/LevelUpModal";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerBackTitle: "Back" }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen 
        name="game" 
        options={{ 
          headerShown: false,
          presentation: 'fullScreenModal',
          animation: 'fade',
        }} 
      />
      <Stack.Screen 
        name="profile" 
        options={{ 
          headerShown: false,
          presentation: 'modal',
          animation: 'slide_from_right',
        }} 
      />
      <Stack.Screen 
        name="ballblast" 
        options={{ 
          headerShown: false,
          presentation: 'fullScreenModal',
          animation: 'fade',
        }} 
      />
      <Stack.Screen 
        name="xp" 
        options={{ 
          headerShown: false,
          presentation: 'modal',
          animation: 'slide_from_right',
        }} 
      />
      <Stack.Screen 
        name="blackjack" 
        options={{ 
          headerShown: false,
          presentation: 'fullScreenModal',
          animation: 'fade',
        }} 
      />
    </Stack>
  );
}

function AppContent() {
  const { showLevelUp, newLevel, dismissLevelUp, loadXp } = useGame();

  useEffect(() => {
    loadXp();
  }, [loadXp]);

  return (
    <>
      <GestureHandlerRootView>
        <RootLayoutNav />
      </GestureHandlerRootView>
      <LevelUpModal
        visible={showLevelUp}
        level={newLevel}
        onDismiss={dismissLevelUp}
      />
    </>
  );
}

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <GameProvider>
        <AppContent />
      </GameProvider>
    </QueryClientProvider>
  );
}
