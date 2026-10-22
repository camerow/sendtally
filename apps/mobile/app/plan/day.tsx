import { useLocalSearchParams } from "expo-router";
import React from "react";
import { ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "@sendtally/design/tokens";
import { PlanDayScreen } from "../../features/training/calendar/PlanDayScreen";
import { HangDataProvider } from "../../features/training/data/HangDataProvider";

export default function PlanDayRoute(): React.ReactElement {
  const { date } = useLocalSearchParams<{ date: string }>();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.white }} edges={["top"]}>
      <HangDataProvider>
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 18, paddingTop: 8, paddingBottom: 32 }}
        >
          <PlanDayScreen date={date} />
        </ScrollView>
      </HangDataProvider>
    </SafeAreaView>
  );
}
