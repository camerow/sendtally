import { useLocalSearchParams } from "expo-router";
import React from "react";
import { DoneScreen } from "../../features/done/DoneScreen";
import { readDoneParams } from "../../features/done/doneParams";

export default function DoneRoute(): React.ReactElement | null {
  const params = useLocalSearchParams();
  return <DoneScreen params={readDoneParams(params)} />;
}
