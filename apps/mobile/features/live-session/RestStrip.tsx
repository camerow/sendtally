import React from "react";
import { Text, View } from "react-native";
import { colors, fonts } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import { elapsedClock } from "@sendtally/features/sessions";
import type { Rest } from "../training/rest/restCountdown";
import { holdNow } from "../training/hold/holdClock";
import { useHold } from "../training/hold/useHold";
import { useRestLeft } from "../training/rest/useRest";
import { useLiveRun } from "./liveRun";

/** What a rest is before: the exercise it names, else the set after the one it sits under. */
const restThen = (rest: Rest): string | null => {
  if (rest.next !== null) return t("activities.restThen", { name: rest.next });
  const set = /^\d+:(\d+)$/.exec(rest.at)?.[1];
  return set === undefined ? null : t("activities.restThenSet", { set: Number(set) + 2 });
};

const text = { fontFamily: fonts.monoSemiBold, fontSize: 11.5, color: colors.white };

/**
 * The live run's rest or timed set while its player is minimised: a slim line under the live
 * bar, gold draining for a rest, green filling for a hold.
 */
export function RestStrip(): React.ReactElement | null {
  const rest = useLiveRun()?.rest ?? null;
  const left = useRestLeft(rest);
  const { hold, now } = useHold();
  if (hold !== null) {
    const at = holdNow(hold, now);
    if (at.phase === "over") return null;
    const clock = at.phase === "hold" ? elapsedClock(at.seconds) : String(at.left);
    return (
      <Strip share={at.phase === "hold" ? Math.min(1, at.share) : 0} fill={colors.fern}>
        <Text style={text}>{`${hold.name} ${clock}`}</Text>
        <Text style={[text, { fontFamily: fonts.mono, color: "rgba(255,255,255,0.7)" }]}>
          {`· ${t("activities.holdOf", { time: elapsedClock(hold.targetS) })}`}
        </Text>
      </Strip>
    );
  }
  if (rest === null || left === 0) return null;
  const then = restThen(rest);
  return (
    <Strip
      share={left / rest.seconds}
      fill={colors.gold}
      label={t("activities.restLeft", { time: elapsedClock(left) })}
    >
      <Text style={text}>{t("activities.restPreview", { time: elapsedClock(left) })}</Text>
      {then !== null && (
        <Text style={[text, { fontFamily: fonts.mono, color: "rgba(255,255,255,0.7)" }]}>
          {`· ${then}`}
        </Text>
      )}
    </Strip>
  );
}

function Strip({
  share,
  fill,
  label,
  children,
}: {
  share: number;
  fill: string;
  label?: string;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <View
      {...(label !== undefined && { accessibilityLabel: label })}
      style={{
        height: 24,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        overflow: "hidden",
        backgroundColor: colors.gunmetalDeep,
      }}
    >
      <View
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: `${share * 100}%`,
          backgroundColor: fill,
          opacity: fill === colors.gold ? 0.32 : 0.55,
        }}
      />
      {children}
    </View>
  );
}
