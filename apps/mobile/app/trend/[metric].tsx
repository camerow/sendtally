import { router, useLocalSearchParams } from "expo-router";
import React from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { TREND_METRICS, useTrends, type TrendMetric } from "@sendtally/features/trends";
import { t } from "@sendtally/features/i18n";
import { colors, fonts, radius } from "@sendtally/design/tokens";
import { TrendBars } from "../../features/trends/TrendBars";
import { TrendFilters } from "../../features/trends/TrendFilters";
import { TrendTagBreakdown } from "../../features/trends/TrendTagBreakdown";
import { useApi } from "../../lib/api";
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
  const { metric: metricParam } = useLocalSearchParams<{ metric: string }>();
  const api = useApi();
  const feature = useTrends(api);
  const { state } = feature;
  const metric = TREND_METRICS.includes(metricParam as TrendMetric)
    ? (metricParam as TrendMetric)
    : "volume";

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.white }} edges={["top"]}>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 18, paddingTop: 8, paddingBottom: 24, gap: 12 }}
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
        <TrendFilters feature={feature} />
        {state.status === "loading" && <ActivityIndicator color={colors.gunmetal} />}
        {state.status === "error" && (
          <Text style={{ fontFamily: fonts.mono, fontSize: 12, color: colors.watermelonInk }}>
            {t("trends.loadFailedMobile")}
          </Text>
        )}
        {state.status === "ready" && (
          <>
            <View style={{ gap: 5 }}>
              <Text
                style={{
                  fontFamily: fonts.sansSemiBold,
                  fontSize: 20,
                  letterSpacing: -0.2,
                  color: colors.gunmetal,
                }}
              >
                {state.data.details[metric].title}
              </Text>
              <Text
                style={{
                  fontFamily: fonts.monoMedium,
                  fontSize: 10,
                  letterSpacing: 0.6,
                  textTransform: "uppercase",
                  color: colors.textMuted,
                }}
              >
                {state.data.details[metric].caption}
              </Text>
            </View>
            <View
              style={{
                backgroundColor: colors.white,
                borderWidth: 1,
                borderColor: colors.lineOnLightSoft,
                borderRadius: radius.card,
                paddingVertical: 18,
                paddingHorizontal: 16,
              }}
            >
              <TrendBars
                bars={state.data.details[metric].bars}
                yTicks={state.data.details[metric].yTicks}
                height={140}
                showValues
              />
            </View>
            <View>
              {state.data.details[metric].specs.map((sp) => (
                <View
                  key={sp.k}
                  style={{
                    flexDirection: "row",
                    gap: 12,
                    paddingVertical: 11,
                    borderTopWidth: 1,
                    borderTopColor: colors.lineOnLight,
                  }}
                >
                  <Text
                    style={{
                      width: 120,
                      fontFamily: fonts.monoMedium,
                      fontSize: 10,
                      letterSpacing: 0.7,
                      textTransform: "uppercase",
                      color: colors.labelAccent,
                      paddingTop: 1,
                    }}
                  >
                    {sp.k}
                  </Text>
                  <Text
                    style={{
                      flex: 1,
                      fontFamily: fonts.sans,
                      fontSize: 13,
                      color: colors.textSecondary,
                    }}
                  >
                    {sp.v}
                  </Text>
                </View>
              ))}
            </View>
            <TrendTagBreakdown
              title={t(feature.gymId === null ? "trends.byTagTitled" : "trends.byCircuitTitled", {
                title: state.data.details[metric].title,
              })}
              rows={state.data.details[metric].breakdown}
            />
            <Text
              style={{
                fontFamily: fonts.sans,
                fontSize: 14,
                lineHeight: 21,
                color: colors.textSecondary,
              }}
            >
              {state.data.details[metric].insight}
            </Text>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
