import { router } from "expo-router";
import React from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { TILE_BREAKDOWN_ROWS, useTrends } from "@sendtally/features/trends";
import { t } from "@sendtally/features/i18n";
import { colors, fonts, radius } from "@sendtally/design/tokens";
import { Paywall } from "../billing/Paywall";
import { useApi } from "../../lib/api";
import { TrendBars } from "./TrendBars";
import { TrendFilters } from "./TrendFilters";
import { TrendTagBreakdown } from "./TrendTagBreakdown";
import { pressRow } from "../../lib/press";

export type TrendsListProps = {
  preview?: boolean;
  onLockedRange?: () => void;
};

const card = {
  backgroundColor: colors.white,
  borderWidth: 1,
  borderColor: colors.lineOnLightSoft,
  borderRadius: radius.card,
  paddingVertical: 18,
  paddingHorizontal: 20,
  gap: 8,
} as const;

export function TrendsList({
  preview = false,
  onLockedRange,
}: TrendsListProps): React.ReactElement {
  const api = useApi();
  const feature = useTrends(api, { preview });
  const { state } = feature;

  return (
    <>
      <TrendFilters feature={feature} onLockedRange={onLockedRange} />
      {state.status === "loading" && <ActivityIndicator color={colors.gunmetal} />}
      {state.status === "error" && (
        <Text style={{ fontFamily: fonts.mono, fontSize: 12, color: colors.watermelonInk }}>
          {t("trends.loadFailedPull")}
        </Text>
      )}
      {state.status === "ready" &&
        state.data.tiles.map((tile) => (
          <Pressable
            key={tile.metric}
            disabled={preview}
            onPress={() => router.push(`/trend/${tile.metric}`)}
            style={pressRow(card)}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  fontFamily: fonts.monoMedium,
                  fontSize: 10,
                  letterSpacing: 0.7,
                  textTransform: "uppercase",
                  color: colors.labelAccent,
                }}
              >
                {tile.label}
              </Text>
              {!preview && (
                <Text
                  style={{
                    fontFamily: fonts.monoMedium,
                    fontSize: 9,
                    letterSpacing: 0.7,
                    textTransform: "uppercase",
                    color: colors.textSecondary,
                  }}
                >
                  {t("trends.details")}
                </Text>
              )}
            </View>
            <Text
              style={{
                fontFamily: fonts.display,
                fontSize: 26,
                letterSpacing: -0.5,
                color: colors.gunmetal,
              }}
            >
              {tile.value}
            </Text>
            <Text
              style={{
                fontFamily: fonts.monoMedium,
                fontSize: 10,
                letterSpacing: 0.5,
                textTransform: "uppercase",
                color: colors.textSecondary,
              }}
            >
              {tile.caption}
            </Text>
            <View style={{ marginTop: 2 }}>
              <TrendBars bars={tile.bars} height={38} />
            </View>
            <TrendTagBreakdown
              compact
              title={feature.gymId === null ? t("trends.byTag") : t("trends.byCircuit")}
              rows={state.data.details[tile.metric].breakdown.slice(0, TILE_BREAKDOWN_ROWS)}
            />
          </Pressable>
        ))}
      {preview && state.status === "ready" && <Paywall />}
    </>
  );
}
