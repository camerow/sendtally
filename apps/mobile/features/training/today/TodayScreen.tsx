import { router, useNavigation } from "expo-router";
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
import { colors } from "@sendtally/design/tokens";
import { longDate } from "@sendtally/features/hang";
import { useActivities, usePlanItems } from "@sendtally/features/activities";
import { formatNumber, t } from "@sendtally/features/i18n";
import { queries, useQuery } from "@sendtally/features/query";
import {
  trainingDay,
  trainingWeek,
  weekStats,
  type LoggedItem,
  type TrainingLog,
} from "@sendtally/features/training";
import { useApi } from "../../../lib/api";
import { Label } from "../components/Label";
import { StatGrid } from "../components/StatGrid";
import { useHangData } from "../data/HangDataContext";
import { PlanSheets } from "../plan/PlanSheets";
import type { PlanRequest } from "../plan/types";
import { usePlanActions } from "../plan/usePlanActions";
import { SessionEditorSheet } from "../session-editor/SessionEditorSheet";
import { startWorkout } from "../timer/startWorkout";
import { DaySection } from "./DaySection";
import { WeekStrip } from "./WeekStrip";

/** The training-mode home: this week's training, logged and planned, day by day. */
export function TodayScreen(): React.ReactElement {
  const api = useApi();
  const navigation = useNavigation();
  const { model, actions, today } = useHangData();
  const sessions = useQuery(queries.sessions(api)).state;
  const planItems = usePlanItems(api).state;
  const activities = useActivities(api).state;
  const planActions = usePlanActions();
  const [offset, setOffset] = React.useState(0);
  const [selected, setSelected] = React.useState<CalendarDate>(today);
  const [plan, setPlan] = React.useState<PlanRequest | null>(null);
  const [editing, setEditing] = React.useState<string | null>(null);

  React.useEffect(
    () =>
      navigation.addListener("tabPress" as never, () => {
        setOffset(0);
        setSelected(today);
      }),
    [navigation, today]
  );

  const climbs = sessions.status === "ready" ? sessions.data.sessions : null;
  const items = planItems.status === "ready" ? planItems.data : null;
  const logged = activities.status === "ready" ? activities.data : null;
  const log = React.useMemo(
    (): TrainingLog => ({
      climbs: climbs ?? [],
      hangs: model.sessions,
      schedules: model.data.schedules,
      activities: logged ?? [],
      planItems: items ?? [],
    }),
    [climbs, model, logged, items]
  );
  const monday = addDays(weekStart(today), offset * 7);
  const days = trainingWeek(log, monday, today);
  const day = trainingDay(log, selected, today);
  const stats = weekStats(log, today);

  const changeWeek = (next: number): void => {
    setOffset(next);
    setSelected(addDays(addDays(weekStart(today), next * 7), weekday(selected)));
  };
  const open = (item: LoggedItem): void => {
    if (item.kind === "hang") setEditing(item.session.id);
    else
      router.push({
        pathname: "/session/[fingerprint]",
        params: { fingerprint: item.session.fingerprint },
      });
  };
  const skip = (s: Schedule): void =>
    void actions.saveSchedules([{ ...s, skip: [...s.skip, selected] }]);

  return (
    <View style={{ gap: 16 }}>
      <Label color={colors.labelAccent}>{longDate(today)}</Label>
      <WeekStrip
        offset={offset}
        days={days}
        selected={selected}
        onSelect={setSelected}
        onOffset={changeWeek}
      />
      <DaySection
        day={day}
        onOpen={open}
        onEditPlan={(schedule) => setPlan({ mode: "hang", request: { mode: "edit", schedule } })}
        onStart={(s) => startWorkout(s.workoutId, s.gripId)}
        onSkip={skip}
        onEditItem={(item) => setPlan({ mode: "item", request: { mode: "edit", item } })}
        onSkipItem={(item) => void planActions.setPlanItemSkip(item.id, selected, true)}
        onAdd={() =>
          setPlan({ mode: "choose", days: [weekday(selected)], start: maxDate(selected, today) })
        }
      />
      <StatGrid
        columns={3}
        stats={[
          {
            label: t("training.statDone"),
            value: t("training.doneOf", { done: stats.done, planned: stats.planned }),
          },
          {
            label: t("hang.statAvgEffort"),
            value:
              stats.effort === null
                ? "–"
                : formatNumber(stats.effort, {
                    minimumFractionDigits: 1,
                    maximumFractionDigits: 1,
                  }),
          },
          { label: t("hang.statStreak"), value: formatNumber(stats.streak) },
        ]}
      />
      <PlanSheets request={plan} onChange={setPlan} />
      <SessionEditorSheet sessionId={editing} onClose={() => setEditing(null)} />
    </View>
  );
}
