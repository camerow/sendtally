import { useLocalSearchParams } from "expo-router";
import React from "react";
import { importSourceOf } from "@sendtally/features/import";
import { ImportScreen } from "../features/import/ImportScreen";

export default function Import(): React.ReactElement {
  const { then, from } = useLocalSearchParams<{ then?: string; from?: string }>();
  return (
    <ImportScreen then={then === "/first-run" ? then : "/profile"} from={importSourceOf(from)} />
  );
}
