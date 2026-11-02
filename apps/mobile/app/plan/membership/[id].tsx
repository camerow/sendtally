import { useLocalSearchParams } from "expo-router";
import React from "react";
import { HangDataProvider } from "../../../features/training/data/HangDataProvider";
import { LadderScreen } from "../../../features/training/planning/LadderScreen";

export default function LadderRoute(): React.ReactElement {
  const { id, back } = useLocalSearchParams<{ id: string; back?: string }>();
  return (
    <HangDataProvider>
      <LadderScreen id={id} back={back} />
    </HangDataProvider>
  );
}
