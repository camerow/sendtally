import React from "react";
import { weekdayLong } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";
import { queries, useQuery } from "@sendtally/features/query";
import { firstWeekday, sessionsPerWeek, usePlanPath } from "@sendtally/features/settings";
import { usePlan } from "@sendtally/features/training";
import { MenuRow } from "../../components/MenuRow";
import { useLibrary } from "../../training/library/useLibrary";
import type { StepComponent } from "../types";
import { WizardFrame } from "../WizardFrame";
import { StartRow } from "./components/StartRow";
import { WeekCard } from "./components/WeekCard";
import { useMember } from "../useMember";

const DAYS = [0, 1, 2, 3, 4, 5, 6] as const;

/** P7: hands over to the first workout, the Plan tab, or the other path. */
export const DoneStep: StepComponent = ({ wizard, api }) => {
  const path = usePlanPath();
  const plan = usePlan(api).state;
  const library = useLibrary().state;
  const status = useQuery(queries.status(api)).state;
  const outcome = useMember() ? "member" : "later";

  const ready = plan.status === "ready" && library.status === "ready";
  const members = ready
    ? plan.data.memberships
        .filter((m) => m.blockId !== null && m.blockId === path.blockId)
        .sort((a, b) => a.position - b.position)
    : [];
  const placed = members.flatMap((m) => {
    const workout = ready ? library.data.workout(m.workoutId) : undefined;
    return workout === undefined ? [] : [{ m, workout }];
  });
  const days = Object.fromEntries(members.map((m) => [m.id, m.weekdays]));
  const perWeek = sessionsPerWeek(days);
  const first = firstWeekday(days);
  const workout = placed[0]?.workout;
  const noSessions = status.status === "ready" && !status.data.onboarding.progress.sessions;

  const week = DAYS.map((d) => {
    const kinds = placed.filter(({ m }) => m.weekdays.includes(d)).map(({ workout: w }) => w.kind);
    return kinds.length > 0 ? kinds : null;
  });

  return (
    <WizardFrame wizard={wizard} bar={false}>
      <h1 className="wizard-title">{t("onboarding.plan.done.title")}</h1>
      <WeekCard
        week={week}
        meta={t("onboarding.plan.week.perWeek", { count: perWeek })}
        empty={t("onboarding.plan.week.empty")}
      />
      <div className="plan-path-menu">
        {workout !== undefined && (
          <StartRow workout={workout} onStart={() => wizard.complete(outcome, "first_workout")} />
        )}
        {noSessions && (
          <MenuRow
            icon="climbs"
            title={t("onboarding.chooser.historyTitle")}
            hint={t("onboarding.plan.done.historyHint")}
            onPress={() => {
              wizard.complete(outcome, "other_path");
              wizard.choose("history", "end_screen");
            }}
          />
        )}
        <MenuRow
          icon="today"
          title={t("onboarding.plan.done.openPlan")}
          {...(first === null
            ? {}
            : { hint: t("onboarding.plan.done.dayFirst", { day: weekdayLong(first) }) })}
          onPress={() => wizard.complete(outcome, "plan")}
        />
      </div>
    </WizardFrame>
  );
};
