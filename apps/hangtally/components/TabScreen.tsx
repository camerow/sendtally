import React from "react";
import { ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../theme/ThemeContext";
import { TabHeader } from "./TabHeader";

export type TabScreenProps = { children: React.ReactNode; gap?: number };

export function TabScreen({ children, gap = 22 }: TabScreenProps): React.ReactElement {
  const c = useTheme();
  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: c.ground }}>
      <TabHeader />
      <ScrollView
        contentContainerStyle={{ gap, paddingTop: 6, paddingHorizontal: 20, paddingBottom: 28 }}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}
