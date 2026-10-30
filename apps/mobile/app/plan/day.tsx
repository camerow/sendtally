import { useLocalSearchParams } from "expo-router";
import React from "react";
import { PlanDayScreen } from "../../features/training/calendar/PlanDayScreen";
import { HangDataProvider } from "../../features/training/data/HangDataProvider";

export default function PlanDayRoute(): React.ReactElement {
  const { date } = useLocalSearchParams<{ date: string }>();
  return (
    <HangDataProvider framed>
      <PlanDayScreen date={date} />
    </HangDataProvider>
  );
}
