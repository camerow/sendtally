import { useLocalSearchParams } from "expo-router";
import React from "react";
import { ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "@sendtally/design/tokens";
import { BackButton } from "../../components/BackButton";
import { ExerciseTrends } from "../../features/training/exercises/ExerciseTrends";

export default function ExerciseTrendScreen(): React.ReactElement {
  const { name } = useLocalSearchParams<{ name: string }>();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.white }} edges={["top"]}>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 18, paddingTop: 8, paddingBottom: 24, gap: 14 }}
      >
        <BackButton />
        <ExerciseTrends exercise={name} />
      </ScrollView>
    </SafeAreaView>
  );
}
