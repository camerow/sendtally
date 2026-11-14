import React from "react";
import { thinned, useTween, type TrendPointVM, type TrendTileVM } from "@sendtally/features/trends";
import { seriesColour } from "./series";

const VALUE_BAND = 16;

const pointTotal = (p: TrendPointVM): number | null =>
  p.a === null && p.b === null ? null : (p.a ?? 0) + (p.b ?? 0);

const PLOT_HEIGHT = 144;

/** A trip's pyramid as a chart, its total read out and each bar's on hover. */
export function TrendTile({ tile }: { tile: TrendTileVM }): React.ReactElement {
  const barHeight = PLOT_HEIGHT - VALUE_BAND;
  const [hover, setHover] = React.useState<number | null>(null);
  const hit = hover !== null && hover < tile.points.length ? hover : null;
  const point = hit === null ? null : tile.points[hit]!;
  const target = point === null ? tile.total : pointTotal(point);
  const shown = useTween(target, point === null ? 480 : 260);
  const [lo, hi] = tile.domain;
  const y = (v: number): number => ((v - lo) / (hi - lo || 1)) * barHeight;
  const axisShown = thinned(tile.points);
  const n = Math.max(1, tile.points.length);
  const [first, second] = tile.series;
  const clear = (): void => setHover(null);

  return (
    <div className="trend-tile" data-hover={hit !== null} onMouseLeave={clear}>
      <div className="trend-tile-top">
        <span className="trend-tile-title">{tile.title}</span>
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
            <span key={i} className="trend-tick" style={{ top: VALUE_BAND + (barHeight * i) / 2 }}>
              {tick}
            </span>
          ))}
        </div>
        <div className="trend-plot-wrap">
          <div className="trend-plot" data-hover={hit !== null} style={{ height: PLOT_HEIGHT }}>
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="trend-gridline"
                style={{ top: VALUE_BAND + (barHeight * i) / 2 }}
              />
            ))}
            <div className="trend-bars" style={{ gap: tile.points.length > 16 ? 3 : 6 }}>
              {tile.points.map((p, i) => {
                const a = p.a ?? 0;
                const b = p.b ?? 0;
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
            {point !== null && hit !== null && pointTotal(point) !== null && (
              <span
                className="trend-col-value"
                style={{
                  left: `${((hit + 0.5) / n) * 100}%`,
                  top: PLOT_HEIGHT - Math.max(3, y(pointTotal(point)!)),
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
