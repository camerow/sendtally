import { useLocalSearchParams } from "expo-router";
import React from "react";
import { ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import { BackButton } from "../../components/BackButton";
import { Title } from "../../features/training/components/Title";
import { HangboardTrends } from "../../features/training/trends/HangboardTrends";

export default function HangboardTrendsRoute(): React.ReactElement {
  const { workout, grip } = useLocalSearchParams<{ workout?: string; grip?: string }>();
  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colors.white }}>
      <View style={{ paddingHorizontal: 18, paddingTop: 6 }}>
        <BackButton />
      </View>
      <ScrollView contentContainerStyle={{ gap: 16, paddingHorizontal: 18, paddingBottom: 28 }}>
        <Title size={32}>{t("hang.trendsTitle")}</Title>
        <HangboardTrends workoutId={workout} gripId={grip} />
      </ScrollView>
    </SafeAreaView>
  );
}
