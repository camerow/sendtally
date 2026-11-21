import { router, useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import React from "react";
import { queries } from "@sendtally/features/query";
import {
  useWizard,
  type OnboardingPath,
  type PathFrom,
  type Wizard,
} from "@sendtally/features/settings";
import { useCapture } from "../features/analytics/useCapture";
import { useBilling } from "../features/billing/useBilling";
import { ChooserStep } from "../features/first-run/ChooserStep";
import { historyStepMap } from "../features/first-run/history/steps";
import { planStepMap } from "../features/first-run/plan/steps";
import type { StepMap } from "../features/first-run/types";
import { WizardFrame } from "../features/first-run/WizardFrame";
import { Title } from "../features/training/components/Title";
import { useApi } from "../lib/api";

const STEPS: StepMap = { choose: ChooserStep, ...historyStepMap, ...planStepMap };

const toPlan = (): void => router.replace("/(tabs)/today");

/** The wizard opens only once the status is in, so it starts from what the account has already made. */
export default function FirstRun(): React.ReactElement | null {
  const ready = useQuery(queries.status(useApi())).data !== undefined;
  return ready ? <Walk /> : null;
}

function Walk(): React.ReactElement {
  const params = useLocalSearchParams<{ path?: string; from?: string }>();
  const api = useApi();
  const capture = useCapture();
  const path: OnboardingPath | null =
    params.path === "history" || params.path === "plan" ? params.path : null;
  const from: PathFrom = params.from === "setup_card" ? "setup_card" : "account";
  const start = React.useMemo(() => (path === null ? undefined : { path, from }), [path, from]);
  const wizard = useWizard(api, {
    capture,
    member: useBilling()?.membership.active === true,
    start,
  });
  const routed: Wizard = {
    ...wizard,
    skip: () => {
      wizard.skip();
      toPlan();
    },
    leave: () => {
      wizard.leave();
      toPlan();
    },
    complete: (outcome, next) => {
      wizard.complete(outcome, next);
      if (next === "log") router.replace("/(tabs)/sessions");
      else if (next === "plan") toPlan();
    },
  };
  const Step = STEPS[wizard.step];
  return Step === undefined ? (
    <WizardFrame wizard={routed}>
      <Title size={34}>{wizard.step}</Title>
    </WizardFrame>
  ) : (
    <Step wizard={routed} api={api} />
  );
}
