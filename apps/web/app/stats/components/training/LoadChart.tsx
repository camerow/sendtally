import React from "react";
import { colors } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import { LOAD_PLOT, loadPlot, type LoadVM } from "@sendtally/features/statistics";
import { useWidth } from "../../../training/components/useWidth";

/** Grey bars, the latest gold, the dashed average labelled in the gutter; hover or focus a bar to read it. */
export function LoadChart({
  load,
  hit,
  onHit,
}: {
  load: LoadVM;
  hit: number | null;
  onHit: (i: number | null) => void;
}): React.ReactElement {
  const [box, width] = useWidth();
  const plot = loadPlot(load, width);
  const last = load.bars.length - 1;
  const dim = (i: number): number => (hit === null || hit === i ? 1 : 0.3);

  return (
    <div className="load-chart">
      <div ref={box} className="load-plot" style={{ height: LOAD_PLOT.height }}>
        {width > 0 && (
          <svg width={width} height={LOAD_PLOT.height} aria-hidden="true">
            {plot.bars.map((b, i) =>
              b.path === null ? (
                <rect
                  key={i}
                  x={b.x}
                  y={b.y}
                  width={b.w}
                  height={b.h}
                  rx={1}
                  fill={colors.dataBarEmpty}
                  opacity={dim(i)}
                />
              ) : (
                <path
                  key={i}
                  d={b.path}
                  fill={
                    hit === i
                      ? colors.gunmetal
                      : i === last
                        ? colors.gold
                        : colors.lineOnLightStrong
                  }
                  stroke={hit !== i && i === last ? colors.gunmetal : undefined}
                  strokeWidth={1.5}
                  opacity={dim(i)}
                />
              )
            )}
            {plot.bars.map((b, i) =>
              load.bars[i]?.under ? (
                <circle
                  key={`u${i}`}
                  cx={b.x + b.w / 2}
                  cy={LOAD_PLOT.dotY}
                  r={2}
                  fill={colors.gunmetal}
                  opacity={dim(i)}
                />
              ) : null
            )}
            {plot.averageY !== null && (
              <>
                <line
                  x1={0}
                  x2={plot.right}
                  y1={plot.averageY}
                  y2={plot.averageY}
                  stroke={colors.gunmetal}
                  strokeWidth={1.5}
                  strokeDasharray="4 3"
                />
                <text
                  x={plot.right + 8}
                  y={plot.averageY + 4}
                  fontFamily="var(--font-mono)"
                  fontWeight={600}
                  fontSize={11}
                  fill={colors.gunmetal}
                >
                  {load.averageText}
                </text>
              </>
            )}
          </svg>
        )}
        {load.state === "load" && (
          <div
            className="load-hits"
            role="group"
            aria-label={t("statistics.loadChartLabel", { count: load.bars.length })}
            style={{ width: plot.right }}
            onMouseLeave={() => onHit(null)}
          >
            {load.bars.map((b, i) => (
              <button
                key={i}
                type="button"
                className="load-hit"
                aria-label={b.spoken}
                aria-pressed={hit === i}
                onMouseEnter={() => onHit(i)}
                onFocus={() => onHit(i)}
                onBlur={() => onHit(null)}
                onClick={() => onHit(hit === i ? null : i)}
              />
            ))}
          </div>
        )}
      </div>
      <div className="insights-axis" style={{ width: plot.right }}>
        {load.ticks.map((tick) => (
          <span key={tick}>{tick}</span>
        ))}
      </div>
    </div>
  );
}
