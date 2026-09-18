import React from "react";
import { Link } from "react-router";
import { t } from "@sendtally/features/i18n";
import { thinned, useTween, type TrendPointVM, type TrendTileVM } from "@sendtally/features/trends";
import { seriesColour } from "./series";

const PLOT_HEIGHT = 144;
const VALUE_BAND = 16;
const BAR_HEIGHT = PLOT_HEIGHT - VALUE_BAND;

const pointTotal = (p: TrendPointVM): number | null =>
  p.a === null && p.b === null ? null : (p.a ?? 0) + (p.b ?? 0);

export type TrendTileProps = {
  tile: TrendTileVM;
  /** Where the details link goes; a preview swaps it for the membership prompt. */
  onLockedLink?: () => void;
};

export function TrendTile({ tile, onLockedLink }: TrendTileProps): React.ReactElement {
  const [hover, setHover] = React.useState<number | null>(null);
  const hit = hover !== null && hover < tile.points.length ? hover : null;
  const point = hit === null ? null : tile.points[hit]!;
  const target = point === null ? tile.total : pointTotal(point);
  const shown = useTween(target, point === null ? 480 : 260);
  const [lo, hi] = tile.domain;
  const y = (v: number): number => ((v - lo) / (hi - lo || 1)) * BAR_HEIGHT;
  const axisShown = thinned(tile.points);
  const n = Math.max(1, tile.points.length);
  const stacked = tile.chart === "stack";
  const [first, second] = tile.series;
  const clear = (): void => setHover(null);

  return (
    <div className="trend-tile" data-hover={hit !== null} onMouseLeave={clear}>
      <div className="trend-tile-top">
        <span className="trend-tile-title">{tile.title}</span>
        {tile.link !== null && (
          <Link
            to={`/app/trends/${tile.link}`}
            className="trend-tile-link"
            onClick={
              onLockedLink === undefined
                ? undefined
                : (e) => {
                    e.preventDefault();
                    onLockedLink();
                  }
            }
          >
            {t("trends.details")}
          </Link>
        )}
      </div>
      <div className="trend-headline-row">
        <span className="trend-headline" aria-live="polite">
          {shown === null ? "-" : `${tile.format(shown)}${tile.unit}`}
        </span>
        {tile.delta !== null && <span className="trend-delta">{tile.delta}</span>}
      </div>
      <span className="trend-caption trend-mono">{point?.label ?? tile.caption}</span>
      <span className="trend-sub">{point === null ? tile.sub : (point.split ?? "")}</span>
      <div className="trend-legend">
        {tile.series.length > 1 &&
          tile.series.map((s) => (
            <span key={s.key} className="trend-legend-item trend-mono">
              <span className="trend-swatch" style={{ background: seriesColour(s.key) }} />
              {s.label}
            </span>
          ))}
      </div>
      <div className="trend-chart">
        <div className="trend-yaxis" style={{ height: PLOT_HEIGHT }}>
          {tile.ticks.map((tick, i) => (
            <span key={i} className="trend-tick" style={{ top: VALUE_BAND + (BAR_HEIGHT * i) / 2 }}>
              {tick}
            </span>
          ))}
        </div>
        <div className="trend-plot-wrap">
          <div className="trend-plot" data-hover={hit !== null}>
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="trend-gridline"
                style={{ top: VALUE_BAND + (BAR_HEIGHT * i) / 2 }}
              />
            ))}
            {tile.chart === "line" ? (
              <LineChart tile={tile} hit={hit} y={y} n={n} />
            ) : (
              <div className="trend-bars" style={{ gap: tile.points.length > 16 ? 3 : 6 }}>
                {tile.points.map((p, i) => {
                  const a = p.a ?? 0;
                  const b = stacked ? (p.b ?? 0) : 0;
                  const empty = a + b <= lo;
                  const hA = empty ? 3 : a <= 0 ? 0 : Math.max(2, y(a));
                  const hB = b <= 0 ? 0 : Math.max(2, y(lo + b));
                  return (
                    <div key={i} className="trend-col" data-hit={hit === i}>
                      {hB > 0 && (
                        <div
                          className="trend-seg trend-seg-top"
                          style={{ height: hB, background: seriesColour(second?.key ?? "primary") }}
                        />
                      )}
                      {hA > 0 && hB > 0 && <div className="trend-seg" style={{ height: 2 }} />}
                      {hA > 0 && (
                        <div
                          className={hB > 0 ? "trend-seg" : "trend-seg trend-seg-top"}
                          style={{
                            height: hA,
                            background: empty
                              ? "var(--data-bar-empty)"
                              : seriesColour(first?.key ?? "primary"),
                          }}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            {point !== null && hit !== null && pointTotal(point) !== null && (
              <span
                className="trend-col-value"
                style={{
                  left: `${((hit + 0.5) / n) * 100}%`,
                  top:
                    PLOT_HEIGHT -
                    Math.max(3, y(pointTotal(point)!)) -
                    (tile.chart === "line" ? 10 : 0),
                }}
              >
                {tile.format(pointTotal(point)!)}
              </span>
            )}
            <div className="trend-hits">
              {tile.points.map((p, i) => {
                const total = pointTotal(p);
                return (
                  <button
                    key={i}
                    type="button"
                    className="trend-hit"
                    data-hit={hit === i}
                    aria-label={`${p.label}: ${total === null ? "-" : tile.format(total)}`}
                    onMouseEnter={() => setHover(i)}
                    onFocus={() => setHover(i)}
                    onBlur={clear}
                  />
                );
              })}
            </div>
          </div>
          <div className="trend-axis" style={{ gap: tile.points.length > 16 ? 3 : 6 }}>
            {tile.points.map((p, i) => (
              <span key={i} data-hit={hit === i}>
                {hit === i || (hit === null && axisShown[i]) ? p.axis : ""}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function LineChart({
  tile,
  hit,
  y,
  n,
}: {
  tile: TrendTileVM;
  hit: number | null;
  y: (v: number) => number;
  n: number;
}): React.ReactElement {
  const colour = seriesColour(tile.series[0]?.key ?? "primary");
  const at = tile.points.map((p, i) =>
    p.a === null ? null : { x: ((i + 0.5) / n) * 100, y: BAR_HEIGHT - y(p.a) }
  );
  let d = "";
  let pen = false;
  for (const p of at) {
    if (p === null) {
      pen = false;
      continue;
    }
    d += `${pen ? "L" : "M"}${p.x.toFixed(2)} ${p.y.toFixed(1)} `;
    pen = true;
  }
  return (
    <>
      <svg
        className="trend-line"
        viewBox={`0 0 100 ${BAR_HEIGHT}`}
        preserveAspectRatio="none"
        aria-hidden="true"
        style={{ height: BAR_HEIGHT }}
      >
        <path
          d={d}
          fill="none"
          stroke={colour}
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      {at.map((p, i) =>
        p === null ? null : (
          <span
            key={i}
            className="trend-dot"
            data-hit={hit === i}
            style={{ left: `${p.x}%`, top: VALUE_BAND + p.y, background: colour }}
          />
        )
      )}
    </>
  );
}
