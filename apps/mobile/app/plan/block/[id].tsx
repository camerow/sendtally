import { useLocalSearchParams } from "expo-router";
import React from "react";
import { HangDataProvider } from "../../../features/training/data/HangDataProvider";
import { BlockScreen } from "../../../features/training/planning/BlockScreen";

export default function BlockRoute(): React.ReactElement {
  const { id, highlight } = useLocalSearchParams<{ id: string; highlight?: string }>();
  return (
    <HangDataProvider framed>
      <BlockScreen id={id} highlight={highlight} />
    </HangDataProvider>
  );
}
