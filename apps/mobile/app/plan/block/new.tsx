import React from "react";
import { HangDataProvider } from "../../../features/training/data/HangDataProvider";
import { BlockFormScreen } from "../../../features/training/planning/BlockFormScreen";

export default function NewBlockRoute(): React.ReactElement {
  return (
    <HangDataProvider>
      <BlockFormScreen />
    </HangDataProvider>
  );
}
