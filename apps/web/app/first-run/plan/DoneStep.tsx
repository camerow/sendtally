import React from "react";
import type { SendtallyApi } from "@sendtally/api-client";
import { Button } from "@sendtally/design";
import { useMembership } from "@sendtally/features/billing";
import { t } from "@sendtally/features/i18n";
import { sessionsPerWeek, usePlanPath } from "@sendtally/features/settings";
import { usePlan } from "@sendtally/features/training";
import { ClosingOffer } from "../../billing/components/ClosingOffer";
import { useLibrary } from "../../training/library/useLibrary";
import type { StepComponent } from "../types";
import { WizardFrame } from "../WizardFrame";
import { WeekCard } from "./components/WeekCard";

const DAYS = [0, 1, 2, 3, 4, 5, 6] as const;

function MemberWeek({ api }: { api: SendtallyApi }): React.ReactElement {
  const path = usePlanPath();
  const plan = usePlan(api).state;
  const library = useLibrary().state;
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
  const week = DAYS.map((d) => {
    const kinds = placed
      .filter(({ m }) => m.weekdays.includes(d))
      .map(({ workout }) => workout.kind);
    return kinds.length > 0 ? kinds : null;
  });
  return (
    <WeekCard
      week={week}
      meta={t("onboarding.plan.week.perWeek", {
        count: sessionsPerWeek(Object.fromEntries(members.map((m) => [m.id, m.weekdays]))),
      })}
      empty={t("onboarding.plan.week.empty")}
    />
  );
}

/** P7: the plan is ready; a free account sees the trial and what members get, a member the week. */
export const DoneStep: StepComponent = ({ wizard, api }) => {
  const member = useMembership(api).active === true;
  return (
    <WizardFrame
      wizard={wizard}
      bar={false}
      footer={
        <Button
          variant="azure"
          onClick={() => wizard.complete(member ? "member" : "later", "plan")}
        >
          {t("common.done")}
        </Button>
      }
    >
      <div className="closing">
        <h1 className="wizard-title">{t("onboarding.plan.done.title")}</h1>
        {member ? <MemberWeek api={api} /> : <ClosingOffer api={api} />}
      </div>
    </WizardFrame>
  );
};
