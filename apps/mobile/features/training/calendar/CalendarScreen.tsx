import { router } from "expo-router";
import React from "react";
import { ScrollView, Text, View } from "react-native";
import { addMonths, blockWeekOn, monthStart, type CalendarDate } from "@sendtally/core/hang";
import { colors } from "@sendtally/design/tokens";
import { monthTitle, weekdayLetters } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";
import { trainingWeek, useTrainingLog } from "@sendtally/features/training";
import { BackButton } from "../../../components/BackButton";
import { useApi } from "../../../lib/api";
import { blockDates } from "../blocks/blockText";
import { Button } from "../components/Button";
import { IconButton } from "../components/IconButton";
import { Label } from "../components/Label";
import { Title } from "../components/Title";
import { useHangData } from "../data/HangDataContext";
import { type } from "../type";
import { CalendarLegend } from "./CalendarLegend";
import { CalendarWeek } from "./CalendarWeek";
import { bandOn, monthWeeks, newBlockHref, pickWeek, spanOf, type WeekPick } from "./calendarGrid";

/** The plan a month at a time: blocks as bands, a mark per planned workout; tap a day to open it. */
export function CalendarScreen(): React.ReactElement {
  const { today } = useHangData();
  const { log } = useTrainingLog(useApi());
  const [month, setMonth] = React.useState(() => monthStart(today));
  const [picking, setPicking] = React.useState(false);
  const [pick, setPick] = React.useState<WeekPick>(null);
  const span = pick === null ? null : spanOf(pick);

  const open = (date: CalendarDate): void => {
    if (picking) setPick(pickWeek(pick, date));
    else router.push({ pathname: "/plan/day", params: { date } });
  };
  const stopPicking = (): void => {
    setPicking(false);
    setPick(null);
  };
  const bandOf = (monday: CalendarDate): { label: string | null; picked: boolean } => {
    const at = span === null ? null : blockWeekOn(span, monday);
    if (at !== null && span !== null)
      return {
        label: t("calendar.band", { name: t("calendar.newBlock"), at, of: span.weeks }),
        picked: true,
      };
    const band = bandOn(log.plan.blocks, monday);
    return {
      label:
        band === null
          ? null
          : t("calendar.band", { name: band.block.name, at: band.week, of: band.block.weeks }),
      picked: false,
    };
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
        {picking ? (
          <>
            <Title size={22} style={{ flex: 1 }}>
              {t("calendar.newBlock")}
            </Title>
            <Button
              label={t("common.cancel")}
              onPress={stopPicking}
              variant="outline"
              height={40}
            />
          </>
        ) : (
          <>
            <View style={{ flex: 1, alignItems: "flex-start" }}>
              <BackButton label={t("plan.tabPlan")} />
            </View>
            <Button
              label={t("training.today")}
              onPress={() => setMonth(monthStart(today))}
              variant="outline"
              height={40}
            />
            <Button
              label={t("calendar.newBlock")}
              onPress={() => setPicking(true)}
              variant="outline"
              height={40}
              icon="plus"
            />
          </>
        )}
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 24, gap: 6 }}>
        {picking && (
          <Text
            style={[
              type.body,
              { fontSize: 14, lineHeight: 20, color: colors.textSecondary, paddingHorizontal: 6 },
            ]}
          >
            {t("calendar.pickHint")}
          </Text>
        )}
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
        {monthWeeks(month).map((monday) => {
          const band = bandOf(monday);
          return (
            <CalendarWeek
              key={monday}
              days={trainingWeek(log, monday, today)}
              month={month}
              band={band.label}
              picked={band.picked}
              onPress={open}
            />
          );
        })}
      </ScrollView>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
          paddingHorizontal: 18,
          paddingTop: 10,
          paddingBottom: 20,
          borderTopWidth: 1,
          borderTopColor: colors.lineOnLight,
        }}
      >
        {picking ? (
          <>
            <View style={{ flex: 1, gap: 2 }}>
              {span !== null && (
                <>
                  <Text style={[type.bodyBold, { fontSize: 15, color: colors.gunmetal }]}>
                    {t("calendar.weeks", { count: span.weeks })}
                  </Text>
                  <Text style={[type.mono, { fontSize: 12, color: colors.textSecondary }]}>
                    {blockDates(span)}
                  </Text>
                </>
              )}
            </View>
            <Button
              label={t("calendar.next")}
              onPress={() => span !== null && router.push(newBlockHref(span))}
              disabled={span === null}
              variant="primary"
              height={48}
            />
          </>
        ) : (
          <View style={{ flex: 1 }}>
            <CalendarLegend />
          </View>
        )}
      </View>
    </View>
  );
}
