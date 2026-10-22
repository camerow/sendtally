import React from "react";
import { emptyDetail } from "@sendtally/features/activities";
import { BlockSheet } from "../blocks/BlockSheet";
import { PlannerSheet } from "../planner/PlannerSheet";
import { openBuilderToPlan } from "./openBuilder";
import { PlanChooserSheet } from "./PlanChooserSheet";
import { PlanItemSheet } from "./PlanItemSheet";
import type { PlanChoice, PlanRequest } from "./types";

export type PlanSheetsProps = {
  request: PlanRequest | null;
  onChange: (request: PlanRequest | null) => void;
};

type Choose = Extract<PlanRequest, { mode: "choose" }>;

function next(from: Choose, choice: PlanChoice): PlanRequest | null {
  const { days, start, blockId } = from;
  switch (choice) {
    case "hang":
      return {
        mode: "hang",
        request: { mode: "new", workoutId: null, gripId: null, days, start, blockId },
      };
    case "newWorkout":
      openBuilderToPlan(from);
      return null;
    case "newTemplate":
      return {
        mode: "item",
        request: {
          mode: "new",
          kind: "strength",
          days,
          start,
          blockId,
          template: emptyDetail("sets", "strength"),
        },
      };
    default:
      return { mode: "item", request: { mode: "new", kind: choice, days, start, blockId } };
  }
}

/** Whichever planning sheet `request` names; the chooser hands on to the sheet for its pick. */
export function PlanSheets({ request, onChange }: PlanSheetsProps): React.ReactElement | null {
  if (request === null) return null;
  const close = (): void => onChange(null);
  switch (request.mode) {
    case "hang":
      return <PlannerSheet request={request.request} onClose={close} />;
    case "item":
      return <PlanItemSheet request={request.request} onClose={close} />;
    case "block":
      return <BlockSheet block={request.block} onClose={(after) => onChange(after)} />;
    case "choose":
      return (
        <PlanChooserSheet
          inBlock={request.blockId !== undefined}
          onClose={(choice) => onChange(choice === null ? null : next(request, choice))}
        />
      );
  }
}
