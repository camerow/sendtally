import React from "react";
import { Text, View } from "react-native";
import { colors } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import { elapsedClock } from "@sendtally/features/sessions";
import { Button } from "../components/Button";
import { type } from "../type";
import { holdNow, type Hold } from "@sendtally/features/workouts";

export type HoldRowProps = {
  hold: Hold;
  now: number;
  /** What sits first, as the set table's set number. */
  lead?: React.ReactNode;
  onPause: () => void;
  onResume: () => void;
  onDone: () => void;
};

/**
 * A timed set running where it sits, the rest row's twin: a green fill grows toward the target
 * as it counts up, after a count-in, and Done ends it early.
 */
export function HoldRow({
  hold,
  now,
  lead,
  onPause,
  onResume,
  onDone,
}: HoldRowProps): React.ReactElement {
  const at = holdNow(hold, now);
  const word =
    at.phase === "countIn"
      ? t("activities.holdReady")
      : at.phase === "switch"
        ? t("activities.holdSwitch")
        : at.phase === "hold" && at.side !== null
          ? t(at.side === "L" ? "activities.holdLeft" : "activities.holdRight")
          : null;
  const clock =
    at.phase === "hold"
      ? elapsedClock(at.seconds)
      : at.phase === "over"
        ? elapsedClock(hold.targetS)
        : String(at.left);
  const share = at.phase === "hold" ? Math.min(1, at.share) : at.phase === "over" ? 1 : 0;
  const paused = hold.pausedAt !== null;
  return (
    <View
      accessibilityLabel={[
        word,
        clock,
        t("activities.holdOf", { time: elapsedClock(hold.targetS) }),
      ]
        .filter((x) => x !== null)
        .join(" ")}
      style={{
        minHeight: 48,
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        paddingRight: 6,
        borderRadius: 10,
        overflow: "hidden",
        backgroundColor: colors.surfaceSoft,
      }}
    >
      <View
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: `${share * 100}%`,
          backgroundColor: colors.fern,
          opacity: 0.16,
        }}
      />
      {lead ?? <View style={{ width: 12 }} />}
      <View style={{ flex: 1, flexDirection: "row", alignItems: "baseline", gap: 6 }}>
        {word !== null && (
          <Text style={[type.bodyBold, { fontSize: 13, color: colors.gunmetal }]}>{word}</Text>
        )}
        <Text style={[type.monoBold, { fontSize: 20, color: colors.gunmetal }]}>{clock}</Text>
        {at.phase !== "countIn" && at.phase !== "switch" && (
          <Text style={[type.mono, { fontSize: 12.5, color: colors.textSecondary }]}>
            {t("activities.holdOf", { time: elapsedClock(hold.targetS) })}
          </Text>
        )}
      </View>
      <Button
        label={paused ? t("hang.resume") : t("hang.pause")}
        onPress={paused ? onResume : onPause}
        variant="link"
        height={40}
      />
      <Button label={t("common.done")} onPress={onDone} variant="link" height={40} />
    </View>
  );
}
