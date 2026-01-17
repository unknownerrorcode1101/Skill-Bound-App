import { Tabs } from "expo-router";
import { Gamepad2, Trophy, ShoppingBag, Gift, ClipboardList } from "lucide-react-native";
import { View, StyleSheet } from "react-native";
import React from "react";

const TAB_NAMES = ['results', 'leaderboard', 'index', 'rewards', 'store'];

interface TabIconProps {
  color: string;
  focused: boolean;
  tabName: string;
  children: React.ReactNode;
}

function TabIconWrapper({ color, focused, tabName, children }: TabIconProps) {
  const tabIndex = TAB_NAMES.indexOf(tabName);
  const isFirst = tabIndex === 0;
  const isLast = tabIndex === TAB_NAMES.length - 1;

  return (
    <View style={styles.tabIconWrapper}>
      {focused && !isFirst && <View style={styles.leftBorder} />}
      <View style={styles.tabIconContainer}>
        {children}
      </View>
      {focused && !isLast && <View style={styles.rightBorder} />}
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
          paddingBottom: 24,
          paddingTop: 14,
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
          tabBarIcon: ({ color, focused }) => (
            <TabIconWrapper color={color} focused={focused} tabName="results">
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
            <TabIconWrapper color={color} focused={focused} tabName="leaderboard">
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
                <Gamepad2 color={focused ? '#fff' : color} size={26} />
              </View>
              {focused && <View style={styles.playRightBorder} />}
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
          tabBarIcon: ({ color, focused }) => (
            <TabIconWrapper color={color} focused={focused} tabName="rewards">
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
            <TabIconWrapper color={color} focused={focused} tabName="store">
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
    height: 32,
  },
  tabIconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  leftBorder: {
    position: 'absolute',
    left: -16,
    height: 28,
    width: 2,
    backgroundColor: '#60a5fa',
    borderRadius: 1,
  },
  rightBorder: {
    position: 'absolute',
    right: -16,
    height: 28,
    width: 2,
    backgroundColor: '#60a5fa',
    borderRadius: 1,
  },
  playTabWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playLeftBorder: {
    position: 'absolute',
    left: -20,
    height: 36,
    width: 2,
    backgroundColor: '#60a5fa',
    borderRadius: 1,
  },
  playRightBorder: {
    position: 'absolute',
    right: -20,
    height: 36,
    width: 2,
    backgroundColor: '#60a5fa',
    borderRadius: 1,
  },
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
