import { useLocalSearchParams } from "expo-router";
import React from "react";
import { HangDataProvider } from "../../../features/training/data/HangDataProvider";
import { BlockFormScreen } from "../../../features/training/planning/BlockFormScreen";

export default function EditBlockRoute(): React.ReactElement {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <HangDataProvider>
      <BlockFormScreen id={id} />
    </HangDataProvider>
  );
}
