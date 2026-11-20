import type { StepMap } from "../types";
import { BlockStep } from "./BlockStep";
import { DaysStep } from "./DaysStep";
import { DoneStep } from "./DoneStep";
import { KeepStep } from "./KeepStep";
import { RevealStep } from "./RevealStep";
import { WeekStep } from "./WeekStep";
import { WorkoutStep } from "./WorkoutStep";

export const planStepMap: StepMap = {
  P1: DaysStep,
  P2: WorkoutStep,
  P3: WeekStep,
  P4: BlockStep,
  P5: RevealStep,
  P6: KeepStep,
  P7: DoneStep,
};
