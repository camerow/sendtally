import { useLocalSearchParams } from "expo-router";
import React from "react";
import { HangDataProvider } from "../../features/training/data/HangDataProvider";
import { GripScreen } from "../../features/training/grip/GripScreen";

export default function GripRoute(): React.ReactElement {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <HangDataProvider framed>
      <GripScreen id={id} />
    </HangDataProvider>
  );
}
