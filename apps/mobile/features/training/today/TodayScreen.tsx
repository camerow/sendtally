import { useLocalSearchParams, useNavigation } from "expo-router";
import React from "react";
import { ScrollView, View } from "react-native";
import {
  addDays,
  daysBetween,
  isCalendarDate,
  weekStart,
  weekday,
  type CalendarDate,
} from "@sendtally/core/hang";
import { colors } from "@sendtally/design/tokens";
import { longDate } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";
import {
  blockGroups,
  blockMembers,
  trainingDay,
  trainingWeek,
  useTrainingLog,
  weekDone,
} from "@sendtally/features/training";
import { Fab } from "../../../components/Fab";
import { useApi } from "../../../lib/api";
import { Label } from "../components/Label";
import { useHangData } from "../data/HangDataContext";
import { AddKindSheet } from "../planning/AddKindSheet";
import { BlockRow } from "../train/BlockRow";
import { addOnDayLabel } from "./addOnDay";
import { DaySection } from "./DaySection";
import { openLogged } from "./openLogged";
import { WeekStrip } from "./WeekStrip";

const weekOffset = (today: CalendarDate, date: CalendarDate): number =>
  daysBetween(weekStart(today), weekStart(date)) / 7;

/** The training-mode home: this week's training, logged and planned, day by day. */
export function TodayScreen(): React.ReactElement {
  const navigation = useNavigation();
  const asked = useLocalSearchParams<{ date?: string; at?: string }>();
  const { today } = useHangData();
  const { log } = useTrainingLog(useApi());
  const [offset, setOffset] = React.useState(0);
  const [selected, setSelected] = React.useState<CalendarDate>(today);
  const [adding, setAdding] = React.useState(false);
  const request = asked.date !== undefined && isCalendarDate(asked.date) ? asked.date : null;
  const [seen, setSeen] = React.useState<string | null>(null);
  const requestKey = request === null ? null : `${request}:${asked.at ?? ""}`;
  if (requestKey !== seen) {
    setSeen(requestKey);
    if (request !== null) {
      setOffset(weekOffset(today, request));
      setSelected(request);
    }
  }

  React.useEffect(
    () =>
      navigation.addListener("tabPress" as never, () => {
        setOffset(0);
        setSelected(today);
      }),
    [navigation, today]
  );

  const monday = addDays(weekStart(today), offset * 7);
  const days = trainingWeek(log, monday, today);
  const day = trainingDay(log, selected, today);
  const running = blockGroups(log.plan.blocks, today).current;

  const changeWeek = (next: number): void => {
    setOffset(next);
    setSelected(addDays(addDays(weekStart(today), next * 7), weekday(selected)));
  };
  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={{ gap: 16, paddingHorizontal: 18, paddingTop: 4, paddingBottom: 96 }}
      >
        <Label color={colors.gunmetal}>{longDate(today)}</Label>
        <WeekStrip
          offset={offset}
          days={days}
          done={t("plan.doneOf", weekDone(days))}
          selected={selected}
          onSelect={setSelected}
          onOffset={changeWeek}
        />
        {running.length > 0 && (
          <View>
            <Label color={colors.textSecondary}>
              {t("plan.blocksInProgress", { count: running.length })}
            </Label>
            {running.map((b) => (
              <BlockRow
                key={b.id}
                id={b.id}
                name={b.name}
                meta={t("plan.workoutCount", { count: blockMembers(log.plan, b).length })}
              />
            ))}
          </View>
        )}
        <DaySection day={day} onOpen={openLogged} />
      </ScrollView>
      <Fab label={addOnDayLabel(selected, today)} onPress={() => setAdding(true)} />
      <AddKindSheet
        flow={{ date: selected, blockId: null }}
        visible={adding}
        onClose={() => setAdding(false)}
      />
    </View>
  );
}
