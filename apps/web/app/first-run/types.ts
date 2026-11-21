import type React from "react";
import type { SendtallyApi } from "@sendtally/api-client";
import type { StepId, Wizard } from "@sendtally/features/settings";

export type StepComponent = (props: { wizard: Wizard; api: SendtallyApi }) => React.ReactElement;

export type StepMap = Partial<Record<StepId, StepComponent>>;
