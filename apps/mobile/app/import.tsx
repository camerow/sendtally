import { useLocalSearchParams } from "expo-router";
import React from "react";
import { ImportScreen } from "../features/import/ImportScreen";

export default function Import(): React.ReactElement {
  const { then } = useLocalSearchParams<{ then?: string }>();
  return <ImportScreen then={then === "/first-run" ? then : "/profile"} />;
}
