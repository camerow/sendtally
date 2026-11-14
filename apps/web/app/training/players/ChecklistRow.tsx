import React from "react";

export type ChecklistRowProps = {
  name: string;
  dose: string;
  ticked: boolean;
  /** ▶ on the right, for a timed line. */
  go?: React.ReactNode;
  onToggle: () => void;
};

/**
 * One line of a routine, its name over its dose: the whole row ticks it, and a ticked one reads
 * as struck through.
 */
export function ChecklistRow({
  name,
  dose,
  ticked,
  go,
  onToggle,
}: ChecklistRowProps): React.ReactElement {
  return (
    <div className={ticked ? "check-row check-row--ticked" : "check-row"}>
      <label className="check-row-main">
        <input type="checkbox" checked={ticked} onChange={onToggle} />
        <span className="check-row-text">
          <span className="check-row-name">{name}</span>
          <span className="check-row-dose">{dose}</span>
        </span>
      </label>
      {go}
    </div>
  );
}
