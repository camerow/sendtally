import React from "react";
import { Link } from "react-router";
import { t } from "@sendtally/features/i18n";
import type { DoneRef, WorkloadVM } from "@sendtally/features/statistics";
import { Sheet } from "../../../components/Sheet";
import { activityPath } from "../../../training/log/paths";

const BAR = 82;

const pathOf = (ref: DoneRef): string =>
  ref.type === "session" ? `/app/sessions/${encodeURIComponent(ref.id)}` : activityPath(ref.id);

function Tile({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note: string;
}): React.ReactElement {
  return (
    <div className="workload-tile">
      <span className="stats-label workload-muted">{label}</span>
      <span className="workload-tile-value">{value}</span>
      <span className="workload-mono workload-muted">{note}</span>
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
  const partial = w.state === "partial";
  const top = Math.max(s.average, ...s.weeks.map((x) => x.load), 1);
  return (
    <Sheet
      open={open}
      title={t("statistics.workloadTitle")}
      kicker={s.span}
      onClose={onClose}
      cancel={false}
    >
      <div className="workload-sheet">
        <div className="workload-tiles">
          <Tile
            label={t("statistics.workloadLast7")}
            value={w.acute}
            note={partial ? s.weekCounted : t("statistics.workloadLast7Note")}
          />
          {w.state !== "break" && (
            <Tile
              label={t("statistics.workloadAverage")}
              value={w.chronic ?? t("statistics.workloadAfter4")}
              note={partial ? s.monthCounted : t("statistics.workloadAverageNote")}
            />
          )}
        </div>
        <span className="workload-mono">
          {s.division ?? (partial ? t("statistics.workloadNoZone") : w.sentence)}
        </span>
        <div className="workload-bars" style={{ height: BAR + 48 }}>
          {s.weeks.map((week, i) => (
            <div key={week.label} className="workload-bar">
              <span className="workload-mono">{week.value}</span>
              <div
                className={
                  i === s.weeks.length - 1
                    ? "workload-bar-fill workload-bar-now"
                    : "workload-bar-fill"
                }
                style={{ height: Math.max(2, (week.load / top) * BAR) }}
              />
              <span className="stats-label workload-muted workload-bar-label">{week.label}</span>
            </div>
          ))}
          {s.average > 0 && (
            <div className="workload-average" style={{ bottom: 21 + (s.average / top) * BAR }} />
          )}
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
