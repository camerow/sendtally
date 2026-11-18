import React from "react";
import { t } from "@sendtally/features/i18n";
import type { WorkloadTileVM, WorkloadVM } from "@sendtally/features/statistics";
import { Sheet } from "../../../components/Sheet";
import { NotCountedRows } from "./NotCountedRows";

const BAR = 82;

function Tile({ label, value, note, counted }: WorkloadTileVM): React.ReactElement {
  return (
    <div className="workload-tile">
      <span className="stats-label workload-muted">{label}</span>
      <span className="workload-tile-value">{value}</span>
      <span className="workload-mono workload-muted">{note}</span>
      {counted !== null && <span className="workload-mono">{counted}</span>}
    </div>
  );
}

/** The loads behind the ratio: both sums, the division, the four weeks, and what was left out. */
export function WorkloadSheet({
  workload: w,
  open,
  onClose,
}: {
  workload: WorkloadVM;
  open: boolean;
  onClose: () => void;
}): React.ReactElement | null {
  const s = w.sheet;
  const averageAt = s.averageAt * BAR;
  return (
    <Sheet open={open} title={t("statistics.workloadTitle")} onClose={onClose} cancel={false}>
      <div className="workload-sheet">
        <div className="workload-tiles">
          {s.tiles.map((tile) => (
            <Tile key={tile.label} {...tile} />
          ))}
        </div>
        <span className="workload-mono">{s.footer}</span>
        <div className="workload-chart">
          <div className="workload-bars" style={{ height: BAR }}>
            {s.weeks.map((week, i) => (
              <div
                key={week.label}
                className={
                  i === s.weeks.length - 1
                    ? "workload-bar-fill workload-bar-now"
                    : "workload-bar-fill"
                }
                style={{ height: Math.max(2, week.height * BAR) }}
              />
            ))}
            {s.averageAt > 0 && <div className="workload-average" style={{ bottom: averageAt }} />}
          </div>
          <div className="workload-gutter" style={{ height: BAR }}>
            {s.averageAt > 0 && (
              <span className="workload-average-label" style={{ bottom: averageAt - 7 }}>
                {s.averageLabel}
              </span>
            )}
          </div>
          <div className="workload-bar-labels">
            {s.weeks.map((week) => (
              <div key={week.label} className="workload-bar">
                <span className="workload-mono">{week.value}</span>
                <span className="workload-mono workload-muted workload-bar-label">
                  {week.label}
                </span>
              </div>
            ))}
          </div>
        </div>
        <span className="workload-mono workload-muted">{t("statistics.workloadBarsNote")}</span>
        {s.leftOut.length > 0 && (
          <div className="workload-left-out">
            <NotCountedRows label={t("statistics.workloadNotCounted")} rows={s.leftOut} />
          </div>
        )}
      </div>
    </Sheet>
  );
}
