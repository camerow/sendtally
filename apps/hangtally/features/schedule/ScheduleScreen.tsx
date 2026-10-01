import { useNavigation } from "expo-router";
import React from "react";
import { View } from "react-native";
import {
  addDays,
  maxDate,
  weekStart,
  weekday,
  type CalendarDate,
  type Schedule,
} from "@sendtally/core/hang";
import { longDate, monthName } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";
import { Label } from "../../components/Label";
import { StatGrid } from "../../components/StatGrid";
import { TabScreen } from "../../components/TabScreen";
import { Title } from "../../components/Title";
import { useTheme } from "../../theme/ThemeContext";
import { useHangData } from "../data/HangDataContext";
import { PlanList } from "../plans/PlanList";
import { PlannerSheet } from "../planner/PlannerSheet";
import type { PlannerRequest } from "../planner/types";
import { SessionEditorSheet } from "../session-editor/SessionEditorSheet";
import { startWorkout } from "../timer/startWorkout";
import { DaySection } from "./DaySection";
import { RecentSessions } from "./RecentSessions";
import { scheduleDay, scheduleStats } from "./scheduleDay";
import { WeekStrip } from "./WeekStrip";

export function ScheduleScreen(): React.ReactElement {
  const c = useTheme();
  const navigation = useNavigation();
  const { model, actions, today } = useHangData();
  const [offset, setOffset] = React.useState(0);
  const [selected, setSelected] = React.useState<CalendarDate>(today);
  const [planner, setPlanner] = React.useState<PlannerRequest | null>(null);
  const [editing, setEditing] = React.useState<string | null>(null);

  React.useEffect(
    () =>
      navigation.addListener("tabPress" as never, () => {
        setOffset(0);
        setSelected(today);
      }),
    [navigation, today]
  );

  const monday = addDays(weekStart(today), offset * 7);
  const changeWeek = (next: number): void => {
    setOffset(next);
    setSelected(addDays(addDays(weekStart(today), next * 7), weekday(selected)));
  };
  const day = scheduleDay(model.data.schedules, model.sessions, selected, today);
  const stats = scheduleStats(model.data.schedules, model.sessions, today);
  const edit = (schedule: Schedule): void => setPlanner({ mode: "edit", schedule });
  const skip = (s: Schedule): void =>
    void actions.saveSchedules([{ ...s, skip: [...s.skip, selected] }]);

  return (
    <TabScreen>
      <View style={{ gap: 8 }}>
        <Title size={38} color={c.onDark}>
          {t("hang.tabSchedule")}
        </Title>
        <Label color={c.accent}>{longDate(today)}</Label>
      </View>
      <WeekStrip
        offset={offset}
        weekStart={monday}
        selected={selected}
        onSelect={setSelected}
        onOffset={changeWeek}
      />
      <DaySection
        day={day}
        onOpenSession={setEditing}
        onEditSchedule={edit}
        onStart={(s) => startWorkout(s.workoutId, s.gripId)}
        onSkip={skip}
        onAdd={() =>
          setPlanner({
            mode: "new",
            workoutId: null,
            gripId: null,
            days: [weekday(selected)],
            start: maxDate(selected, today),
          })
        }
      />
      <View style={{ gap: 8 }}>
        <Label color={c.onDark3} style={{ paddingBottom: 2 }}>
          {t("hang.plans")}
        </Label>
        <PlanList empty={t("hang.noPlans")} showName onOpen={edit} />
      </View>
      <StatGrid
        columns={3}
        stats={[
          { label: t("hang.statStreak"), value: String(stats.streak) },
          { label: t("hang.statThisWeek"), value: `${stats.done}/${stats.planned}` },
          {
            label: t("hang.statHangTime", { month: monthName(today) }),
            value: t("hang.minutes", { n: Math.round(stats.hangSeconds / 60) }),
          },
        ]}
      />
      <RecentSessions onOpen={setEditing} />
      <PlannerSheet request={planner} onClose={() => setPlanner(null)} />
      <SessionEditorSheet sessionId={editing} onClose={() => setEditing(null)} />
    </TabScreen>
  );
}
