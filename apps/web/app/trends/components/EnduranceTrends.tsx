import React from "react";
import { CIRCUIT_HEX } from "@sendtally/features/gyms";
import { t } from "@sendtally/features/i18n";
import {
  ENDURANCE_RANGES,
  useEnduranceTrends,
  type EnduranceCircuitVM,
} from "@sendtally/features/trends";
import { BackLink } from "../../components/BackLink";
import { useClientApi } from "../../lib/useClientApi";
import { RangeChips } from "./RangeChips";
import { TrendStats } from "./TrendStats";
import { TrendTile } from "./TrendTile";

export function EnduranceTrends({ apiUrl }: { apiUrl: string }): React.ReactElement {
  const api = useClientApi(apiUrl);
  const { state, range, setRange } = useEnduranceTrends(api);
  return (
    <div className="trends">
      <BackLink to="/app/trends">{t("common.trends")}</BackLink>
      <div className="trend-page-head">
        <div className="trends-title">
          <div className="trends-title-row">
            <h1>{t("endurance.title")}</h1>
          </div>
          {state.status === "ready" && <p className="trends-insight">{state.data.insight}</p>}
        </div>
        <RangeChips ranges={ENDURANCE_RANGES} range={range} onChange={setRange} />
      </div>
      {state.status === "error" && (
        <span className="trend-muted" style={{ fontSize: 13, marginTop: 22 }}>
          {t("trends.loadFailed")}
        </span>
      )}
      {state.status === "ready" && (
        <>
          <TrendStats stats={state.data.stats} />
          <div className="trend-cards">
            {state.data.tiles.map((tile) => (
              <div key={tile.id} className="trend-card">
                <TrendTile tile={tile} />
              </div>
            ))}
            {state.data.circuits.length > 0 && <CircuitTable circuits={state.data.circuits} />}
          </div>
        </>
      )}
    </div>
  );
}

function CircuitTable({ circuits }: { circuits: EnduranceCircuitVM[] }): React.ReactElement {
  const [hover, setHover] = React.useState<number | null>(null);
  return (
    <div className="trend-card trend-card-wide trend-panel" onMouseLeave={() => setHover(null)}>
      <span className="trend-tile-title">{t("trends.byCircuit")}</span>
      <p className="trend-panel-note" style={{ margin: "8px 0 0" }}>
        {t("trends.byCircuitBody")}
      </p>
      <div className="trend-table-scroll">
        <div className="trend-table" data-hover={hover !== null}>
          <div className="trend-table-row trend-table-head trend-mono">
            <span>{t("trends.colCircuit")}</span>
            <span>{t("trends.colLength")}</span>
            <span>{t("trends.sets")}</span>
            <span>{t("endurance.laps")}</span>
            <span>{t("trends.cleanRate")}</span>
            <span>{t("trends.colBestRun")}</span>
            <span>{t("trends.colTrend")}</span>
          </div>
          {circuits.map((c, i) => (
            <button
              key={c.key}
              type="button"
              className="trend-table-row"
              data-hit={hover === i}
              aria-label={t("trends.circuitRowLabel", {
                circuit: c.label,
                rate: c.rate,
                best: c.best,
              })}
              onMouseEnter={() => setHover(i)}
              onFocus={() => setHover(i)}
              onBlur={() => setHover(null)}
            >
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  fontWeight: 600,
                  fontSize: 15,
                  minWidth: 0,
                }}
              >
                {c.colour !== null && (
                  <span
                    style={{
                      width: 14,
                      height: 14,
                      flex: "none",
                      borderRadius: "50%",
                      background: CIRCUIT_HEX[c.colour],
                      boxShadow: "inset 0 0 0 1px rgba(64,63,76,0.2)",
                    }}
                  />
                )}
                <span
                  style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                >
                  {c.label}
                </span>
              </span>
              <span style={{ fontSize: 14, color: "var(--text-on-light-secondary)" }}>
                {c.length}
              </span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 13 }}>{c.sets}</span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 13 }}>{c.laps}</span>
              <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span className="trend-meter">
                  <span
                    style={{
                      width: `${Math.round(c.ratio * 100)}%`,
                      background: "var(--series-clean)",
                    }}
                  />
                </span>
                <span className="trend-rate">{c.rate}</span>
              </span>
              <span style={{ fontSize: 14 }}>{c.best}</span>
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 12,
                  color: "var(--text-on-light-secondary)",
                }}
              >
                {c.trend}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
