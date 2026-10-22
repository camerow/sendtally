import { useLocalSearchParams } from "expo-router";
import React from "react";
import { HangDataProvider } from "../../../features/training/data/HangDataProvider";
import { BlockFormScreen } from "../../../features/training/planning/BlockFormScreen";

export default function NewBlockRoute(): React.ReactElement {
  const { start, weeks } = useLocalSearchParams<{ start?: string; weeks?: string }>();
  return (
    <HangDataProvider>
      <BlockFormScreen start={start} weeks={weeks} />
    </HangDataProvider>
  );
}
