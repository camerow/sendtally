import React from "react";
import { Text, View } from "react-native";
import type { WorkoutKind } from "@sendtally/core/hang";
import { colors } from "@sendtally/design/tokens";
import { weekdayLetters, weekdayLong } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";
import { weekDaysRows, type WeekDaysArgs, type WeekDaysRow } from "@sendtally/features/training";
import { Label } from "../components/Label";
import { DayCell } from "../plan/DayCell";
import { type } from "../type";

const CELL = 28;

export type WeekDaysGridProps = WeekDaysArgs & { kind: WorkoutKind };

/**
 * A workout's days in its block, a row per week. A day gone by shows how it went. Editing, Every week on top sets them from this week
 * on (all weeks on a template), and each cell sets its week alone.
 */
export function WeekDaysGrid({ kind, ...args }: WeekDaysGridProps): React.ReactElement {
  const { columns, every, weeks } = weekDaysRows(args);
  const row = ({ key, name, sub, bold, cells }: WeekDaysRow): React.ReactElement => (
    <View key={key} style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text
          numberOfLines={1}
          style={[
            bold ? type.monoBold : type.mono,
            { fontSize: 12, color: bold ? colors.gunmetal : colors.textSecondary },
          ]}
        >
          {name}
        </Text>
        {sub !== undefined && (
          <Text numberOfLines={1} style={[type.mono, { fontSize: 10.5, color: colors.textMuted }]}>
            {sub}
          </Text>
        )}
      </View>
      {cells.map(({ day, on, mark, toggle }) => (
        <DayCell
          key={day}
          kind={kind}
          on={on}
          size={CELL}
          status={mark}
          onPress={toggle}
          editing={toggle !== undefined}
          accessibilityLabel={`${name}, ${weekdayLong(day)}`}
        />
      ))}
    </View>
  );

  return (
    <View style={{ gap: 6 }}>
      <View style={{ flexDirection: "row", gap: 5 }}>
        <Label small color={colors.gunmetal} style={{ flex: 1 }}>
          {t("plan.days")}
        </Label>
        {columns.map((day) => (
          <Label
            key={day}
            small
            color={colors.textSecondary}
            style={{ width: CELL, textAlign: "center" }}
          >
            {weekdayLetters()[day]}
          </Label>
        ))}
      </View>
      {every !== null && (
        <View
          style={{
            paddingBottom: 6,
            borderBottomWidth: 1,
            borderBottomColor: colors.lineOnLightSoft,
          }}
        >
          {row(every)}
        </View>
      )}
      {weeks.map(row)}
    </View>
  );
}
