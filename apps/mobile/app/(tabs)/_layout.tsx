import { useAuth } from "@clerk/clerk-expo";
import { Redirect, Tabs } from "expo-router";
import React from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BottomTabBar } from "expo-router/tabs";
import { t } from "@sendtally/features/i18n";
import { useTrainingMode } from "@sendtally/features/settings";
import { colors, fonts } from "@sendtally/design/tokens";
import { Icon, type IconName } from "../../components/Icon";
import { LiveBar } from "../../features/live-session/LiveBar";
import { useApi } from "../../lib/api";

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
  if (!isLoaded) return null;
  if (!isSignedIn) return <Redirect href="/sign-in" />;
  return <SignedInTabs />;
}

function SignedInTabs(): React.ReactElement {
  const insets = useSafeAreaInsets();
  const training = useTrainingMode(useApi()).enabled;
  const only = (on: boolean): { href?: null } => (on ? {} : { href: null });

  return (
    <Tabs
      tabBar={(props) => (
        <View>
          <LiveBar />
          <BottomTabBar {...props} />
        </View>
      )}
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
        tabBarLabelStyle: {
          fontFamily: fonts.monoMedium,
          fontSize: 10,
          letterSpacing: 0.6,
          textTransform: "uppercase",
        },
      }}
    >
      <Tabs.Screen
        name="today"
        options={{
          ...only(training),
          tabBarLabel: t("training.today"),
          tabBarIcon: tabIcon("today"),
        }}
      />
      <Tabs.Screen
        name="sessions"
        options={{ tabBarLabel: t("journal.log"), tabBarIcon: tabIcon("sessions") }}
      />
      <Tabs.Screen
        name="climbs"
        options={{ tabBarLabel: t("climbs.title"), tabBarIcon: tabIcon("climbs") }}
      />
      <Tabs.Screen
        name="train"
        options={{
          ...only(training),
          tabBarLabel: t("training.train"),
          tabBarIcon: tabIcon("train"),
        }}
      />
    </Tabs>
  );
}
