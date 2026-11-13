import React from "react";
import type { HangSession, WeightUnit } from "@sendtally/core/hang";
import { hangCount, hangGrid, hangLoadText } from "@sendtally/features/activities";
import { t } from "@sendtally/features/i18n";

type Hang = Pick<HangSession, "protocol" | "pct" | "loadKg" | "edgeMm" | "done">;

/** A hangboard session's hangs, set by set: every cell the same box, held ones green, then the load. */
export function HangGrid({
  rows,
  loads,
  unit,
}: {
  rows: readonly (readonly boolean[])[];
  loads: readonly number[];
  unit: WeightUnit;
}): React.ReactElement {
  const held = rows.flat().filter(Boolean).length;
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
          </div>
        );
      })}
    </div>
  );
}

/** A hangboard session's hangs and load, set by set, and how many hangs it held. */
export function HangResultCard({
  session,
  gripName,
  unit,
}: {
  session: Hang;
  gripName: string;
  unit: WeightUnit;
}): React.ReactElement {
  const grid = hangGrid(session);
  const name =
    session.protocol.kind === "hang"
      ? `${gripName} · ${t("hang.edgeMm", { n: session.edgeMm })}`
      : gripName;
  return (
    <div className="result-card">
      <div className="result-card-head">
        <span className="result-card-name">{name}</span>
        <span className="train-label train-label--small">{t("summary.load")}</span>
      </div>
      <HangGrid rows={grid.rows} loads={grid.loads} unit={unit} />
      <span className="hang-count">{hangCount(grid, unit)}</span>
    </div>
  );
}
