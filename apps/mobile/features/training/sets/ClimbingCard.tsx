import React from "react";
import { Text, View } from "react-native";
import { clock, type SessionItem } from "@sendtally/core/hang";
import { colors } from "@sendtally/design/tokens";
import { climbingDoseLine } from "@sendtally/features/activities";
import type { TallyMeasure } from "@sendtally/features/exercises";
import { t } from "@sendtally/features/i18n";
import { exerciseName } from "@sendtally/features/workouts";
import { Button } from "../components/Button";
import { type } from "../type";

export type ClimbingCardProps = {
  item: SessionItem;
  measure: TallyMeasure;
  /** "Last time: 16 climbs · 13 sent · top V4", when there was one. */
  lastTime: string | null;
  /** What this run logged on it so far, once it has. */
  logged: string | null;
  /** Its tally is still running, minimised. */
  live: boolean;
  onStart: () => void;
};

/** A climbing exercise in the player: its dose and last time, and Start to log it on the tally. */
export function ClimbingCard({
  item,
  measure,
  lastTime,
  logged,
  live,
  onStart,
}: ClimbingCardProps): React.ReactElement {
  const rest = item.dose.setRestS ?? 0;
  return (
    <View
      style={{
        gap: 4,
        padding: 14,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.lineOnLightStrong,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "baseline", gap: 8 }}>
        <Text style={[type.bodyBold, { flex: 1, fontSize: 17, color: colors.gunmetal }]}>
          {exerciseName(item.exercise)}
        </Text>
        {rest > 0 && (
          <Text style={[type.body, { fontSize: 13, color: colors.textSecondary }]}>
            {t("plan.chipRest", { value: clock(rest) })}
          </Text>
        )}
      </View>
      <Text style={[type.monoBold, { fontSize: 14, color: colors.gunmetal }]}>
        {climbingDoseLine(item.dose, measure)}
      </Text>
      {(logged ?? lastTime) !== null && (
        <Text style={[type.mono, { fontSize: 12, color: colors.textSecondary }]}>
          {logged ?? lastTime}
        </Text>
      )}
      <Button
        label={live ? t("activities.resume") : t("hang.start")}
        onPress={onStart}
        variant="primary"
        icon="play"
        height={48}
        style={{ marginTop: 8 }}
      />
    </View>
  );
}
