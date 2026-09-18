import React from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { colors, fonts } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import { ENDURANCE_RANGES, trendRangeLabel, useEnduranceTrends } from "@sendtally/features/trends";
import { Chip } from "../../components/Chip";
import { CircuitDot } from "../../components/CircuitDot";
import { useApi } from "../../lib/api";
import { pressRow } from "../../lib/press";
import { card, monoLabel } from "./styles";
import { TrendStats } from "./TrendStats";
import { TrendTile } from "./TrendTile";

export function EnduranceScreen(): React.ReactElement {
  const { state, range, setRange } = useEnduranceTrends(useApi());
  const [row, setRow] = React.useState<number | null>(null);
  return (
    <>
      <Text
        accessibilityRole="header"
        style={{
          fontFamily: fonts.display,
          fontSize: 32,
          letterSpacing: -0.8,
          color: colors.gunmetal,
        }}
      >
        {t("endurance.title")}
      </Text>
      {state.status === "ready" && (
        <Text
          style={{
            fontFamily: fonts.sans,
            fontSize: 15,
            lineHeight: 22,
            color: colors.textSecondary,
          }}
        >
          {state.data.insight}
        </Text>
      )}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 6 }}
      >
        {ENDURANCE_RANGES.map((r) => (
          <Chip
            key={r}
            label={trendRangeLabel(r)}
            active={range === r}
            onPress={() => setRange(r)}
          />
        ))}
      </ScrollView>
      {state.status === "loading" && <ActivityIndicator color={colors.gunmetal} />}
      {state.status === "error" && (
        <Text style={{ fontFamily: fonts.mono, fontSize: 12, color: colors.watermelonInk }}>
          {t("trends.loadFailedMobile")}
        </Text>
      )}
      {state.status === "ready" && (
        <>
          <TrendStats stats={state.data.stats} />
          {state.data.tiles.map((tile) => (
            <View key={tile.id} style={card}>
              <TrendTile tile={tile} />
            </View>
          ))}
          {state.data.circuits.length > 0 && (
            <View style={{ ...card, padding: 18, gap: 6 }}>
              <Text style={{ ...monoLabel, fontSize: 13, color: colors.labelAccent }}>
                {t("trends.byCircuit")}
              </Text>
              <Text
                style={{
                  fontFamily: fonts.sans,
                  fontSize: 13,
                  lineHeight: 19,
                  color: colors.textSecondary,
                }}
              >
                {t("trends.byCircuitBody")}
              </Text>
              {state.data.circuits.map((c, i) => (
                <Pressable
                  key={c.key}
                  accessibilityLabel={t("trends.circuitRowLabel", {
                    circuit: c.label,
                    rate: c.rate,
                    best: c.best,
                  })}
                  onPress={() => setRow((r) => (r === i ? null : i))}
                  style={pressRow({
                    paddingVertical: 12,
                    gap: 8,
                    borderTopWidth: 1,
                    borderTopColor: colors.lineOnLightSoft,
                    opacity: row === null || row === i ? 1 : 0.45,
                  })}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                    {c.colour !== null && <CircuitDot colour={c.colour} />}
                    <Text
                      numberOfLines={1}
                      style={{
                        flex: 1,
                        fontFamily: fonts.sansSemiBold,
                        fontSize: 15,
                        color: colors.gunmetal,
                      }}
                    >
                      {c.label}
                    </Text>
                    <Text
                      style={{
                        fontFamily: row === i ? fonts.displayHeavy : fonts.display,
                        fontSize: row === i ? 20 : 16,
                        color: colors.gunmetal,
                      }}
                    >
                      {c.rate}
                    </Text>
                  </View>
                  <View
                    style={{
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: colors.lineOnLightSoft,
                      overflow: "hidden",
                    }}
                  >
                    <View
                      style={{
                        height: 8,
                        width: `${Math.round(c.ratio * 100)}%`,
                        backgroundColor: colors.fern,
                        borderRadius: 4,
                      }}
                    />
                  </View>
                  <Text
                    style={{ fontFamily: fonts.mono, fontSize: 11, color: colors.textSecondary }}
                  >
                    {[
                      c.length,
                      t("trends.setCount", { count: c.sets }),
                      t("endurance.lapCount", { count: c.laps }),
                      c.best,
                      c.trend,
                    ].join(" · ")}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}
        </>
      )}
    </>
  );
}
