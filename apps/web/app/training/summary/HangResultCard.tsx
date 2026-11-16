import React from "react";
import type { WeightUnit } from "@sendtally/core/hang";
import { hangCount, hangLoadText, type HangGripGrid } from "@sendtally/features/activities";
import { t } from "@sendtally/features/i18n";
import { EffortMark } from "../../components/detail/EffortMark";

/** A hangboard session's hangs, set by set: every cell the same box, held ones green, then the load. */
export function HangGrid({
  rows,
  loads,
  rpes,
  unit,
}: {
  rows: readonly (readonly boolean[])[];
  loads: readonly number[];
  rpes: readonly (number | undefined)[];
  unit: WeightUnit;
}): React.ReactElement {
  const held = rows.flat().filter(Boolean).length;
  const rated = rpes.some((r) => r !== undefined);
  return (
    <div role="img" aria-label={t("summary.hangsOf", { held, total: rows.flat().length })}>
      {rows.map((row, s) => {
        const load = loads[s] ?? 0;
        return (
          <div key={s} className="hang-grid-row">
            <span className="hang-grid-set">{t("summary.setN", { n: s + 1 })}</span>
            {row.map((done, r) => (
              <span key={r} className={done ? "hang-cell hang-cell--held" : "hang-cell"} />
            ))}
            <span className={load === 0 ? "hang-grid-load" : "hang-grid-load hang-grid-load--on"}>
              {hangLoadText(load, unit)}
            </span>
            {rated && (
              <span className="hang-grid-rpe">
                {rpes[s] !== undefined && <EffortMark rpe={rpes[s]} />}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

/** One grip of a hangboard session: its hangs, load and RPE set by set, and how many hangs it held. */
export function HangResultCard({
  grid,
  gripName,
  unit,
}: {
  grid: HangGripGrid;
  gripName: string;
  unit: WeightUnit;
}): React.ReactElement {
  const name =
    grid.kind === "hang" ? `${gripName} · ${t("hang.edgeMm", { n: grid.edgeMm })}` : gripName;
  return (
    <div className="result-card">
      <div className="result-card-head">
        <span className="result-card-name">{name}</span>
        <span className="train-label train-label--small">{t("summary.load")}</span>
      </div>
      <HangGrid rows={grid.rows} loads={grid.loads} rpes={grid.rpes} unit={unit} />
      <span className="hang-count">{hangCount(grid, unit)}</span>
    </div>
  );
}
