import React from "react";
import { Text } from "react-native";
import type { CalendarDate } from "@sendtally/core/hang";
import { colors } from "@sendtally/design/tokens";
import { shortDate } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";
import { AMBER } from "../components/tints";
import { type } from "../type";

export type DayLineProps = { week: number | null; date: CalendarDate; missed: boolean };

/** A planned run's week and day under its title: "Week 2 · Thu, Nov 5", the day amber once missed. */
export function DayLine({ week, date, missed }: DayLineProps): React.ReactElement {
  const day = shortDate(date);
  return (
    <Text style={[type.bodyBold, { fontSize: 16, color: colors.gunmetal }]}>
      {week !== null && `${t("plan.weekNumber", { n: week })} · `}
      {missed ? <Text style={{ color: AMBER }}>{t("plan.missedOn", { day })}</Text> : day}
    </Text>
  );
}
