import React from "react";
import type { TargetText } from "@sendtally/features/workouts";
import { HistoryButton } from "./HistoryButton";
import { SET_COLUMNS } from "./setColumns";

export type SupersetMember = {
  letter: string;
  name: string;
  /** A round's target: `targetText(dose, kind, unit, { round: true })`. */
  target: TargetText;
  /** Where its exercise history opens. */
  history?: string;
};

export type SupersetMembersProps = { members: readonly SupersetMember[] };

/** A superset's exercises, said once: letter, name over its target, and its History. */
export function SupersetMembers({ members }: SupersetMembersProps): React.ReactElement {
  return (
    <div className="superset-members">
      {members.map((m) => (
        <div key={m.letter} className="superset-member">
          <span className={SET_COLUMNS.position}>{m.letter}</span>
          <span className="superset-member-text">
            <span className="superset-member-name">{m.name}</span>
            <span className="superset-member-target">
              {[m.target.work, m.target.rpe].filter((l) => l !== undefined && l !== "").join(" · ")}
            </span>
          </span>
          {m.history !== undefined && <HistoryButton name={m.name} to={m.history} />}
        </div>
      ))}
    </div>
  );
}
