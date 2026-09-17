import React from "react";
import { Text, View } from "react-native";
import {
  enduranceLapValueLabel,
  isCleanLap,
  type Endurance,
} from "@sendtally/features/log-session";
import { colors, fonts } from "@sendtally/design/tokens";

export type EnduranceLapsProps = { endurance: Endurance };

/** One bar per lap: full and fern when it went clean, cut short and watermelon when it did not. */
export function EnduranceLaps({ endurance }: EnduranceLapsProps): React.ReactElement {
  return (
    <View style={{ gap: 7, paddingTop: 4 }}>
      {endurance.laps.map((lap, i) => {
        const clean = isCleanLap(endurance, i);
        return (
          <View key={i} style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <Text
              style={{
                width: 14,
                fontFamily: fonts.monoMedium,
                fontSize: 11,
                color: colors.textSecondary,
              }}
            >
              {i + 1}
            </Text>
            <View
              style={{
                flex: 1,
                height: 12,
                borderRadius: 6,
                overflow: "hidden",
                backgroundColor: colors.dataBarEmpty,
              }}
            >
              <View
                style={{
                  width: `${Math.round((Math.min(lap, endurance.target) / endurance.target) * 100)}%`,
                  height: 12,
                  borderRadius: 6,
                  backgroundColor: clean ? colors.fern : colors.watermelonInk,
                }}
              />
            </View>
            <Text
              style={{
                width: 56,
                textAlign: "right",
                fontFamily: fonts.monoMedium,
                fontSize: 11,
                color: colors.gunmetal,
              }}
            >
              {enduranceLapValueLabel(endurance, i)}
            </Text>
          </View>
        );
      })}
    </View>
  );
}
