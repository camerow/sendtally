import { useAuth } from "@clerk/clerk-expo";
import { Redirect, Tabs } from "expo-router";
import React from "react";
import { Pressable, type StyleProp, type ViewStyle } from "react-native";
import { colors, fonts, radius } from "@sendtally/design/tokens";
import { Icon, type IconName } from "../../components/Icon";

type TabButtonProps = Omit<React.ComponentProps<typeof Pressable>, "style" | "ref"> & {
  style?: StyleProp<ViewStyle>;
};

function TabButton(props: TabButtonProps): React.ReactElement {
  const selected = props["aria-selected"] === true;
  return (
    <Pressable
      {...props}
      style={[
        props.style,
        {
          marginHorizontal: 4,
          marginVertical: 5,
          borderRadius: radius.control,
          backgroundColor: selected ? "rgba(64,63,76,0.08)" : "transparent",
        },
      ]}
    />
  );
}

function tabIcon(name: IconName): (props: { color: string }) => React.ReactElement {
  return ({ color }) => <Icon name={name} color={color} />;
}

export default function TabsLayout(): React.ReactElement | null {
  const { isLoaded, isSignedIn } = useAuth();
  if (!isLoaded) return null;
  if (!isSignedIn) return <Redirect href="/sign-in" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surfaceSoft,
          borderTopColor: colors.lineOnLight,
          borderTopWidth: 1,
        },
        tabBarActiveTintColor: colors.gunmetal,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelPosition: "below-icon",
        tabBarLabelStyle: { fontFamily: fonts.monoMedium, fontSize: 10, letterSpacing: 0.6 },
        tabBarButton: TabButton,
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
