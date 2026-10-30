import React from "react";
import { Text, View } from "react-native";
import { colors, fonts } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import { elapsedClock } from "@sendtally/features/sessions";
import type { Rest } from "../training/rest/restCountdown";
import { useRestLeft } from "../training/rest/useRest";
import { useLiveRun } from "./liveRun";

/** What a rest is before: the exercise it names, else the set after the one it sits under. */
const restThen = (rest: Rest): string | null => {
  if (rest.next !== null) return t("activities.restThen", { name: rest.next });
  const set = /^\d+:(\d+)$/.exec(rest.at)?.[1];
  return set === undefined ? null : t("activities.restThenSet", { set: Number(set) + 2 });
};

/** The live run's rest while its player is minimised: a slim line under the live bar. */
export function RestStrip(): React.ReactElement | null {
  const rest = useLiveRun()?.rest ?? null;
  const left = useRestLeft(rest);
  if (rest === null || left === 0) return null;
  const text = { fontFamily: fonts.monoSemiBold, fontSize: 11.5, color: colors.white };
  const then = restThen(rest);
  return (
    <View
      accessibilityLabel={t("activities.restLeft", { time: elapsedClock(left) })}
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
          width: `${(left / rest.seconds) * 100}%`,
          backgroundColor: colors.gold,
          opacity: 0.32,
        }}
      />
      <Text style={text}>{t("activities.restPreview", { time: elapsedClock(left) })}</Text>
      {then !== null && (
        <Text style={[text, { fontFamily: fonts.mono, color: "rgba(255,255,255,0.7)" }]}>
          {`· ${then}`}
        </Text>
      )}
    </View>
  );
}
