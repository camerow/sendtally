import React from "react";
import { View } from "react-native";
import type { PlanItem } from "@sendtally/api-client";
import { weekStart, type Schedule } from "@sendtally/core/hang";
import { colors } from "@sendtally/design/tokens";
import { dayTitle } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";
import {
  dayMarks,
  markKind,
  type LoggedItem,
  type TrainingDay,
} from "@sendtally/features/training";
import { planTemplateOf } from "@sendtally/features/workouts";
import { Button } from "../components/Button";
import { DashedPanel } from "../components/DashedPanel";
import { Label } from "../components/Label";
import { Title } from "../components/Title";
import { useHangData } from "../data/HangDataContext";
import { useLibrary } from "../library/useLibrary";
import { GoalRow } from "./GoalRow";
import { LoggedRow } from "./LoggedRow";
import { loggedRowText } from "./loggedRowText";
import { logPlanItem } from "./logPlanItem";
import { PlanItemCard } from "./PlanItemCard";
import { PlanItemRow } from "./PlanItemRow";
import { PlannedRow } from "./PlannedRow";
import { startPlanItem } from "./startPlanItem";
import { UpTodayCard } from "./UpTodayCard";

export type DaySectionProps = {
  day: TrainingDay;
  onOpen: (item: LoggedItem) => void;
  onEditPlan: (schedule: Schedule) => void;
  onStart: (schedule: Schedule) => void;
  onSkip: (schedule: Schedule) => void;
  onEditItem: (item: PlanItem) => void;
  onSkipItem: (item: PlanItem) => void;
  onAdd: () => void;
};

const loggedKey = (item: LoggedItem): string => {
  if (item.kind === "activity") return item.activity.id;
  return item.kind === "climb" ? item.session.fingerprint : item.session.id;
};

function subtitle(day: TrainingDay): string {
  const marks = dayMarks(day);
  const logged = t("hang.loggedCount", { n: marks.filter((m) => m.filled).length });
  if (day.isPast) return logged;
  const open = marks.filter((m) => !m.filled).length;
  const planned = t("hang.plannedCount", { n: open });
  return open === marks.length ? planned : `${planned} · ${logged}`;
}

/** The selected day: what was logged, what is still planned, and a way to plan more. */
export function DaySection({
  day,
  onOpen,
  onEditPlan,
  onStart,
  onSkip,
  onEditItem,
  onSkipItem,
  onAdd,
}: DaySectionProps): React.ReactElement {
  const { model, today } = useHangData();
  const library = useLibrary().state;
  const workouts = library.status === "ready" ? library.data.workouts : [];
  const current = weekStart(day.date) === weekStart(today);
  const empty =
    day.logged.length === 0 &&
    day.planned.length === 0 &&
    day.plans.length === 0 &&
    day.goals.length === 0;
  return (
    <View style={{ gap: 12 }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: 12,
          paddingTop: 4,
        }}
      >
        <Title size={26}>{day.isToday ? t("training.today") : dayTitle(day.date)}</Title>
        <Label color={colors.textSecondary}>{subtitle(day)}</Label>
      </View>
      {day.logged.map((item) => (
        <LoggedRow
          key={loggedKey(item)}
          kind={markKind(item)}
          text={loggedRowText(item, model)}
          onPress={() => onOpen(item)}
        />
      ))}
      {day.planned.map(({ schedule }) =>
        day.isToday ? (
          <UpTodayCard
            key={schedule.id}
            schedule={schedule}
            onEdit={() => onEditPlan(schedule)}
            onStart={() => onStart(schedule)}
          />
        ) : (
          <PlannedRow
            key={schedule.id}
            schedule={schedule}
            date={day.date}
            missed={day.isPast}
            onOpen={() => onEditPlan(schedule)}
            onSkip={() => onSkip(schedule)}
          />
        )
      )}
      {day.plans.map((entry) =>
        day.isToday && entry.status === "planned" ? (
          <PlanItemCard
            key={entry.plan.id}
            item={entry.plan}
            onEdit={() => onEditItem(entry.plan)}
            onLog={() => logPlanItem(entry.plan, day.date)}
            onStart={startPlanItem(entry.plan, planTemplateOf(entry.plan, workouts), day.date)}
          />
        ) : (
          <PlanItemRow
            key={entry.plan.id}
            entry={entry}
            date={day.date}
            onOpen={() => onEditItem(entry.plan)}
            onSkip={() => onSkipItem(entry.plan)}
          />
        )
      )}
      {day.goals.map((goal) => (
        <GoalRow
          key={goal.item.id}
          goal={goal}
          current={current}
          onOpen={() => onEditItem(goal.item)}
          onLog={
            day.isToday && goal.status === "planned"
              ? () => logPlanItem(goal.item, day.date)
              : undefined
          }
        />
      ))}
      {empty && (
        <DashedPanel
          title={t("hang.restDay")}
          body={day.isPast ? t("hang.restDayPast") : t("hang.restDayFuture")}
        />
      )}
      <Button
        label={t("training.addToPlan")}
        onPress={onAdd}
        variant="dashed"
        height={50}
        icon="plus"
      />
    </View>
  );
}
