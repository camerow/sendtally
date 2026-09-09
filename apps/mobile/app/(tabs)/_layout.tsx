import { useAuth } from "@clerk/clerk-expo";
import { Redirect, Tabs } from "expo-router";
import React from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, fonts, radius } from "@sendtally/design/tokens";
import { Icon, type IconName } from "../../components/Icon";

function tabIcon(name: IconName): (props: { color: string }) => React.ReactElement {
  return ({ color }) => <Icon name={name} color={color} />;
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
        tabBarActiveBackgroundColor: "rgba(64,63,76,0.08)",
        tabBarItemStyle: { borderRadius: radius.control, marginHorizontal: 4, marginVertical: 5 },
        tabBarLabelPosition: "below-icon",
        tabBarLabelStyle: { fontFamily: fonts.monoMedium, fontSize: 10, letterSpacing: 0.6 },
      }}
    >
      <Tabs.Screen
        name="sessions"
        options={{ tabBarLabel: "SESSIONS", tabBarIcon: tabIcon("sessions") }}
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
