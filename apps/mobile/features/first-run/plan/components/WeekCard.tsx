import React from "react";
import { Text, View } from "react-native";
import type { Weekday, WorkoutKind } from "@sendtally/core/hang";
import { colors } from "@sendtally/design/tokens";
import { weekdayLetters } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";
import { ON_DARK_SOFT, ON_DARK_TRACK } from "@sendtally/features/workouts";
import { DayMark } from "../../../training/today/DayMark";
import { type } from "../../../training/type";
import { DarkCard } from "../../components/DarkCard";

export type WeekCardProps = {
  /** The days on, with the kinds of what lands on each; an empty list is a day on with no workout yet. */
  week: readonly (readonly WorkoutKind[] | null)[];
  /** The line beside the label once a day is on, and the prompt while none is. */
  meta: string;
  empty: string;
};

/** "Your week": seven days, lit where the user can train, with each workout's mark on its days. */
export function WeekCard({ week, meta, empty }: WeekCardProps): React.ReactElement {
  const letters = weekdayLetters();
  const any = week.some((d) => d !== null);
  return (
    <DarkCard label={t("plan.week")} {...(any ? { meta } : { note: empty })}>
      <View style={{ flexDirection: "row", gap: 6 }}>
        {week.map((kinds, i) => (
          <View key={i} style={{ flex: 1, alignItems: "center", gap: 6 }}>
            <View
              style={{
                width: "100%",
                height: 40,
                borderRadius: 10,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 3,
                backgroundColor: kinds === null ? ON_DARK_TRACK : "rgba(249,220,92,0.18)",
                borderWidth: kinds === null ? 0 : 1.5,
                borderColor: colors.gold,
              }}
            >
              {kinds?.map((k, j) => (
                <DayMark key={j} kind={k} filled onDark />
              ))}
            </View>
            <Text style={[type.mono, { fontSize: 10, color: ON_DARK_SOFT }]}>
              {letters[i as Weekday]}
            </Text>
          </View>
        ))}
      </View>
    </DarkCard>
  );
}
