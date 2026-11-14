import React from "react";
import { t } from "@sendtally/features/i18n";
import { dots, plot, polyline } from "@sendtally/features/statistics";
import { useWidth } from "./useWidth";

const HEIGHT = 44;
const NEUTRAL_RPE = 6;

/** A small effort line under the load chart; sessions without effort sit at 6. */
export function EffortLine({ rpes }: { rpes: readonly (number | null)[] }): React.ReactElement {
  const [box, width] = useWidth();
  const points = plot(
    rpes.map((r) => r ?? NEUTRAL_RPE),
    1,
    10,
    width,
    HEIGHT,
    5
  );
  return (
    <div className="effort-line">
      <span className="train-label train-label--small">{t("hang.effortRpe")}</span>
      <div ref={box} className="effort-line-plot">
        {width > 0 && (
          <svg width={width} height={HEIGHT} role="img" aria-label={t("hang.effortPerSession")}>
            <polyline
              points={polyline(points)}
              fill="none"
              stroke="var(--bs-petal)"
              strokeWidth={2}
              strokeLinejoin="round"
            />
            <path d={dots(points)} stroke="var(--bs-petal)" strokeWidth={6} strokeLinecap="round" />
          </svg>
        )}
      </div>
    </div>
  );
}
