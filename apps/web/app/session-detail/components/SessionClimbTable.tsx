import React from "react";
import { Link } from "react-router";
import { t } from "@sendtally/features/i18n";
import {
  CLIMB_SORTS,
  climbSortLabel,
  type ClimbSort,
  type ClimbVM,
} from "@sendtally/features/session-detail";
import { ClimbPill } from "../../climbs/components/ClimbPill";
import { CircuitDot } from "../../components/CircuitDot";
import { Icon } from "../../components/Icon";
import { EnduranceLaps } from "./EnduranceLaps";

const HEADINGS = [
  { label: () => "#" },
  { label: () => t("sessionDetail.colClimb") },
  { label: () => t("common.grade") },
  { label: () => t("sessionDetail.colAngle"), wide: true },
  { label: () => t("sessionDetail.colAttempts"), wide: true },
  { label: () => t("common.result") },
];

export type SessionClimbTableProps = {
  climbs: ClimbVM[];
  /** Whether each climb names its area. */
  climbAreas: boolean;
  sort: ClimbSort;
  onSort: (sort: ClimbSort) => void;
};

/** The session's climbs as a table, sortable: web's wide layout of mobile's climb rows. */
export function SessionClimbTable({
  climbs,
  climbAreas,
  sort,
  onSort,
}: SessionClimbTableProps): React.ReactElement {
  return (
    <section className="detail-section">
      <div className="detail-heading">
        <h2 className="detail-label">{`${t("common.climbs")} · ${climbs.length}`}</h2>
        <select
          className="session-climb-sort"
          value={sort}
          onChange={(e) => onSort(e.target.value as ClimbSort)}
        >
          {CLIMB_SORTS.map((s) => (
            <option key={s} value={s}>
              {climbSortLabel(s)}
            </option>
          ))}
        </select>
      </div>

      <div className="session-climb-grid session-climb-head">
        {HEADINGS.map((h) => (
          <span key={h.label()} className={h.wide === true ? "session-climb-wide" : undefined}>
            {h.label()}
          </span>
        ))}
      </div>
      {climbs.map((c) => {
        const laps = c.endurance;
        return (
          <div key={c.n} className="session-climb-grid session-climb-row">
            <span className="session-climb-n">{c.n}</span>
            <span className="session-climb-main">
              <span className="session-climb-title">
                {c.colour !== undefined && <CircuitDot colour={c.colour} size={12} />}
                {laps !== undefined && (
                  <span className="session-climb-endurance">
                    <Icon name="endurance" size={14} strokeWidth={2.4} />
                  </span>
                )}
                <span className="session-climb-name">
                  {c.climbSlug === null ? (
                    c.name
                  ) : (
                    <Link to={`/app/climbs/${c.climbSlug}`}>{c.name}</Link>
                  )}
                </span>
              </span>
              {climbAreas && c.area !== null && (
                <span className="session-climb-area">{c.area}</span>
              )}
              {c.note !== null && <span className="session-climb-note">{c.note}</span>}
              {laps !== undefined && <EnduranceLaps endurance={laps} />}
            </span>
            <span
              className={
                c.isTopSend ? "session-climb-grade session-climb-grade--top" : "session-climb-grade"
              }
            >
              {c.gradeLabel}
            </span>
            <span className="session-climb-wide session-climb-cell">{c.angleLabel ?? ""}</span>
            <span className="session-climb-wide session-climb-cell">
              {laps === undefined ? String(c.attempts) : ""}
            </span>
            {laps === undefined ? <ClimbPill kind={c.pill} label={c.resultLabel} /> : <span />}
          </div>
        );
      })}
    </section>
  );
}
