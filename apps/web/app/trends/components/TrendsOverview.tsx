import React from "react";
import { Link } from "react-router";
import { TILE_BREAKDOWN_ROWS, useTrends } from "@sendtally/features/trends";
import { UPGRADE_PANEL_ID, UpgradePanel } from "../../billing/components/UpgradePanel";
import { useClientApi } from "../../lib/useClientApi";
import { TrendBars } from "./TrendBars";
import { TrendFilters } from "./TrendFilters";
import { TrendTagBreakdown } from "./TrendTagBreakdown";

export type TrendsOverviewProps = {
  apiUrl: string;
  preview?: boolean;
};

const monoMuted: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontWeight: 500,
  fontSize: 11,
  letterSpacing: "0.06em",
  color: "rgba(64,63,76,0.55)",
};

const tileStyle: React.CSSProperties = {
  background: "var(--bs-white)",
  border: "1px solid var(--line-on-light-soft)",
  borderRadius: "var(--radius-card)",
  padding: 26,
  display: "flex",
  flexDirection: "column",
  gap: 10,
  textDecoration: "none",
  color: "var(--bs-gunmetal)",
};

const scrollToPanel = (): void => {
  document.getElementById(UPGRADE_PANEL_ID)?.scrollIntoView({ behavior: "smooth", block: "start" });
};

export function TrendsOverview({
  apiUrl,
  preview = false,
}: TrendsOverviewProps): React.ReactElement {
  const api = useClientApi(apiUrl);
  const feature = useTrends(api, { preview });
  const { state } = feature;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 16, flexWrap: "wrap" }}>
        <h1
          style={{
            margin: 0,
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            fontSize: 32,
            letterSpacing: "-0.03em",
          }}
        >
          Trends
        </h1>
        {state.status === "ready" && <span style={monoMuted}>{state.data.caption}</span>}
      </div>
      <TrendFilters feature={feature} onLockedRange={scrollToPanel} />
      {state.status === "loading" && (
        <span style={{ ...monoMuted, display: "block", marginTop: 22 }}>LOADING…</span>
      )}
      {state.status === "error" && (
        <span style={{ ...monoMuted, display: "block", marginTop: 22 }}>
          Could not load trends. Refresh to retry.
        </span>
      )}
      {state.status === "ready" && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: 18,
            marginTop: 24,
          }}
        >
          {state.data.tiles.map((tile) => {
            const body = (
              <>
                <span
                  style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
                >
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontWeight: 500,
                      fontSize: 11,
                      letterSpacing: "0.08em",
                      color: "var(--text-label-accent)",
                    }}
                  >
                    {tile.label}
                  </span>
                  {!preview && (
                    <span
                      style={{
                        ...monoMuted,
                        fontSize: 10,
                        letterSpacing: "0.08em",
                        color: "rgba(64,63,76,0.72)",
                      }}
                    >
                      DETAILS →
                    </span>
                  )}
                </span>
                <span
                  style={{
                    fontFamily: "var(--font-display)",
                    fontWeight: 700,
                    fontSize: 30,
                    letterSpacing: "-0.02em",
                  }}
                >
                  {tile.value}
                </span>
                <span style={{ ...monoMuted, color: "rgba(64,63,76,0.72)" }}>{tile.caption}</span>
                <div style={{ marginTop: 4 }}>
                  <TrendBars bars={tile.bars} height={44} />
                </div>
                <TrendTagBreakdown
                  compact
                  title="BY TAG"
                  rows={state.data.details[tile.metric].breakdown.slice(0, TILE_BREAKDOWN_ROWS)}
                />
              </>
            );
            return preview ? (
              <div key={tile.metric} style={tileStyle}>
                {body}
              </div>
            ) : (
              <Link key={tile.metric} to={`/app/trends/${tile.metric}`} style={tileStyle}>
                {body}
              </Link>
            );
          })}
        </div>
      )}
      {preview && (
        <div style={{ marginTop: 24 }}>
          <UpgradePanel />
        </div>
      )}
    </div>
  );
}
