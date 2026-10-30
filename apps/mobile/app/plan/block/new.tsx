import React from "react";
import { HangDataProvider } from "../../../features/training/data/HangDataProvider";
import { NewBlock } from "../../../features/training/planning/NewBlock";

export default function NewBlockRoute(): React.ReactElement {
  return (
    <HangDataProvider>
      <NewBlock />
    </HangDataProvider>
  );
}
