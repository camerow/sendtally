import { useLocalSearchParams } from "expo-router";
import React from "react";
import { HangDataProvider } from "../../features/training/data/HangDataProvider";
import { OngoingScreen } from "../../features/training/planning/OngoingScreen";

export default function OngoingRoute(): React.ReactElement {
  const { back } = useLocalSearchParams<{ back?: string }>();
  return (
    <HangDataProvider framed>
      <OngoingScreen back={back} />
    </HangDataProvider>
  );
}
