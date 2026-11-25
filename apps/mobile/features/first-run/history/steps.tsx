import { LogQuestionStep } from "../LogQuestionStep";
import type { StepMap } from "../types";
import { AddClimbsStep } from "./AddClimbsStep";
import { DoneStep } from "./DoneStep";
import { ImportStep } from "./ImportStep";
import { RevealStep } from "./RevealStep";

export const historyStepMap: StepMap = {
  H1: LogQuestionStep,
  H2i: ImportStep,
  H3i: ImportStep,
  H2h: AddClimbsStep,
  H4: RevealStep,
  H6: DoneStep,
};
