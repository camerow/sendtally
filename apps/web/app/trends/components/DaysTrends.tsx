import React from "react";
import { t } from "@sendtally/features/i18n";
import { useDaysTrends, type DayCellVM, type DaysVM } from "@sendtally/features/trends";
import { BackLink } from "../../components/BackLink";
import { useClientApi } from "../../lib/useClientApi";
import { seriesColour } from "./series";
import { TrendStats } from "./TrendStats";
import { TrendTile } from "./TrendTile";

export function DaysTrends({ apiUrl }: { apiUrl: string }): React.ReactElement {
  const api = useClientApi(apiUrl);
  const state = useDaysTrends(api);
  return (
    <div className="trends">
      <BackLink to="/app/trends">{t("common.trends")}</BackLink>
      <div className="trend-page-head">
        <div className="trends-title">
          <div className="trends-title-row">
            <h1>{t("trends.daysClimbing")}</h1>
          </div>
          {state.status === "ready" && <p className="trends-insight">{state.data.lead}</p>}
        </div>
      </div>
      {state.status === "error" && (
        <span className="trend-muted" style={{ fontSize: 13, marginTop: 22 }}>
          {t("trends.loadFailed")}
        </span>
      )}
      {state.status === "ready" && (
        <>
          <TrendStats stats={state.data.stats} />
          <Calendar vm={state.data} />
          <div className="trend-cards">
            {state.data.tiles.map((tile) => (
              <div key={tile.id} className="trend-card">
                <TrendTile tile={tile} />
              </div>
            ))}
            {state.data.tags.length > 0 && <DaysByTag vm={state.data} />}
          </div>
        </>
      )}
    </div>
  );
}

function Legend(): React.ReactElement {
  const items = [
    { label: t("trends.seriesInside"), colour: seriesColour("inside") },
    { label: t("trends.seriesOutside"), colour: seriesColour("outside") },
    { label: t("trends.seriesRest"), colour: "var(--line-on-light-soft)" },
  ];
  return (
    <div style={{ display: "flex", gap: 18, alignItems: "center" }}>
      {items.map((i) => (
        <span key={i.label} className="trend-legend-item trend-mono">
          <span className="trend-swatch" style={{ width: 12, height: 12, background: i.colour }} />
          {i.label}
        </span>
      ))}
    </div>
  );
}

function Calendar({ vm }: { vm: DaysVM }): React.ReactElement {
  const [hover, setHover] = React.useState<DayCellVM | null>(null);
  return (
    <div
      className="trend-card trend-panel"
      style={{ marginTop: 24 }}
      data-hover={hover !== null}
      onMouseLeave={() => setHover(null)}
    >
      <div className="trend-readout">
        <div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 0 }}>
          <span
            className="trend-mono"
            style={{
              fontSize: 11,
              letterSpacing: "0.08em",
              color: hover === null ? "var(--trend-muted)" : "var(--text-label-accent)",
            }}
          >
            {hover?.date ?? t("trends.range1y")}
          </span>
          <span className="trend-readout-value">{hover?.detail ?? vm.summary}</span>
        </div>
        <Legend />
      </div>
      <div className="trend-calendar-scroll">
        <div
          className="trend-calendar"
          role="group"
          aria-label={t("trends.calendar")}
          style={{ "--weeks": vm.weeks.length } as React.CSSProperties}
        >
          <span />
          {vm.weekdayMarks.map((d, i) => (
            <span key={d} className="trend-calendar-weekday">
              {i % 2 === 0 ? d : ""}
            </span>
          ))}
          {vm.weeks.map((week, w) => (
            <React.Fragment key={week[0]!.key}>
              <span className="trend-calendar-mark">{vm.monthMarks[w]}</span>
              {week.map((cell) => (
                <button
                  key={cell.key}
                  type="button"
                  className="trend-day"
                  data-state={cell.state}
                  data-hit={hover?.key === cell.key}
                  tabIndex={cell.state === "void" ? -1 : 0}
                  aria-hidden={cell.state === "void"}
                  aria-label={`${cell.date}: ${cell.detail}`}
                  onMouseEnter={() => cell.state !== "void" && setHover(cell)}
                  onFocus={() => setHover(cell)}
                  onBlur={() => setHover(null)}
                />
              ))}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}

function DaysByTag({ vm }: { vm: DaysVM }): React.ReactElement {
  const [hover, setHover] = React.useState<number | null>(null);
  const hit = hover === null ? null : vm.tags[hover];
  return (
    <div
      className="trend-card trend-tile"
      data-hover={hit !== undefined && hit !== null}
      onMouseLeave={() => setHover(null)}
    >
      <span className="trend-tile-title">{t("trends.daysByTag")}</span>
      <div className="trend-headline-row">
        <span className="trend-headline">
          {hit == null
            ? t("trends.tagCount", { count: vm.tags.length })
            : t("trends.dayCount", { count: hit.total })}
        </span>
      </div>
      <span className="trend-caption trend-mono">
        {hit == null
          ? t("trends.daysByTagCaption")
          : t("trends.tagDays", { tag: hit.name, inside: hit.inside, outside: hit.outside })}
      </span>
      <div className="trend-tags" data-hover={hit != null} style={{ marginTop: 14 }}>
        {vm.tags.slice(0, 8).map((g, i) => (
          <button
            key={g.slug}
            type="button"
            className="trend-tag-row"
            data-hit={hover === i}
            aria-label={`${g.name}: ${t("trends.dayCount", { count: g.total })}`}
            onMouseEnter={() => setHover(i)}
            onFocus={() => setHover(i)}
            onBlur={() => setHover(null)}
          >
            <span
              style={{
                fontSize: 14,
                fontWeight: 500,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {g.name}
            </span>
            <span className="trend-tag-bars">
              <span
                style={{ width: `${g.insideRatio * 100}%`, background: seriesColour("inside") }}
              />
              <span
                style={{ width: `${g.outsideRatio * 100}%`, background: seriesColour("outside") }}
              />
            </span>
            <span
              style={{
                textAlign: "right",
                fontFamily: "var(--font-mono)",
                fontSize: 12,
                fontWeight: hover === i ? 600 : 500,
              }}
            >
              {g.total}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
