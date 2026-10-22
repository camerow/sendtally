import React from "react";
import { View } from "react-native";
import type { SharedValue } from "react-native-reanimated";
import { colors } from "@sendtally/design/tokens";
import { isWork, phaseWeight, runPercent, type Run } from "@sendtally/core/hang";
import { t } from "@sendtally/features/i18n";
import { LiveFill } from "./LiveFill";

export type RunProgressBarProps = { run: Run; progress: SharedValue<number> };

const WORK_TRACK = "rgba(249,220,92,0.22)";
const REST_TRACK = "rgba(204,121,234,0.25)";

/**
 * The whole workout as the phase bar: finished segments filled, the current
 * one filling live, the rest faint.
 */
export function RunProgressBar({ run, progress }: RunProgressBarProps): React.ReactElement {
  const pct = runPercent(run);
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={t("hang.progress")}
      accessibilityValue={{ min: 0, max: 100, now: pct }}
      style={{ flexDirection: "row", alignItems: "flex-end", gap: 1, height: 14 }}
    >
      {run.phases.slice(1).map((phase, i) => {
        const at = i + 1;
        const work = isWork(phase.kind);
        const color = work ? colors.gold : colors.petal;
        return (
          <View
            key={i}
            style={{
              flexGrow: phaseWeight(phase, run.protocol),
              flexBasis: 0,
              minWidth: 1,
              height: work ? 14 : 6,
              borderRadius: 1,
              overflow: "hidden",
              backgroundColor: work ? WORK_TRACK : REST_TRACK,
            }}
          >
            {at < run.index || run.finished !== null ? (
              <View style={{ height: "100%", backgroundColor: color }} />
            ) : at === run.index ? (
              <LiveFill progress={progress} color={color} />
            ) : null}
          </View>
        );
      })}
    </View>
  );
}
