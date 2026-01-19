import { Tabs } from "expo-router";
import { Gamepad2, Trophy, ShoppingBag, Sparkles, BarChart3 } from "lucide-react-native";
import { View, StyleSheet } from "react-native";
import React from "react";

interface TabIconProps {
  color: string;
  focused: boolean;
  children: React.ReactNode;
}

function TabIconWrapper({ focused, children }: TabIconProps) {
  return (
    <View style={styles.tabIconWrapper}>
      <View style={[styles.leftBorder, focused && styles.borderActive]} />
      <View style={[styles.tabIconContainer, focused && styles.tabIconContainerActive]}>
        {children}
      </View>
      <View style={[styles.rightBorder, focused && styles.borderActive]} />
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#0f1821',
          borderTopColor: '#2a3847',
          borderTopWidth: 1,
          height: 95,
          paddingBottom: 20,
          paddingTop: 10,
        },
        tabBarActiveTintColor: '#60a5fa',
        tabBarInactiveTintColor: '#5a6f8a',
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700' as const,
          letterSpacing: 0.5,
          textAlign: 'center' as const,
          marginTop: 10,
        },
      }}
    >
      <Tabs.Screen
        name="results"
        options={{
          title: "STATS",
          tabBarIcon: ({ color, focused }) => (
            <TabIconWrapper color={color} focused={focused}>
              <BarChart3 color={focused ? '#60a5fa' : color} size={20} strokeWidth={2.5} />
            </TabIconWrapper>
          ),
        }}
      />
      <Tabs.Screen
        name="leaderboard"
        options={{
          title: "RANKS",
          tabBarIcon: ({ color, focused }) => (
            <TabIconWrapper color={color} focused={focused}>
              <Trophy color={focused ? '#fbbf24' : color} size={20} strokeWidth={2.5} />
            </TabIconWrapper>
          ),
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: "PLAY",
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.playTabWrapper}>
              <View style={[styles.playLeftBorder, focused && styles.borderActive]} />
              <View style={[styles.playIconContainer, focused && styles.playIconActive]}>
                <Gamepad2 color={focused ? '#fff' : color} size={22} strokeWidth={2.5} />
              </View>
              <View style={[styles.playRightBorder, focused && styles.borderActive]} />
            </View>
          ),
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '800' as const,
            letterSpacing: 0.5,
            textAlign: 'center' as const,
            marginTop: 6,
          },
        }}
      />
      <Tabs.Screen
        name="rewards"
        options={{
          title: "SPIN",
          tabBarIcon: ({ color, focused }) => (
            <TabIconWrapper color={color} focused={focused}>
              <Sparkles color={focused ? '#f59e0b' : color} size={20} strokeWidth={2.5} />
            </TabIconWrapper>
          ),
        }}
      />
      <Tabs.Screen
        name="store"
        options={{
          title: "SHOP",
          tabBarIcon: ({ color, focused }) => (
            <TabIconWrapper color={color} focused={focused}>
              <ShoppingBag color={focused ? '#22c55e' : color} size={20} strokeWidth={2.5} />
            </TabIconWrapper>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabIconWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 32,
  },
  tabIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  tabIconContainerActive: {
    backgroundColor: 'rgba(96, 165, 250, 0.12)',
  },
  leftBorder: {
    position: 'absolute',
    left: -14,
    height: 28,
    width: 2,
    backgroundColor: 'transparent',
    borderRadius: 1,
  },
  rightBorder: {
    position: 'absolute',
    right: -14,
    height: 28,
    width: 2,
    backgroundColor: 'transparent',
    borderRadius: 1,
  },
  borderActive: {
    backgroundColor: '#60a5fa',
  },
  playTabWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playLeftBorder: {
    position: 'absolute',
    left: -18,
    height: 32,
    width: 2,
    backgroundColor: 'transparent',
    borderRadius: 1,
  },
  playRightBorder: {
    position: 'absolute',
    right: -18,
    height: 32,
    width: 2,
    backgroundColor: 'transparent',
    borderRadius: 1,
  },
  playIconContainer: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(96, 165, 250, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playIconActive: {
    backgroundColor: '#3b82f6',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 6,
  },
});
