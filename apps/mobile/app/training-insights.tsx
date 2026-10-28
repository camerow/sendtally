import React from "react";
import { HangDataProvider } from "../features/training/data/HangDataProvider";
import { TrainingInsightsScreen } from "../features/training/insights/TrainingInsightsScreen";

export default function TrainingInsights(): React.ReactElement {
  return (
    <HangDataProvider>
      <TrainingInsightsScreen />
    </HangDataProvider>
  );
}
