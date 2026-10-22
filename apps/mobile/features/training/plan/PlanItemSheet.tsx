import React from "react";
import { HangDataProvider } from "../data/HangDataProvider";
import { PlanItemForm } from "./PlanItemForm";
import type { PlanItemRequest } from "./types";

export type PlanItemSheetProps = { request: PlanItemRequest | null; onClose: () => void };

/** A plan item's sheet, with its own training data so any screen can open it. */
export function PlanItemSheet({ request, onClose }: PlanItemSheetProps): React.ReactElement | null {
  return request === null ? null : (
    <HangDataProvider fallback={null}>
      <PlanItemForm request={request} onClose={onClose} />
    </HangDataProvider>
  );
}
