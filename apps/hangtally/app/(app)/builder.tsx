import { useLocalSearchParams } from "expo-router";
import React from "react";
import { BuilderScreen } from "../../features/builder/BuilderScreen";

export default function BuilderRoute(): React.ReactElement {
  const { id, from } = useLocalSearchParams<{ id?: string; from?: string }>();
  return <BuilderScreen id={id} from={from} />;
}
