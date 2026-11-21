import React from "react";
import { Text, View } from "react-native";
import { addDays, type CalendarDate, type Weekday, type WorkoutKind } from "@sendtally/core/hang";
import { colors } from "@sendtally/design/tokens";
import { weekdayLetters } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";
import { KIND_LOOK } from "@sendtally/features/training";
import { darkMeta } from "../../components/DarkCard";
import { type } from "../../../training/type";

export type PlanCalendarProps = {
  /** A Monday. */
  start: CalendarDate;
  weeks: number;
  days: readonly { kind: WorkoutKind; weekdays: readonly Weekday[] }[];
};

const DAYS = [0, 1, 2, 3, 4, 5, 6] as const;
const WEEK_COLUMN = 26;

/** The whole block, a row a week, each day dotted with the workouts on it. */
export function PlanCalendar({ start, weeks, days }: PlanCalendarProps): React.ReactElement {
  const letters = weekdayLetters();
  return (
    <View style={{ gap: 5 }}>
      <View style={{ flexDirection: "row", gap: 5 }}>
        <View style={{ width: WEEK_COLUMN }} />
        {DAYS.map((d) => (
          <Text
            key={d}
            style={[
              type.mono,
              { flex: 1, fontSize: 10, color: darkMeta.color, textAlign: "center" },
            ]}
          >
            {letters[d]}
          </Text>
        ))}
      </View>
      {Array.from({ length: weeks }, (_, w) => (
        <View key={w} style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
          <Text style={[type.mono, { width: WEEK_COLUMN, fontSize: 10, color: darkMeta.color }]}>
            {t("plan.weekShort", { n: w + 1 })}
          </Text>
          {DAYS.map((d) => {
            const kinds = days.filter((m) => m.weekdays.includes(d)).map((m) => m.kind);
            const on = kinds.length > 0;
            return (
              <View
                key={d}
                style={{
                  flex: 1,
                  height: 38,
                  borderRadius: 9,
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 3,
                  backgroundColor: on ? "rgba(255,255,255,0.14)" : "rgba(255,255,255,0.07)",
                }}
              >
                <Text
                  style={[
                    type.monoBold,
                    { fontSize: 11, color: on ? colors.white : darkMeta.color },
                  ]}
                >
                  {Number(addDays(start, w * 7 + d).slice(8))}
                </Text>
                {on && (
                  <View style={{ flexDirection: "row", gap: 2 }}>
                    {kinds.map((k, i) => (
                      <View
                        key={i}
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: 3,
                          backgroundColor: KIND_LOOK[k].onDark,
                        }}
                      />
                    ))}
                  </View>
                )}
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}
