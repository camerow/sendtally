import type { Tabs } from "expo-router";
import React from "react";
import { Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { t, type MessageKey } from "@sendtally/features/i18n";
import { Icon, type IconName } from "../../components/Icon";
import { Label } from "../../components/Label";
import { useTheme } from "../../theme/ThemeContext";

type TabBarProps = Parameters<NonNullable<React.ComponentProps<typeof Tabs>["tabBar"]>>[0];

const TABS: Record<string, { icon: IconName; label: MessageKey }> = {
  index: { icon: "schedule", label: "hang.tabSchedule" },
  workouts: { icon: "workouts", label: "hang.tabWorkouts" },
  trends: { icon: "trends", label: "hang.tabTrends" },
};

export function TabBar({ state, navigation }: TabBarProps): React.ReactElement {
  const c = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View
      accessibilityRole="tabbar"
      style={{
        flexDirection: "row",
        justifyContent: "space-around",
        paddingTop: 8,
        paddingHorizontal: 12,
        paddingBottom: Math.max(insets.bottom, 12),
        borderTopWidth: 1,
        borderTopColor: c.lineDark,
        backgroundColor: c.deep,
      }}
    >
      {state.routes.map((route, index) => {
        const tab = TABS[route.name];
        if (tab === undefined) return null;
        const focused = state.index === index;
        const color = focused ? c.accent : c.onDark3;
        const onPress = (): void => {
          const event = navigation.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          });
          if (!focused && !event.defaultPrevented) navigation.navigate(route.name, route.params);
        };
        return (
          <Pressable
            key={route.key}
            onPress={onPress}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            style={{ width: 90, alignItems: "center", gap: 4, paddingVertical: 6 }}
          >
            <Icon name={tab.icon} color={color} size={24} strokeWidth={1.8} />
            <Label small color={color}>
              {t(tab.label)}
            </Label>
          </Pressable>
        );
      })}
    </View>
  );
}
