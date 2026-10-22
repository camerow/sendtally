import React from "react";
import type { TrainingBlock } from "@sendtally/api-client";
import { weekday } from "@sendtally/core/hang";
import { HangDataProvider } from "../data/HangDataProvider";
import type { PlanRequest } from "../plan/types";
import { BlockForm } from "./BlockForm";

export type BlockSheetProps = {
  block: TrainingBlock | null;
  /** With what to open next: a new block goes straight on to adding its plans. */
  onClose: (next: PlanRequest | null) => void;
};

/** A block's sheet, with its own training data so any screen can open it. */
export function BlockSheet({ block, onClose }: BlockSheetProps): React.ReactElement {
  return (
    <HangDataProvider fallback={null}>
      <BlockForm
        block={block}
        onClose={(created) =>
          onClose(
            created === null
              ? null
              : {
                  mode: "choose",
                  days: [weekday(created.start)],
                  start: created.start,
                  blockId: created.id,
                }
          )
        }
      />
    </HangDataProvider>
  );
}
