import React from "react";
import { SET_COLUMNS } from "./setColumns";

export type SetHeadingsProps = {
  /** Over the positions: "Set", "Lap". */
  position: string;
  /** Over the fields, or over the count column when `measure` is given: "Done", "Hold", "Hangs". */
  fields: string;
  /** Over the measure column: "Load". */
  measure?: string;
  /** The block asks a set RPE. */
  rpe?: boolean;
  /** Its rows end in a tick; a hang set's rows end at RPE. */
  tick?: boolean;
};

/** The set grid's column headings, on the same columns as its rows. */
export function SetHeadings({
  position,
  fields,
  measure,
  rpe = false,
  tick = true,
}: SetHeadingsProps): React.ReactElement {
  return (
    <div className={`${SET_COLUMNS.row} set-headings`} aria-hidden="true">
      <span className={`${SET_COLUMNS.position} train-label train-label--small`}>{position}</span>
      {measure === undefined ? (
        <span className={`${SET_COLUMNS.lead} train-label train-label--small`}>{fields}</span>
      ) : (
        <span className={SET_COLUMNS.lead}>
          <span className={`${SET_COLUMNS.count} train-label train-label--small`}>{fields}</span>
          <span className={SET_COLUMNS.join} />
          <span className={`${SET_COLUMNS.measure} train-label train-label--small`}>{measure}</span>
        </span>
      )}
      {rpe && <span className={`${SET_COLUMNS.rpe} train-label train-label--small`}>RPE</span>}
      {tick && <span className={SET_COLUMNS.tick} />}
    </div>
  );
}
