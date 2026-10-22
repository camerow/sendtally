import { useLocalSearchParams } from "expo-router";
import React from "react";
import { BuilderScreen } from "../../features/training/builder/BuilderScreen";
import { HangDataProvider } from "../../features/training/data/HangDataProvider";

export default function BuilderRoute(): React.ReactElement {
  const { id, from } = useLocalSearchParams<{ id?: string; from?: string }>();
  return (
    <HangDataProvider>
      <BuilderScreen id={id} from={from} />
    </HangDataProvider>
  );
}
