import React from "react";
import { HangDataProvider } from "../../features/training/data/HangDataProvider";
import { CompareGripsScreen } from "../../features/training/grip/CompareGripsScreen";

export default function CompareGripsRoute(): React.ReactElement {
  return (
    <HangDataProvider>
      <CompareGripsScreen />
    </HangDataProvider>
  );
}
