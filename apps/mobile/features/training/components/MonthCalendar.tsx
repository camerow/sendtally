import React from "react";
import { Pressable, Text, View } from "react-native";
import { colors } from "@sendtally/design/tokens";
import {
  addMonths,
  calendarDate,
  daysInMonth,
  monthStart,
  weekday,
  type CalendarDate,
} from "@sendtally/core/hang";
import { dayTitle, monthTitle, weekdayLetters } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";
import { type } from "../type";
import { IconButton } from "./IconButton";
import { Label } from "./Label";

export type MonthCalendarProps = {
  /** The date it opens on, marked as picked unless `picked` lists several. */
  selected: CalendarDate;
  picked?: readonly CalendarDate[];
  min: CalendarDate | null;
  max?: CalendarDate;
  today: CalendarDate;
  shaded: (d: CalendarDate) => boolean;
  onPick: (d: CalendarDate) => void;
};

const dayOf = (month: CalendarDate, day: number): CalendarDate => {
  const [y, m] = month.split("-").map(Number);
  return calendarDate(y ?? 1970, (m ?? 1) - 1, day);
};

/** An inline month grid, Monday first, opening on the selected date's month. */
export function MonthCalendar({
  selected,
  picked,
  min,
  max,
  today,
  shaded,
  onPick,
}: MonthCalendarProps): React.ReactElement {
  const [month, setMonth] = React.useState(() => monthStart(selected));
  const lead = weekday(month);
  const days = Array.from({ length: daysInMonth(month) }, (_, i) => dayOf(month, i + 1));
  const cells: (CalendarDate | null)[] = [...Array.from({ length: lead }, () => null), ...days];

  return (
    <View
      style={{
        gap: 6,
        padding: 10,
        paddingBottom: 12,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: colors.lineOnLight,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <IconButton
          icon="back"
          label={t("hang.previousMonth")}
          onPress={() => setMonth(addMonths(month, -1))}
          color={colors.gunmetal}
          iconSize={18}
        />
        <Text
          style={[
            type.bodyBold,
            { fontSize: 15, color: colors.gunmetal, textTransform: "capitalize" },
          ]}
        >
          {monthTitle(month)}
        </Text>
        <IconButton
          icon="forward"
          label={t("hang.nextMonth")}
          onPress={() => setMonth(addMonths(month, 1))}
          color={colors.gunmetal}
          iconSize={18}
        />
      </View>
      <View style={{ flexDirection: "row" }}>
        {weekdayLetters().map((letter, i) => (
          <Label
            key={i}
            small
            color={colors.textSecondary}
            style={{ flex: 1, textAlign: "center" }}
          >
            {letter}
          </Label>
        ))}
      </View>
      <View style={{ flexDirection: "row", flexWrap: "wrap", rowGap: 2 }}>
        {cells.map((d, i) => {
          if (d === null) return <View key={`lead-${i}`} style={{ width: `${100 / 7}%` }} />;
          const off = (min !== null && d < min) || (max !== undefined && d > max);
          const on = picked === undefined ? d === selected : picked.includes(d);
          const inBlock = !off && shaded(d);
          return (
            <Pressable
              key={d}
              disabled={off}
              onPress={() => onPick(d)}
              accessibilityRole="button"
              accessibilityState={{ selected: on, disabled: off }}
              accessibilityLabel={inBlock ? t("hang.inBlock", { date: dayTitle(d) }) : dayTitle(d)}
              style={{ width: `${100 / 7}%`, height: 42, padding: 1 }}
            >
              <View
                style={{
                  flex: 1,
                  borderRadius: 21,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: on
                    ? colors.gunmetal
                    : inBlock
                      ? colors.surfaceSoft
                      : d === today
                        ? colors.gold
                        : undefined,
                }}
              >
                <Text
                  style={[
                    type.monoBold,
                    {
                      fontSize: 14,
                      color: on ? colors.white : colors.gunmetal,
                      opacity: off ? 0.3 : 1,
                    },
                  ]}
                >
                  {Number(d.slice(8))}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
