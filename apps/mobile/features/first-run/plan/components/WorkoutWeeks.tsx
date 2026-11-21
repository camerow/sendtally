import React from "react";
import { Text, View } from "react-native";
import type { Weekday, WorkoutKind } from "@sendtally/core/hang";
import { colors } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import { DarkWeek } from "../../../../components/DarkWeek";
import { DayMark } from "../../../training/today/DayMark";
import { type } from "../../../training/type";
import { DarkCard } from "../../components/DarkCard";
import { YoursTag } from "./YoursTag";

export type WorkoutWeek = {
  id: string;
  name: string;
  kind: WorkoutKind | undefined;
  mine: boolean;
  days: readonly Weekday[];
};

const WEEKDAYS: readonly Weekday[] = [0, 1, 2, 3, 4, 5, 6];

/** "Your week" as the control: a row of seven days per workout, each day putting that workout on it or taking it off. */
export function WorkoutWeeks({
  workouts,
  meta,
  dim,
  onToggle,
}: {
  workouts: readonly WorkoutWeek[];
  meta: string;
  dim: readonly Weekday[];
  onToggle: (id: string, day: Weekday) => void;
}): React.ReactElement {
  return (
    <DarkCard
      label={t("plan.week")}
      meta={meta}
      reserveNote
      {...(workouts.some((w) => w.days.length > 0)
        ? {}
        : { note: t("onboarding.plan.week.empty") })}
    >
      {workouts.map((w) => (
        <View key={w.id} style={{ gap: 8 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            {w.kind !== undefined && <DayMark kind={w.kind} filled onDark />}
            <Text
              numberOfLines={1}
              style={[type.bodyBold, { flex: 1, fontSize: 15, color: colors.white }]}
            >
              {w.name}
            </Text>
            {w.mine && <YoursTag />}
          </View>
          <DarkWeek
            week={WEEKDAYS.map((d) =>
              w.days.includes(d) ? (w.kind === undefined ? [] : [w.kind]) : null
            )}
            dim={dim}
            onToggle={(d) => onToggle(w.id, d)}
          />
        </View>
      ))}
    </DarkCard>
  );
}
