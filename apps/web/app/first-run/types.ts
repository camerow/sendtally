import type React from "react";
import type { SendtallyApi } from "@sendtally/api-client";
import type { StepId, Wizard } from "@sendtally/features/settings";

export type StepComponent = (props: {
  wizard: Wizard;
  api: SendtallyApi;
  /** Completes the walk and stays where the user is going, for a link out of the closing screen. */
  finish?: Wizard["complete"];
}) => React.ReactElement;

export type StepMap = Partial<Record<StepId, StepComponent>>;
