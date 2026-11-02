import { useLocalSearchParams } from "expo-router";
import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "@sendtally/design/tokens";
import { HangDataProvider } from "../../../features/training/data/HangDataProvider";
import { WorkoutEditScreen } from "../../../features/training/summary/WorkoutEditScreen";

export default function WorkoutEditRoute(): React.ReactElement {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.white }} edges={["top", "bottom"]}>
      <HangDataProvider>
        <WorkoutEditScreen id={id ?? ""} />
      </HangDataProvider>
    </SafeAreaView>
  );
}
