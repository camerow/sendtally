import React from "react";
import { Link } from "react-router";
import { t } from "@sendtally/features/i18n";
import type { DoneRef, WorkloadTileVM, WorkloadVM } from "@sendtally/features/statistics";
import { Sheet } from "../../../components/Sheet";
import { activityPath } from "../../../training/log/paths";

const BAR = 82;

const pathOf = (ref: DoneRef): string =>
  ref.type === "session" ? `/app/sessions/${encodeURIComponent(ref.id)}` : activityPath(ref.id);

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
  const top = Math.max(s.average, ...s.weeks.map((x) => x.load), 1);
  const averageAt = (s.average / top) * BAR;
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
                style={{ height: Math.max(2, (week.load / top) * BAR) }}
              />
            ))}
            {s.average > 0 && <div className="workload-average" style={{ bottom: averageAt }} />}
          </div>
          <div className="workload-gutter" style={{ height: BAR }}>
            {s.average > 0 && (
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
            <span className="stats-label workload-muted">{t("statistics.workloadNotCounted")}</span>
            {s.leftOut.map((l) => (
              <Link
                key={`${l.ref.type}${l.ref.id}`}
                to={pathOf(l.ref)}
                className="workload-left-row"
              >
                <span className="workload-left-name">{l.ref.name}</span>
                <span className="workload-mono workload-muted">{`${l.detail} ›`}</span>
              </Link>
            ))}
            <span className="workload-mono workload-muted">
              {t("statistics.workloadOpensRecord")}
            </span>
          </div>
        )}
      </div>
    </Sheet>
  );
}
