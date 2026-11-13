import React from "react";
import { Link } from "react-router";
import { climbPills } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import {
  CLIMB_SORTS,
  climbSortLabel,
  type ClimbSort,
  type ClimbVM,
} from "@sendtally/features/session-detail";
import { CircuitDot } from "../../components/CircuitDot";
import { Icon } from "../../components/Icon";
import { sectionLabel } from "../../components/styles";
import { EnduranceLaps } from "./EnduranceLaps";

const RESULT_BADGES: Record<ClimbVM["pill"], { fill: string; ink: string; line?: string }> =
  climbPills;

const GRID = "34px 1.9fr 62px 62px 70px 92px";

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
          value={sort}
          onChange={(e) => onSort(e.target.value as ClimbSort)}
          style={{
            fontFamily: "var(--font-mono)",
            fontWeight: 500,
            fontSize: 12,
            color: "var(--bs-gunmetal)",
            background: "#F7F6F3",
            border: "1px solid rgba(64,63,76,0.15)",
            borderRadius: "var(--radius-control)",
            padding: "9px 12px",
            cursor: "pointer",
          }}
        >
          {CLIMB_SORTS.map((s) => (
            <option key={s} value={s}>
              {climbSortLabel(s)}
            </option>
          ))}
        </select>
      </div>

      <div style={{ overflowX: "auto" }}>
        <div style={{ minWidth: 560 }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: GRID,
              gap: 12,
              padding: "12px 4px 9px",
              alignItems: "center",
            }}
          >
            {[
              "#",
              t("sessionDetail.colClimb"),
              t("common.grade"),
              t("sessionDetail.colAngle"),
              t("sessionDetail.colAttempts"),
              t("common.result"),
            ].map((h) => (
              <span key={h} style={sectionLabel}>
                {h}
              </span>
            ))}
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {climbs.map((c) => {
              const badge = RESULT_BADGES[c.pill];
              const endurance = c.endurance !== undefined;
              return (
                <div
                  key={c.n}
                  style={{
                    display: "grid",
                    gridTemplateColumns: GRID,
                    gap: 12,
                    padding: "12px 4px",
                    alignItems: "start",
                    borderTop: "1px solid var(--line-on-light)",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 12,
                      color: "rgba(64,63,76,0.5)",
                    }}
                  >
                    {c.n}
                  </span>
                  <span style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 0 }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                      {c.colour !== undefined && <CircuitDot colour={c.colour} size={12} />}
                      {c.endurance !== undefined && (
                        <span style={{ display: "inline-flex", color: "var(--bs-petal-ink)" }}>
                          <Icon name="endurance" size={14} strokeWidth={2.4} />
                        </span>
                      )}
                      <span
                        style={{
                          fontWeight: 500,
                          fontSize: 15,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {c.climbSlug === null ? (
                          c.name
                        ) : (
                          <Link
                            to={`/app/climbs/${c.climbSlug}`}
                            style={{ color: "inherit", textDecorationColor: "rgba(64,63,76,0.3)" }}
                          >
                            {c.name}
                          </Link>
                        )}
                      </span>
                    </span>
                    {climbAreas && c.area !== null && (
                      <span style={{ fontSize: 12.5, color: "var(--text-on-white-secondary)" }}>
                        {c.area}
                      </span>
                    )}
                    {c.note !== null && (
                      <span
                        style={{
                          fontSize: 13,
                          lineHeight: 1.5,
                          whiteSpace: "pre-line",
                          color: "var(--text-on-white-secondary)",
                          borderLeft: "2px solid rgba(64,63,76,0.12)",
                          paddingLeft: 10,
                        }}
                      >
                        {c.note}
                      </span>
                    )}
                    {c.endurance !== undefined && <EnduranceLaps endurance={c.endurance} />}
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontWeight: 600,
                      fontSize: 14,
                      color: c.isTopSend ? "var(--text-label-accent)" : "var(--bs-gunmetal)",
                    }}
                  >
                    {c.gradeLabel}
                  </span>
                  {[c.angleLabel ?? "", endurance ? "" : String(c.attempts)].map((value, i) => (
                    <span
                      key={i}
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: 12,
                        color: "rgba(64,63,76,0.72)",
                      }}
                    >
                      {value}
                    </span>
                  ))}
                  {endurance ? (
                    <span />
                  ) : (
                    <span
                      style={{
                        justifySelf: "start",
                        fontFamily: "var(--font-mono)",
                        fontWeight: 500,
                        fontSize: 10,
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        borderRadius: "var(--radius-pill)",
                        padding: "3px 9px",
                        background: badge.fill,
                        border: `1px solid ${badge.line ?? "transparent"}`,
                        color: badge.ink,
                      }}
                    >
                      {c.resultLabel}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
