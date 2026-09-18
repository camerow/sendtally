import { router, useLocalSearchParams } from "expo-router";
import React from "react";
import { Pressable, ScrollView, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { t } from "@sendtally/features/i18n";
import { colors, fonts } from "@sendtally/design/tokens";
import { DaysScreen } from "../../features/trends/DaysScreen";
import { EnduranceScreen } from "../../features/trends/EnduranceScreen";
import { Paywall } from "../../features/billing/Paywall";
import { useCanSeeInsights } from "../../features/billing/useBilling";
import { press } from "../../lib/press";

export default function TrendDetailScreen(): React.ReactElement | null {
  const canSeeInsights = useCanSeeInsights();
  if (canSeeInsights === null) return null;
  return canSeeInsights ? <TrendDetail /> : <TrendDetailLocked />;
}

function TrendDetailLocked(): React.ReactElement {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.white }} edges={["top"]}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 18, paddingTop: 12, gap: 12 }}>
        <Pressable
          onPress={() => router.back()}
          style={press({ minHeight: 44, justifyContent: "center" })}
        >
          <Text
            style={{
              fontFamily: fonts.monoMedium,
              fontSize: 12,
              letterSpacing: 0.5,
              textTransform: "uppercase",
              color: colors.labelAccent,
            }}
          >
            {t("trends.backToTrends")}
          </Text>
        </Pressable>
        <Paywall />
      </ScrollView>
    </SafeAreaView>
  );
}

function TrendDetail(): React.ReactElement {
  const { page } = useLocalSearchParams<{ page: string }>();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.white }} edges={["top"]}>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 18, paddingTop: 8, paddingBottom: 24, gap: 14 }}
      >
        <Pressable
          onPress={() => router.back()}
          style={press({ minHeight: 44, justifyContent: "center" })}
        >
          <Text
            style={{
              fontFamily: fonts.monoMedium,
              fontSize: 12,
              letterSpacing: 0.5,
              textTransform: "uppercase",
              color: colors.labelAccent,
            }}
          >
            {t("trends.backToTrends")}
          </Text>
        </Pressable>
        {page === "days" ? <DaysScreen /> : <EnduranceScreen />}
      </ScrollView>
    </SafeAreaView>
  );
}
