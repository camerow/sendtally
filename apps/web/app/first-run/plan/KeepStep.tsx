import React from "react";
import { membershipPanel } from "@sendtally/features/billing";
import { exerciseLabel } from "@sendtally/features/exercises";
import { formatNumber, t } from "@sendtally/features/i18n";
import { sessionsPerWeek, usePlanPath } from "@sendtally/features/settings";
import { exerciseKey, useExercises } from "@sendtally/features/statistics";
import { usePlan } from "@sendtally/features/training";
import { MembershipCheckout } from "../../billing/components/MembershipCheckout";
import { MembershipPanel, type LedgerRowVM } from "../../billing/components/MembershipPanel";
import { useLibrary } from "../../training/library/useLibrary";
import type { StepComponent } from "../types";
import { WizardFrame } from "../WizardFrame";
import { useMember } from "../useMember";

/** P6: membership offered once, naming the block, workout and exercises the user just made. */
export const KeepStep: StepComponent = ({ wizard, api }) => {
  const path = usePlanPath();
  const plan = usePlan(api).state;
  const library = useLibrary().state;
  const exercises = useExercises(api).state;
  const member = useMember();
  const { next } = wizard;
  React.useEffect(() => {
    if (member) next();
  }, [member, next]);

  const block =
    plan.status === "ready" ? plan.data.blocks.find((b) => b.id === path.blockId) : undefined;
  const workout =
    library.status === "ready"
      ? path.workouts.map((id) => library.data.workout(id)).find((w) => w?.source === "mine")
      : undefined;
  const own = (exercises.status === "ready" ? exercises.data : []).filter(
    (e) =>
      e.builtIn === null &&
      workout?.items.some((i) => exerciseKey(i.exercise) === exerciseKey(e.name)) === true
  );
  const sessions = sessionsPerWeek(path.days) * (block?.weeks ?? 0);
  const rows: LedgerRowVM[] = [
    ...(block === undefined
      ? []
      : [
          {
            eyebrow: t("onboarding.membership.plan.yourBlock"),
            text: t("onboarding.membership.plan.blockValue", {
              name: block.name,
              weeks: t("calendar.weeks", { count: block.weeks }),
              sessions: `${formatNumber(sessions)} ${t("onboarding.plan.reveal.sessionsWord", { count: sessions })}`,
            }),
          },
        ]),
    ...(workout === undefined
      ? []
      : [
          {
            eyebrow: t("onboarding.membership.plan.yourWorkout"),
            text: t("onboarding.membership.plan.workoutValue", { name: workout.name }),
          },
        ]),
    ...(own.length === 0
      ? []
      : [
          {
            eyebrow: t("onboarding.membership.plan.yourExercises", { count: own.length }),
            text: t("onboarding.membership.plan.exercisesValue", {
              names: own.map(exerciseLabel).join(", "),
            }),
          },
        ]),
  ];

  return (
    <WizardFrame
      wizard={wizard}
      skip={false}
      footer={
        <button type="button" className="plan-path-link" onClick={() => next()}>
          {t("hang.notNow")}
        </button>
      }
    >
      <MembershipPanel
        eyebrow={membershipPanel().eyebrow}
        title={t("onboarding.membership.plan.title")}
        body={t("onboarding.membership.plan.body")}
        rows={rows}
      >
        <MembershipCheckout stay />
      </MembershipPanel>
    </WizardFrame>
  );
};
