import { router } from "expo-router";
import React from "react";
import { ScrollView, View } from "react-native";
import { addMonths, monthStart, type CalendarDate } from "@sendtally/core/hang";
import { colors } from "@sendtally/design/tokens";
import { monthTitle, weekdayLetters } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";
import { trainingWeek, useTrainingLog } from "@sendtally/features/training";
import { BackButton } from "../../../components/BackButton";
import { useApi } from "../../../lib/api";
import { Button } from "../components/Button";
import { IconButton } from "../components/IconButton";
import { Label } from "../components/Label";
import { Title } from "../components/Title";
import { useHangData } from "../data/HangDataContext";
import { CalendarLegend } from "./CalendarLegend";
import { CalendarWeek } from "./CalendarWeek";
import { bandOn, monthWeeks } from "./calendarGrid";

/** The plan a month at a time: blocks as bands, a mark per planned workout; tap a day to open it. */
export function CalendarScreen(): React.ReactElement {
  const { today } = useHangData();
  const { log } = useTrainingLog(useApi());
  const [month, setMonth] = React.useState(() => monthStart(today));

  const bandOf = (monday: CalendarDate): string | null => {
    const band = bandOn(log.plan.blocks, monday);
    return band === null
      ? null
      : t("calendar.band", { name: band.block.name, at: band.week, of: band.block.weeks });
  };

  return (
    <View style={{ flex: 1 }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
          paddingHorizontal: 18,
          paddingTop: 8,
        }}
      >
        <View style={{ flex: 1, alignItems: "flex-start" }}>
          <BackButton />
        </View>
        <Button
          label={t("training.today")}
          onPress={() => setMonth(monthStart(today))}
          variant="outline"
          height={40}
        />
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 24, gap: 6 }}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <IconButton
            icon="back"
            label={t("hang.previousMonth")}
            onPress={() => setMonth(addMonths(month, -1))}
            color={colors.gunmetal}
          />
          <Title size={20} style={{ flex: 1, textAlign: "center", textTransform: "capitalize" }}>
            {monthTitle(month)}
          </Title>
          <IconButton
            icon="forward"
            label={t("hang.nextMonth")}
            onPress={() => setMonth(addMonths(month, 1))}
            color={colors.gunmetal}
          />
        </View>
        <View
          style={{
            flexDirection: "row",
            paddingBottom: 6,
            borderBottomWidth: 1,
            borderBottomColor: colors.lineOnLightSoft,
          }}
        >
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
          <CalendarWeek
            key={monday}
            days={trainingWeek(log, monday, today)}
            month={month}
            band={bandOf(monday)}
            onPress={(date) => router.push({ pathname: "/plan/day", params: { date } })}
          />
        ))}
      </ScrollView>
      <View
        style={{
          paddingHorizontal: 18,
          paddingTop: 10,
          paddingBottom: 20,
          borderTopWidth: 1,
          borderTopColor: colors.lineOnLight,
        }}
      >
        <CalendarLegend />
      </View>
    </View>
  );
}
