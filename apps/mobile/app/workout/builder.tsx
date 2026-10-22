import { useLocalSearchParams } from "expo-router";
import React from "react";
import type { Weekday } from "@sendtally/core/hang";
import { BuilderScreen, type BuilderPlan } from "../../features/training/builder/BuilderScreen";
import { HangDataProvider } from "../../features/training/data/HangDataProvider";

type Params = {
  id?: string;
  from?: string;
  plan?: string;
  start?: string;
  days?: string;
  block?: string;
};

const weekdays = (text: string | undefined): Weekday[] =>
  (text ?? "")
    .split(",")
    .map(Number)
    .filter((n): n is Weekday => text !== "" && Number.isInteger(n) && n >= 0 && n <= 6);

export default function BuilderRoute(): React.ReactElement {
  const { id, from, plan, start, days, block } = useLocalSearchParams<Params>();
  const planning: BuilderPlan | undefined =
    plan === "1" && start !== undefined
      ? { start, days: weekdays(days), blockId: block }
      : undefined;
  return (
    <HangDataProvider>
      <BuilderScreen id={id} from={from} plan={planning} />
    </HangDataProvider>
  );
}
