import React from "react";
import { Pressable, Text, View } from "react-native";
import { colors } from "@sendtally/design/tokens";
import {
  addDays,
  addMonths,
  monthStart,
  type Block,
  type CalendarDate,
} from "@sendtally/core/hang";
import { dayTitle, monthTitle, weekdayLetters } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";
import { bandOn, monthWeeks } from "../calendar/calendarGrid";
import { type } from "../type";
import { BlockBand } from "./BlockBand";
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
  /** Blocks to band across the weeks they cover, as the plan calendar shows them. */
  blocks?: readonly Block[];
  onPick: (d: CalendarDate) => void;
};

/** An inline month grid, Monday first, opening on the selected date's month. */
export function MonthCalendar({
  selected,
  picked,
  min,
  max,
  today,
  shaded,
  blocks,
  onPick,
}: MonthCalendarProps): React.ReactElement {
  const [month, setMonth] = React.useState(() => monthStart(selected));
  const inMonth = (d: CalendarDate): boolean => d.slice(0, 7) === month.slice(0, 7);
  const bandLabel = (monday: CalendarDate): string | null => {
    const band = blocks === undefined ? null : bandOn(blocks, monday);
    return band === null
      ? null
      : t("calendar.band", { name: band.block.name, at: band.week, of: band.block.weeks });
  };

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
      {monthWeeks(month).map((monday) => (
        <View key={monday}>
          {blocks !== undefined && <BlockBand label={bandLabel(monday)} />}
          <View style={{ flexDirection: "row" }}>
            {Array.from({ length: 7 }, (_, i) => addDays(monday, i)).map((d) => {
              if (!inMonth(d)) return <View key={d} style={{ width: `${100 / 7}%` }} />;
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
                  accessibilityLabel={
                    inBlock ? t("hang.inBlock", { date: dayTitle(d) }) : dayTitle(d)
                  }
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
      ))}
    </View>
  );
}
