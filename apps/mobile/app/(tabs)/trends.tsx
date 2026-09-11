import React from "react";
import { ActivityIndicator, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "@sendtally/design/tokens";
import { ScreenHeader } from "../../components/ScreenHeader";
import { Paywall } from "../../features/billing/Paywall";
import { useCanSeeInsights } from "../../features/billing/useBilling";
import { TrendsList } from "../../features/trends/TrendsList";

export default function Trends(): React.ReactElement {
  const canSeeInsights = useCanSeeInsights();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.white }} edges={["top"]}>
      <ScreenHeader title="Trends" />
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 18,
          paddingTop: 4,
          paddingBottom: 24,
          gap: 14,
        }}
      >
        {canSeeInsights === null && (
          <ActivityIndicator color={colors.gunmetal} style={{ alignSelf: "flex-start" }} />
        )}
        {canSeeInsights === true && <TrendsList />}
        {canSeeInsights === false && (
          <View style={{ gap: 14 }}>
            <Paywall
              title="Your sessions are adding up to something."
              body="Logging stays free. Membership opens the screens that read your whole history back to you."
              points={[
                "Volume - how much you actually climbed, week by week",
                "Effort - how hard your sessions have been feeling",
                "Average send grade - the drift a logbook never shows",
                "Flash rate - the first thing to move when your reading improves",
              ]}
            />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
