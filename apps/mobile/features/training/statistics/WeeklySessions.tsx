import React from "react";
import { Pressable, Text, View } from "react-native";
import { colors } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import {
  ACTIVITY_KINDS,
  OVERVIEW_WEEKS,
  type StatisticsOverviewVM,
} from "@sendtally/features/statistics";
import { Label } from "../components/Label";
import { Title } from "../components/Title";
import { type } from "../type";
import { KIND_COLORS } from "./kindColors";
import { WEEK_GAP } from "./weekColumns";

const HEIGHT = 116;
const SEGMENT_GAP = 2;

/** Sessions per week stacked by kind, the first kind at the bottom; tap a week to read it. */
export function WeeklySessions({ vm }: { vm: StatisticsOverviewVM }): React.ReactElement {
  const [picked, setPicked] = React.useState<number | null>(null);
  const unit = (HEIGHT - SEGMENT_GAP * (ACTIVITY_KINDS.length - 1)) / vm.mostInAWeek;
  const week = picked === null ? undefined : vm.weeks[picked];
  return (
    <View
      style={{
        gap: 12,
        padding: 16,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: colors.lineOnLight,
      }}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Label color={colors.gunmetal}>{t("statistics.sessionsPerWeek")}</Label>
        <Text style={[type.mono, { fontSize: 12, color: colors.textSecondary }]}>
          {t("statistics.lastWeeks", { n: OVERVIEW_WEEKS })}
        </Text>
      </View>
      <View style={{ flexDirection: "row", alignItems: "baseline", gap: 8 }}>
        <Title size={40}>{vm.perWeek}</Title>
        <Text style={[type.body, { flexShrink: 1, fontSize: 14, color: colors.textSecondary }]}>
          {week?.label ?? vm.perWeekCaption}
        </Text>
      </View>
      <View style={{ flexDirection: "row", gap: WEEK_GAP, height: HEIGHT }}>
        {vm.weeks.map((w, i) => (
          <Pressable
            key={w.start}
            accessibilityRole="button"
            accessibilityLabel={w.label}
            accessibilityState={{ selected: picked === i }}
            onPress={() => setPicked(picked === i ? null : i)}
            style={{
              flex: 1,
              justifyContent: "flex-end",
              gap: SEGMENT_GAP,
              opacity: picked === null || picked === i ? 1 : 0.4,
            }}
          >
            {[...ACTIVITY_KINDS].reverse().map((kind) =>
              w.sessions[kind] === 0 ? null : (
                <View
                  key={kind}
                  style={{
                    height: w.sessions[kind] * unit,
                    borderRadius: 3,
                    backgroundColor: KIND_COLORS[kind],
                  }}
                />
              )
            )}
          </Pressable>
        ))}
      </View>
      <View style={{ flexDirection: "row", gap: WEEK_GAP }}>
        {vm.weeks.map((w, i) => (
          <View
            key={w.start}
            style={{
              flex: 1,
              overflow: "visible",
              alignItems: i === vm.weeks.length - 1 ? "flex-end" : "flex-start",
            }}
          >
            <Text
              numberOfLines={1}
              style={[
                type.mono,
                {
                  width: 60,
                  fontSize: 10,
                  color: colors.textSecondary,
                  textAlign: i === vm.weeks.length - 1 ? "right" : "left",
                },
              ]}
            >
              {w.axis}
            </Text>
          </View>
        ))}
      </View>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 16 }}>
        {vm.kinds.map((k) => (
          <View key={k.kind} style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <View
              style={{
                width: 10,
                height: 10,
                borderRadius: 3,
                backgroundColor: KIND_COLORS[k.kind],
              }}
            />
            <Text style={[type.body, { fontSize: 12, color: colors.textSecondary }]}>{k.name}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}
