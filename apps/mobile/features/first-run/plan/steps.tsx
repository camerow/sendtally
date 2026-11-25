import React from "react";
import { HangDataProvider } from "../../training/data/HangDataProvider";
import type { StepComponent, StepMap } from "../types";
import { BlockStep } from "./BlockStep";
import { BuildWeekStep } from "./BuildWeekStep";
import { DoneStep } from "./DoneStep";
import { RevealStep } from "./RevealStep";
import { WorkoutStep } from "./WorkoutStep";

const withTraining =
  (Step: StepComponent): StepComponent =>
  (props) => (
    <HangDataProvider framed>
      <Step {...props} />
    </HangDataProvider>
  );

export const planStepMap: StepMap = {
  P1w: withTraining(BuildWeekStep),
  P2: withTraining(WorkoutStep),
  P4: withTraining(BlockStep),
  P5: withTraining(RevealStep),
  P7: withTraining(DoneStep),
};
