import { useLocalSearchParams } from "expo-router";
import React from "react";
import { HangDataProvider } from "../../features/training/data/HangDataProvider";
import { DoneScreen } from "../../features/training/done/DoneScreen";
import { readDoneParams } from "../../features/training/done/doneParams";

export default function DoneRoute(): React.ReactElement {
  const params = useLocalSearchParams();
  return (
    <HangDataProvider>
      <DoneScreen params={readDoneParams(params)} />
    </HangDataProvider>
  );
}
