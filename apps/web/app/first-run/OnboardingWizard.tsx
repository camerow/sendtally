import React from "react";
import { useNavigate } from "react-router";
import type { SendtallyApi } from "@sendtally/api-client";
import {
  useWizard,
  type Capture,
  type OnboardingPath,
  type PathFrom,
  type Wizard,
} from "@sendtally/features/settings";
import { capture } from "../lib/analytics";
import { ChooserStep } from "./ChooserStep";
import { historyStepMap } from "./history/steps";
import { planStepMap } from "./plan/steps";
import type { StepMap } from "./types";

const STEPS: StepMap = { choose: ChooserStep, ...historyStepMap, ...planStepMap };

const onboardingCapture: Capture = (event, properties) => capture(event, properties);

export type OnboardingWizardProps = {
  api: SendtallyApi;
  start: { path: OnboardingPath; from: PathFrom } | undefined;
};

/** The chooser, then path history or path plan, one step at a time; Skip and leaving land on Plan. */
export function OnboardingWizard({ api, start }: OnboardingWizardProps): React.ReactElement | null {
  const navigate = useNavigate();
  const wizard = useWizard(api, { capture: onboardingCapture, start });
  const toPlan = (): void => void navigate("/app/plan", { replace: true });
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
      if (next === "log") void navigate("/app", { replace: true });
      else if (next === "plan") toPlan();
    },
  };
  const Step = STEPS[wizard.step];
  return Step === undefined ? null : <Step wizard={routed} api={api} finish={wizard.complete} />;
}
