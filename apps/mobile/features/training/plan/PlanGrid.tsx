import React from "react";
import { Pressable, Text, View } from "react-native";
import { colors } from "@sendtally/design/tokens";
import { weekdayLetters, weekdayLong } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";
import { pressRow } from "../../../lib/press";
import { Label } from "../components/Label";
import { GOLD_TINT } from "../components/tints";
import { KIND_LOOK } from "../today/kindLook";
import { DayCell } from "./DayCell";
import { type } from "../type";
import type { GridPart, PlanGridRow } from "./planGridRows";

const CELL = 24;
const DAYS = [0, 1, 2, 3, 4, 5, 6];

export type PlanGridProps = {
  rows: readonly PlanGridRow[];
  /** Off inside a card that already draws the frame. */
  framed?: boolean;
  /** The key of a row just added, lit for a moment. */
  lit?: string;
  /** Over the grid: Your week unless it says which. */
  title?: string;
  /** A dated week's day numbers, Monday first, under the weekday letters. */
  dates?: readonly string[];
};

function Line({ parts, ink }: { parts: readonly GridPart[]; ink: string }): React.ReactElement {
  return (
    <Text numberOfLines={1} style={[type.mono, { fontSize: 11, color: ink }]}>
      {parts.map((p, i) => (
        <Text key={i}>
          {i > 0 && " · "}
          <Text
            style={p.changed === true && { backgroundColor: GOLD_TINT, color: colors.gunmetal }}
          >
            {p.text}
          </Text>
        </Text>
      ))}
    </Text>
  );
}

/**
 * The week at a glance: a row per plan, a column per weekday, marked where it lands. Tap a
 * row to open it; on a block being built, tap a cell to set its day.
 */
export function PlanGrid({
  rows,
  framed = true,
  lit,
  title = t("plan.week"),
  dates,
}: PlanGridProps): React.ReactElement {
  return (
    <View
      style={[
        { gap: 8 },
        framed && {
          padding: 18,
          borderRadius: 18,
          borderWidth: 1,
          borderColor: colors.lineOnLightStrong,
        },
      ]}
    >
      <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 5 }}>
        <Label color={colors.gunmetal} style={{ flex: 1 }}>
          {title}
        </Label>
        {weekdayLetters().map((letter, i) => (
          <View key={i} style={{ width: CELL, alignItems: "center", gap: 1 }}>
            <Label small color={colors.textSecondary} style={{ textAlign: "center" }}>
              {letter}
            </Label>
            {dates !== undefined && (
              <Text style={[type.mono, { fontSize: 11, color: colors.gunmetal }]}>{dates[i]}</Text>
            )}
          </View>
        ))}
      </View>
      {rows.map((row) => {
        const name = (
          <View style={{ flex: 1, minWidth: 0, gap: 1 }}>
            <Text
              numberOfLines={1}
              style={[type.bodyBold, { fontSize: 14, color: colors.gunmetal }]}
            >
              {row.name}
            </Text>
            {row.lines.map((parts, i) => (
              <Line key={i} parts={parts} ink={KIND_LOOK[row.kind].ink} />
            ))}
          </View>
        );
        const { toggle } = row;
        const cells = DAYS.map((day) => (
          <DayCell
            key={day}
            kind={row.kind}
            on={row.days.includes(day)}
            size={CELL}
            status={row.marks?.[day] ?? undefined}
            asking={toggle !== undefined && row.days.length === 0}
            onPress={toggle === undefined ? undefined : () => toggle(day)}
            accessibilityLabel={`${row.name}, ${weekdayLong(day)}`}
          />
        ));
        const line = {
          flexDirection: "row",
          alignItems: "center",
          gap: 5,
          paddingVertical: 7,
          borderTopWidth: 1,
          borderTopColor: colors.lineOnLightSoft,
          backgroundColor: row.key === lit ? GOLD_TINT : undefined,
        } as const;
        return toggle === undefined ? (
          <Pressable
            key={row.key}
            onPress={row.open}
            accessibilityRole="button"
            accessibilityLabel={row.name}
            style={pressRow(line)}
          >
            {name}
            {cells}
          </Pressable>
        ) : (
          <View key={row.key} style={line}>
            <Pressable
              onPress={row.open}
              accessibilityRole="button"
              accessibilityLabel={row.name}
              style={pressRow({ flex: 1, minWidth: 0 })}
            >
              {name}
            </Pressable>
            {cells}
          </View>
        );
      })}
    </View>
  );
}
