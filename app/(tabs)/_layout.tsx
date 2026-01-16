import { Tabs } from "expo-router";
import { Gamepad2, Trophy, ShoppingBag, Gift, ClipboardList } from "lucide-react-native";
import { View, StyleSheet } from "react-native";
import React from "react";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#0f1821',
          borderTopColor: '#2a3847',
          borderTopWidth: 1,
          height: 85,
          paddingBottom: 20,
          paddingTop: 10,
        },
        tabBarActiveTintColor: '#60a5fa',
        tabBarInactiveTintColor: '#5a6f8a',
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700' as const,
          letterSpacing: 0.5,
        },
      }}
    >
      <Tabs.Screen
        name="results"
        options={{
          title: "RESULTS",
          tabBarIcon: ({ color, size }) => <ClipboardList color={color} size={22} />,
        }}
      />
      <Tabs.Screen
        name="leaderboard"
        options={{
          title: "RANKS",
          tabBarIcon: ({ color, size }) => <Trophy color={color} size={22} />,
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: "PLAY",
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.playIconContainer, focused && styles.playIconActive]}>
              <Gamepad2 color={focused ? '#fff' : color} size={26} />
            </View>
          ),
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '800' as const,
            letterSpacing: 1,
          },
        }}
      />
      <Tabs.Screen
        name="rewards"
        options={{
          title: "REWARDS",
          tabBarIcon: ({ color, size }) => <Gift color={color} size={22} />,
        }}
      />
      <Tabs.Screen
        name="store"
        options={{
          title: "STORE",
          tabBarIcon: ({ color, size }) => <ShoppingBag color={color} size={22} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  playIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(96, 165, 250, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -8,
  },
  playIconActive: {
    backgroundColor: '#3b82f6',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
    transform: [{ scale: 1.1 }],
  },
});
