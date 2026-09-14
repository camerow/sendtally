import React from "react";
import { ActivityIndicator, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { t } from "@sendtally/features/i18n";
import { colors } from "@sendtally/design/tokens";
import { ScreenHeader } from "../../components/ScreenHeader";
import { Paywall } from "../../features/billing/Paywall";
import { useCanSeeInsights } from "../../features/billing/useBilling";
import { TrendsList } from "../../features/trends/TrendsList";

export default function Trends(): React.ReactElement {
  const canSeeInsights = useCanSeeInsights();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.white }} edges={["top"]}>
      <ScreenHeader title={t("mobile.trends.title")} />
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
              title={t("mobile.trends.paywallTitle")}
              body={t("mobile.trends.paywallBody")}
              points={[
                t("mobile.trends.paywallVolume"),
                t("mobile.trends.paywallEffort"),
                t("mobile.trends.paywallAvgGrade"),
                t("mobile.trends.paywallFlash"),
              ]}
            />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
