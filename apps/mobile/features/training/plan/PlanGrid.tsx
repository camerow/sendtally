import React from "react";
import { Pressable, Text, View } from "react-native";
import { colors } from "@sendtally/design/tokens";
import { weekdayLetters } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";
import { pressRow } from "../../../lib/press";
import { Label } from "../components/Label";
import { GOLD_TINT } from "../components/tints";
import { DayMark } from "../today/DayMark";
import { KIND_LOOK } from "../today/kindLook";
import { type } from "../type";
import type { PlanGridRow } from "./planGridRows";

const CELL = 24;

function Cell({ row, day }: { row: PlanGridRow; day: number }): React.ReactElement {
  const on = row.days.includes(day);
  return (
    <View
      style={{
        width: CELL,
        height: CELL,
        borderRadius: 7,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: on ? KIND_LOOK[row.kind].tint : colors.surfaceSoft,
      }}
    >
      {on ? (
        <DayMark kind={row.kind} filled />
      ) : (
        <View
          style={{ width: 3, height: 3, borderRadius: 2, backgroundColor: "rgba(64,63,76,0.25)" }}
        />
      )}
    </View>
  );
}

export type PlanGridProps = {
  rows: readonly PlanGridRow[];
  /** Off inside a card that already draws the frame. */
  framed?: boolean;
  /** A plan just added, lit for a moment. */
  highlight?: string | null;
};

/** The week at a glance: a row per plan, a column per weekday, marked where it lands. Tap a row to open it. */
export function PlanGrid({ rows, framed = true, highlight }: PlanGridProps): React.ReactElement {
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
      <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
        <Label color={colors.gunmetal} style={{ flex: 1 }}>
          {t("plan.week")}
        </Label>
        {weekdayLetters().map((letter, i) => (
          <Label
            key={i}
            small
            color={colors.textSecondary}
            style={{ width: CELL, textAlign: "center" }}
          >
            {letter}
          </Label>
        ))}
      </View>
      {rows.map((row) => (
        <Pressable
          key={row.key}
          onPress={row.open}
          accessibilityRole="button"
          accessibilityLabel={row.name}
          style={pressRow({
            flexDirection: "row",
            alignItems: "center",
            gap: 5,
            paddingVertical: 7,
            borderTopWidth: 1,
            borderTopColor: colors.lineOnLightSoft,
            backgroundColor: row.key === highlight ? GOLD_TINT : undefined,
          })}
        >
          <View style={{ flex: 1, minWidth: 0, gap: 1 }}>
            <Text
              numberOfLines={1}
              style={[type.bodyBold, { fontSize: 14, color: colors.gunmetal }]}
            >
              {row.name}
            </Text>
            <Text
              numberOfLines={2}
              style={[type.mono, { fontSize: 11, color: KIND_LOOK[row.kind].ink }]}
            >
              {row.sub}
            </Text>
          </View>
          {[0, 1, 2, 3, 4, 5, 6].map((day) => (
            <Cell key={day} row={row} day={day} />
          ))}
        </Pressable>
      ))}
    </View>
  );
}
