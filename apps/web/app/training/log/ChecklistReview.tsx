import React from "react";
import type { ItemDone } from "@sendtally/core/hang";
import { checklistTitle } from "@sendtally/features/workouts";
import { ChecklistRow } from "../players/ChecklistRow";

export type ChecklistReviewProps = {
  list: NonNullable<ItemDone["checklist"]>;
  /** The kind's colour, on its mark. */
  color: string;
  onToggle: (line: number) => void;
};

/** A checklist in the review: "Checklist · 4 of 5" over its lines, a click ticking one. */
export function ChecklistReview({
  list,
  color,
  onToggle,
}: ChecklistReviewProps): React.ReactElement {
  return (
    <div className="done-card">
      <div className="done-card-head">
        <span className="done-card-mark" style={{ background: color }} />
        <span className="done-card-name">
          {checklistTitle(list.checked.length, list.lines.length)}
        </span>
      </div>
      <div className="check-list">
        {list.lines.map((line, i) => (
          <ChecklistRow
            key={i}
            name={line}
            ticked={list.checked.includes(i)}
            onToggle={() => onToggle(i)}
          />
        ))}
      </div>
    </div>
  );
}
