import React from "react";
import { View } from "react-native";
import type { SharedValue } from "react-native-reanimated";
import { isWork, phaseWeight, runPercent, type Run } from "@sendtally/core/hang";
import { t } from "@sendtally/features/i18n";
import { useTheme } from "../../theme/ThemeContext";
import { rgba } from "../../theme/themes";
import { LiveFill } from "./LiveFill";

export type RunProgressBarProps = { run: Run; progress: SharedValue<number> };

/**
 * The whole workout as the phase bar: finished segments filled, the current
 * one filling live, the rest faint.
 */
export function RunProgressBar({ run, progress }: RunProgressBarProps): React.ReactElement {
  const c = useTheme();
  const pct = runPercent(run);
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={t("hang.progress")}
      accessibilityValue={{ min: 0, max: 100, now: pct }}
      style={{ flexDirection: "row", alignItems: "flex-end", gap: 2, height: 28 }}
    >
      {run.phases.slice(1).map((phase, i) => {
        const at = i + 1;
        const work = isWork(phase.kind);
        const color = work ? c.accent : c.rest;
        return (
          <View
            key={i}
            style={{
              flexGrow: phaseWeight(phase, run.protocol),
              flexBasis: 0,
              minWidth: 2,
              height: work ? 28 : 13,
              borderRadius: 2,
              overflow: "hidden",
              backgroundColor: rgba(color, 0.22),
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
