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
  /** A dated week's day numbers by weekday, Monday first, under the weekday letters. */
  dates?: readonly string[];
  /** The weekdays left to right: Monday first unless a dated week starts on another. */
  columns?: readonly number[];
  /** Under the title, such as Edit days. */
  action?: React.ReactNode;
  /** Every cell a day to set: off cells read as white boxes. */
  editing?: boolean;
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
  columns = DAYS,
  action,
  editing = false,
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
        <View style={{ flex: 1, gap: 2 }}>
          <Label color={colors.gunmetal}>{title}</Label>
          {action}
        </View>
        {columns.map((i) => (
          <View key={i} style={{ width: CELL, alignItems: "center", gap: 1 }}>
            <Label small color={colors.textSecondary} style={{ textAlign: "center" }}>
              {weekdayLetters()[i]}
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
        const cells = columns.map((day) => {
          const mark = row.marks?.[day] ?? null;
          return (
            <DayCell
              key={day}
              kind={row.kind}
              on={row.marks === undefined ? row.days.includes(day) : mark !== null}
              size={CELL}
              status={mark ?? undefined}
              asking={toggle !== undefined && row.days.length === 0}
              onPress={toggle === undefined ? row.press?.(day) : () => toggle(day)}
              opens={toggle === undefined}
              editing={editing}
              accessibilityLabel={`${row.name}, ${weekdayLong(day)}`}
            />
          );
        });
        const line = {
          flexDirection: "row",
          alignItems: "center",
          gap: 5,
          paddingVertical: 7,
          borderTopWidth: 1,
          borderTopColor: colors.lineOnLightSoft,
          backgroundColor: row.key === lit ? GOLD_TINT : undefined,
        } as const;
        return toggle === undefined && row.press === undefined ? (
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
