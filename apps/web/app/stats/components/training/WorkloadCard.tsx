import React from "react";
import { t } from "@sendtally/features/i18n";
import { WORKLOAD_TINTS, workloadZoneLabel, type WorkloadVM } from "@sendtally/features/statistics";
import { Icon } from "../../../components/Icon";
import { WorkloadChart } from "./WorkloadChart";
import { WorkloadSheet } from "./WorkloadSheet";

function Row({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}): React.ReactElement {
  return (
    <button type="button" className="workload-row" onClick={onClick}>
      <span className="workload-mono">{children}</span>
      <Icon name="chevron" size={16} />
    </button>
  );
}

function Weeks({ days }: { days: number }): React.ReactElement {
  return (
    <div className="workload-weeks">
      <div className="workload-weeks-bar">
        {[0, 1, 2, 3].map((w) => (
          <span
            key={w}
            className={days > w * 7 ? "workload-week workload-week-done" : "workload-week"}
          />
        ))}
      </div>
      <div className="insights-axis">
        <span>{t("statistics.workloadWeek1")}</span>
        <span>{t("statistics.workloadWeek4")}</span>
      </div>
    </div>
  );
}

/** This week's load against the last four: the ratio and its zone in words, the line, and the loads behind it. */
export function WorkloadCard({ workload: w }: { workload: WorkloadVM }): React.ReactElement {
  const [open, setOpen] = React.useState(false);
  const average = w.chronic ?? (w.state === "early" ? t("statistics.workloadAfter4") : null);

  return (
    <section className="stats-card stats-wide workload-card">
      <div className="stats-card-head">
        <h2 className="stats-label">{t("statistics.workloadTitle")}</h2>
        <span className="stats-meta">{t("statistics.workloadCaption")}</span>
      </div>
      {w.zone !== null && w.ratio !== null ? (
        <div className="workload-head">
          <span className="workload-ratio">{w.ratio}</span>
          <span
            className="stats-label workload-pill"
            style={{ background: WORKLOAD_TINTS[w.zone] }}
          >
            {workloadZoneLabel(w.zone)}
          </span>
        </div>
      ) : (
        <span
          className={w.state === "early" ? "workload-headline workload-faint" : "workload-headline"}
        >
          {w.headline}
        </span>
      )}
      <p className="workload-sentence">{w.sentence}</p>
      {w.state === "early" ? (
        <Weeks days={w.daysLogged} />
      ) : (
        <WorkloadChart points={w.points} from={w.from} />
      )}
      <div>
        <Row onClick={() => setOpen(true)}>
          {t("statistics.workloadLast7")} <b>{w.acute}</b>
          {average === null ? null : (
            <>
              {` · ${t("statistics.workloadAverage")} `}
              <b>{average}</b>
            </>
          )}
        </Row>
        {w.leftOutLine !== null && <Row onClick={() => setOpen(true)}>{w.leftOutLine}</Row>}
      </div>
      <WorkloadSheet workload={w} open={open} onClose={() => setOpen(false)} />
    </section>
  );
}
