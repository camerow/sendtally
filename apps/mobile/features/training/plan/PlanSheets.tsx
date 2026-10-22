import React from "react";
import { PlannerSheet } from "../planner/PlannerSheet";
import { PlanChooserSheet } from "./PlanChooserSheet";
import { PlanItemSheet } from "./PlanItemSheet";
import type { PlanChoice, PlanRequest } from "./types";

export type PlanSheetsProps = {
  request: PlanRequest | null;
  onChange: (request: PlanRequest | null) => void;
};

const next = (from: Extract<PlanRequest, { mode: "choose" }>, choice: PlanChoice): PlanRequest =>
  choice === "hang"
    ? {
        mode: "hang",
        request: { mode: "new", workoutId: null, gripId: null, days: from.days, start: from.start },
      }
    : { mode: "item", request: { mode: "new", kind: choice, days: from.days, start: from.start } };

/** Whichever planning sheet `request` names; the chooser hands on to the sheet for its pick. */
export function PlanSheets({ request, onChange }: PlanSheetsProps): React.ReactElement | null {
  if (request === null) return null;
  const close = (): void => onChange(null);
  switch (request.mode) {
    case "hang":
      return <PlannerSheet request={request.request} onClose={close} />;
    case "item":
      return <PlanItemSheet request={request.request} onClose={close} />;
    case "choose":
      return (
        <PlanChooserSheet
          onClose={(choice) => onChange(choice === null ? null : next(request, choice))}
        />
      );
  }
}
