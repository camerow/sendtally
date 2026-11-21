import React from "react";
import type { SendtallyApi } from "@sendtally/api-client";
import { exerciseLabel } from "@sendtally/features/exercises";
import { formatNumber, t } from "@sendtally/features/i18n";
import { sessionsPerWeek, usePlanPath, type Wizard } from "@sendtally/features/settings";
import { exerciseKey, useExercises } from "@sendtally/features/statistics";
import { usePlan } from "@sendtally/features/training";
import { Paywall } from "../../billing/Paywall";
import { useBilling } from "../../billing/useBilling";
import { Button } from "../../training/components/Button";
import { useLibrary } from "../../training/library/useLibrary";
import { WizardFrame } from "../WizardFrame";

type Row = { eyebrow: string; text: string };

/** P6: membership offered once, naming the block, workout and exercises the user just made. */
export function KeepStep({
  wizard,
  api,
}: {
  wizard: Wizard;
  api: SendtallyApi;
}): React.ReactElement {
  const path = usePlanPath();
  const plan = usePlan(api).state;
  const library = useLibrary().state;
  const exercises = useExercises(api).state;
  const member = useBilling()?.membership.active === true;
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
  const rows: Row[] = [
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
      footer={<Button variant="link" height={44} label={t("hang.notNow")} onPress={() => next()} />}
    >
      <Paywall
        title={t("onboarding.membership.plan.title")}
        body={t("onboarding.membership.plan.body")}
        rows={rows}
      />
    </WizardFrame>
  );
}
