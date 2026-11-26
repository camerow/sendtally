import React from "react";
import { HangDataProvider } from "../../training/data/HangDataProvider";
import type { StepComponent, StepMap } from "../types";
import { BlockStep } from "./BlockStep";
import { BuildWeekStep } from "./BuildWeekStep";
import { WorkoutBuilder } from "./components/WorkoutBuilder";
import { DoneStep } from "./DoneStep";
import { RevealStep } from "./RevealStep";

const withTraining =
  (Step: StepComponent): StepComponent =>
  (props) => (
    <HangDataProvider>
      <Step {...props} />
    </HangDataProvider>
  );

export const planStepMap: StepMap = {
  P1w: withTraining(BuildWeekStep),
  P2: withTraining(WorkoutBuilder),
  P4: withTraining(BlockStep),
  P5: withTraining(RevealStep),
  P7: withTraining(DoneStep),
};
