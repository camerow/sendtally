import { useLocalSearchParams } from "expo-router";
import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "@sendtally/design/tokens";
import { HangDataProvider } from "../../features/training/data/HangDataProvider";
import { WorkoutSummaryScreen } from "../../features/training/summary/WorkoutSummaryScreen";

export default function WorkoutSummaryRoute(): React.ReactElement {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.white }} edges={["top"]}>
      <HangDataProvider>
        <WorkoutSummaryScreen id={id ?? ""} />
      </HangDataProvider>
    </SafeAreaView>
  );
}
