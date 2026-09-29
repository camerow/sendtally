import { Tabs } from "expo-router";
import React from "react";
import { TabBar } from "../../../features/tabs/TabBar";
import { useTheme } from "../../../theme/ThemeContext";

export default function TabsLayout(): React.ReactElement {
  const c = useTheme();
  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: c.ground } }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="workouts" />
      <Tabs.Screen name="trends" />
    </Tabs>
  );
}
