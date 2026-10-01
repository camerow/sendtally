import React from "react";
import { Text, View } from "react-native";
import { addDays, dayState, type CalendarDate } from "@sendtally/core/hang";
import { dayTitle, weekRange, weekTitle, weekdayLetters } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";
import { IconButton } from "../../components/IconButton";
import { Label } from "../../components/Label";
import { useTheme } from "../../theme/ThemeContext";
import { type } from "../../theme/type";
import { useHangData } from "../data/HangDataContext";
import { DayCell } from "./DayCell";

export type WeekStripProps = {
  offset: number;
  weekStart: CalendarDate;
  selected: CalendarDate;
  onSelect: (d: CalendarDate) => void;
  onOffset: (offset: number) => void;
};

export function WeekStrip({
  offset,
  weekStart,
  selected,
  onSelect,
  onOffset,
}: WeekStripProps): React.ReactElement {
  const c = useTheme();
  const { model, today } = useHangData();
  const letters = weekdayLetters();
  return (
    <View
      style={{
        gap: 10,
        paddingTop: 12,
        paddingHorizontal: 8,
        paddingBottom: 10,
        marginHorizontal: -8,
        borderRadius: 18,
        backgroundColor: c.deep,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 4,
        }}
      >
        <IconButton
          icon="back"
          label={t("hang.previousWeek")}
          onPress={() => onOffset(offset - 1)}
          color={c.onDark2}
          size={36}
          iconSize={18}
        />
        <View style={{ alignItems: "center", gap: 2 }}>
          <Label color={c.onDark}>{weekTitle(offset)}</Label>
          <Text style={[type.mono, { fontSize: 11, color: c.onDark3 }]}>
            {weekRange(weekStart)}
          </Text>
        </View>
        <IconButton
          icon="forward"
          label={t("hang.nextWeek")}
          onPress={() => onOffset(offset + 1)}
          color={c.onDark2}
          size={36}
          iconSize={18}
        />
      </View>
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        {letters.map((letter, i) => {
          const d = addDays(weekStart, i);
          const state = dayState(model.data.schedules, model.sessions, d, today);
          const title = dayTitle(d);
          const label = state.trained
            ? t("hang.dayTrained", { day: title })
            : state.missed
              ? t("hang.dayMissed", { day: title })
              : state.planned
                ? t("hang.dayPlanned", { day: title })
                : title;
          return (
            <DayCell
              key={d}
              letter={letter}
              day={Number(d.slice(8))}
              state={state}
              isToday={d === today}
              isFuture={d >= today}
              selected={d === selected}
              label={label}
              onPress={() => onSelect(d)}
            />
          );
        })}
      </View>
    </View>
  );
}
