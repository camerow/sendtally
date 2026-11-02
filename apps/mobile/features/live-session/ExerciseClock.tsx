import React from "react";
import { Pressable, Text, View } from "react-native";
import { t } from "@sendtally/features/i18n";
import {
  exerciseLine,
  tallyElapsedSeconds,
  wallLeft,
  type LogSessionDraft,
} from "@sendtally/features/log-session";
import { elapsedClock } from "@sendtally/features/sessions";
import { colors, fonts } from "@sendtally/design/tokens";
import { press } from "../../lib/press";
import type { RestClock } from "../training/rest/useRest";

export type ExerciseClockProps = {
  draft: LogSessionDraft;
  rest: RestClock;
  now: Date;
};

const CLOCK = {
  fontFamily: fonts.displayHeavy,
  fontSize: 44,
  lineHeight: 50,
  letterSpacing: -1.3,
  fontVariant: ["tabular-nums" as const],
};

/**
 * The tally's clock while it logs a workout exercise: the rest in gold between sets with more
 * time or a skip, a time set counting down, or the time since Start; the exercise, set and
 * climbs in the set under it.
 */
export function ExerciseClock({ draft, rest, now }: ExerciseClockProps): React.ReactElement {
  const resting = rest.rest !== null;
  const left = draft.exercise === undefined ? null : wallLeft(draft.exercise, now);
  const time = resting
    ? t("tally.restClock", { time: elapsedClock(rest.left) })
    : left === null
      ? elapsedClock(tallyElapsedSeconds(draft, now))
      : t("tally.timeLeft", { time: elapsedClock(left) });
  return (
    <View style={{ alignItems: "center", gap: 2, paddingTop: 4, paddingBottom: 12 }}>
      <Text style={[CLOCK, { color: resting ? colors.gold : colors.white }]}>{time}</Text>
      <Text style={{ fontFamily: fonts.mono, fontSize: 13, color: "rgba(255,255,255,0.75)" }}>
        {exerciseLine(draft, resting)}
      </Text>
      {resting && (
        <View style={{ flexDirection: "row", gap: 10, paddingTop: 10 }}>
          {[
            { label: t("activities.restMore"), onPress: rest.more },
            { label: t("tally.skipRest"), onPress: rest.skip },
          ].map((b) => (
            <Pressable
              key={b.label}
              onPress={b.onPress}
              accessibilityRole="button"
              style={press({
                height: 40,
                paddingHorizontal: 16,
                borderRadius: 20,
                borderWidth: 1.5,
                borderColor: "rgba(255,255,255,0.4)",
                justifyContent: "center",
              })}
            >
              <Text style={{ fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.white }}>
                {b.label}
              </Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}
