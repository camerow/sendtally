import { router, useLocalSearchParams } from "expo-router";
import { usePostHog, type PostHog } from "posthog-react-native";
import React from "react";
import {
  useWizard,
  type Capture,
  type OnboardingPath,
  type PathFrom,
  type Wizard,
} from "@sendtally/features/onboarding";
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

export default function FirstRun(): React.ReactElement {
  const params = useLocalSearchParams<{ path?: string; from?: string }>();
  const api = useApi();
  const posthog: PostHog | undefined = usePostHog();
  const capture = React.useCallback<Capture>(
    (event, properties) => {
      posthog?.capture(event, properties);
    },
    [posthog]
  );
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
