import React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import type { WeekLoad } from "@sendtally/api-client";
import { BASE_WEEK_LOAD, MAX_WEEK_LOAD } from "@sendtally/core/hang";
import { colors } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import { press } from "../../../lib/press";
import { Label } from "../components/Label";
import { type } from "../type";
import { loadWeekLabel } from "./blockText";
import { PHASE_LOOK } from "./phaseLook";

const TRACK = 112;

const barHeight = (load: number): number => Math.round((load / MAX_WEEK_LOAD) * TRACK);

export type LoadBarsProps = {
  loads: readonly WeekLoad[];
  selected: number;
  onSelect: (index: number) => void;
};

/** The block's load as a time series: a bar per week against the base line, tapped to pick it. */
export function LoadBars({ loads, selected, onSelect }: LoadBarsProps): React.ReactElement {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ flexGrow: 1, gap: 6 }}
    >
      {loads.map((w, i) => {
        const on = i === selected;
        return (
          <Pressable
            key={i}
            onPress={() => onSelect(i)}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
            accessibilityLabel={loadWeekLabel(i + 1, w)}
            style={press({
              flexGrow: 1,
              minWidth: 44,
              alignItems: "center",
              gap: 6,
              paddingVertical: 8,
              borderRadius: 12,
              borderWidth: 1.5,
              borderColor: on ? colors.gunmetal : "transparent",
              backgroundColor: on ? colors.surfaceSoft : undefined,
            })}
          >
            <Text
              style={[
                type.mono,
                { fontSize: 11, color: on ? colors.gunmetal : colors.textSecondary },
              ]}
            >
              {w.load}
            </Text>
            <View
              style={{
                alignSelf: "stretch",
                height: TRACK,
                justifyContent: "flex-end",
                paddingHorizontal: 8,
              }}
            >
              <View
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  bottom: barHeight(BASE_WEEK_LOAD),
                  height: 1,
                  backgroundColor: colors.lineOnLightStrong,
                }}
              />
              <View
                style={{
                  height: barHeight(w.load),
                  borderRadius: 4,
                  backgroundColor: w.phase === undefined ? colors.azure : PHASE_LOOK[w.phase].bar,
                }}
              />
            </View>
            <Label small color={on ? colors.gunmetal : colors.textSecondary}>
              {t("plan.weekShort", { n: i + 1 })}
            </Label>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
