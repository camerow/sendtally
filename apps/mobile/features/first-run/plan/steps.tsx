import React from "react";
import { HangDataProvider } from "../../training/data/HangDataProvider";
import type { StepComponent, StepMap } from "../types";
import { BlockStep } from "./BlockStep";
import { DaysStep } from "./DaysStep";
import { DoneStep } from "./DoneStep";
import { KeepStep } from "./KeepStep";
import { RevealStep } from "./RevealStep";
import { WeekStep } from "./WeekStep";
import { WorkoutStep } from "./WorkoutStep";

const withTraining =
  (Step: StepComponent): StepComponent =>
  (props) => (
    <HangDataProvider framed>
      <Step {...props} />
    </HangDataProvider>
  );

export const planStepMap: StepMap = {
  P1: DaysStep,
  P2: withTraining(WorkoutStep),
  P3: withTraining(WeekStep),
  P4: withTraining(BlockStep),
  P5: withTraining(RevealStep),
  P6: withTraining(KeepStep),
  P7: withTraining(DoneStep),
};
