import React from "react";
import { hangLoadText } from "@sendtally/features/hang";
import { clock, type WeightUnit } from "@sendtally/core/hang";
import { type HangGripGrid } from "@sendtally/features/activities";
import { t } from "@sendtally/features/i18n";
import { EffortMark } from "../../components/detail/EffortMark";
import { ExerciseBlock } from "../components/ExerciseBlock";
import { ExerciseHead } from "../components/ExerciseHead";
import { SetRow } from "../components/SetRow";
import { gripPath } from "../exercises/paths";

export type HangResultCardProps = {
  grid: HangGripGrid;
  gripName: string;
  unit: WeightUnit;
};

/** One grip of a finished hangboard session: a read row per set, its hangs as boxes, its load and RPE. */
export function HangResultCard({ grid, gripName, unit }: HangResultCardProps): React.ReactElement {
  const name =
    grid.kind === "hang" ? `${gripName} · ${t("hang.edgeMm", { n: grid.edgeMm })}` : gripName;
  const all = grid.rows.flat();
  const rated = grid.rpes.some((r) => r !== undefined);
  return (
    <ExerciseBlock head={<ExerciseHead name={name} history={gripPath(grid.gripId)} />}>
      {grid.rows.map((row, s) => {
        const rpe = grid.rpes[s];
        return (
          <SetRow
            key={s}
            position={String(s + 1)}
            mode="read"
            label={t("summary.setN", { n: s + 1 })}
            {...(rated && { rpe: rpe === undefined ? null : <EffortMark rpe={rpe} /> })}
          >
            {row.length === 1 && grid.seconds[s] !== undefined ? (
              <span className="hang-held">
                {row[0] === true ? clock(grid.seconds[s] ?? 0, true) : "–"}
              </span>
            ) : (
              row.map((held, r) => (
                <span key={r} className={held ? "hang-box hang-box--held" : "hang-box"} />
              ))
            )}
            <span className="hang-load">{hangLoadText(grid.loads[s] ?? 0, unit)}</span>
          </SetRow>
        );
      })}
      <span className="hang-count">
        {t("summary.hangsOf", { held: all.filter(Boolean).length, total: all.length })}
      </span>
    </ExerciseBlock>
  );
}
