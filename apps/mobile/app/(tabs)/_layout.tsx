import { useAuth } from "@clerk/clerk-expo";
import { Redirect, Tabs } from "expo-router";
import React from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, fonts } from "@sendtally/design/tokens";
import { Icon, type IconName } from "../../components/Icon";

const SELECTED_RULE_HEIGHT = 3;

function tabIcon(name: IconName): (props: { focused: boolean }) => React.ReactElement {
  return function TabIcon({ focused }) {
    return (
      <View style={{ alignItems: "center", justifyContent: "center" }}>
        {focused && (
          <View
            style={{
              position: "absolute",
              top: -8,
              left: 0,
              right: 0,
              height: SELECTED_RULE_HEIGHT,
              borderRadius: 2,
              backgroundColor: colors.gold,
            }}
          />
        )}
        <Icon
          name={name}
          color={focused ? colors.gold : colors.textMuted}
          strokeWidth={focused ? 2.3 : 1.7}
        />
      </View>
    );
  };
}

export default function TabsLayout(): React.ReactElement | null {
  const { isLoaded, isSignedIn } = useAuth();
  const insets = useSafeAreaInsets();
  if (!isLoaded) return null;
  if (!isSignedIn) return <Redirect href="/sign-in" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          height: 62 + insets.bottom,
          backgroundColor: colors.surfaceSoft,
          borderTopColor: colors.lineOnLight,
          borderTopWidth: 1,
        },
        tabBarActiveTintColor: colors.gunmetal,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarItemStyle: { marginHorizontal: 4, marginVertical: 5 },
        tabBarLabelPosition: "below-icon",
        tabBarLabelStyle: { fontFamily: fonts.monoMedium, fontSize: 10, letterSpacing: 0.6 },
      }}
    >
      <Tabs.Screen
        name="sessions"
        options={{ tabBarLabel: "SESSIONS", tabBarIcon: tabIcon("sessions") }}
      />
      <Tabs.Screen
        name="projects"
        options={{ tabBarLabel: "PROJECTS", tabBarIcon: tabIcon("projects") }}
      />
      <Tabs.Screen
        name="trends"
        options={{ tabBarLabel: "TRENDS", tabBarIcon: tabIcon("trends") }}
      />
      <Tabs.Screen
        name="settings"
        options={{ tabBarLabel: "SETTINGS", tabBarIcon: tabIcon("settings") }}
      />
    </Tabs>
  );
}
