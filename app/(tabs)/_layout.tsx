import { Tabs } from "expo-router";
import { Gamepad2, Trophy, ShoppingBag, Gift, ClipboardList } from "lucide-react-native";
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
      {focused && <View style={styles.leftBorder} />}
      <View style={styles.tabIconContainer}>
        {children}
      </View>
      {focused && <View style={styles.rightBorder} />}
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
          title: "RESULTS",
          tabBarIcon: ({ color, focused }) => (
            <TabIconWrapper color={color} focused={focused}>
              <ClipboardList color={color} size={22} />
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
              <Trophy color={color} size={22} />
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
              {focused && <View style={styles.playLeftBorder} />}
              <View style={[styles.playIconContainer, focused && styles.playIconActive]}>
                <Gamepad2 color={focused ? '#fff' : color} size={22} />
              </View>
              {focused && <View style={styles.playRightBorder} />}
            </View>
          ),
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '800' as const,
            letterSpacing: 1,
            textAlign: 'center' as const,
          },
        }}
      />
      <Tabs.Screen
        name="rewards"
        options={{
          title: "REWARDS",
          tabBarIcon: ({ color, focused }) => (
            <TabIconWrapper color={color} focused={focused}>
              <Gift color={color} size={22} />
            </TabIconWrapper>
          ),
        }}
      />
      <Tabs.Screen
        name="store"
        options={{
          title: "STORE",
          tabBarIcon: ({ color, focused }) => (
            <TabIconWrapper color={color} focused={focused}>
              <ShoppingBag color={color} size={22} />
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
    height: 36,
    marginTop: -4,
  },
  tabIconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  leftBorder: {
    position: 'absolute',
    left: -18,
    height: 32,
    width: 2,
    backgroundColor: '#60a5fa',
    borderRadius: 1,
  },
  rightBorder: {
    position: 'absolute',
    right: -18,
    height: 32,
    width: 2,
    backgroundColor: '#60a5fa',
    borderRadius: 1,
  },
  playTabWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -4,
  },
  playLeftBorder: {
    position: 'absolute',
    left: -22,
    height: 36,
    width: 2,
    backgroundColor: '#60a5fa',
    borderRadius: 1,
  },
  playRightBorder: {
    position: 'absolute',
    right: -22,
    height: 36,
    width: 2,
    backgroundColor: '#60a5fa',
    borderRadius: 1,
  },
  playIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(96, 165, 250, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -2,
  },
  playIconActive: {
    backgroundColor: '#3b82f6',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
    transform: [{ scale: 1.05 }],
  },
});
