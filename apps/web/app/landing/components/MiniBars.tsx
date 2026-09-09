import React from "react";
import { inViewClass, useInView } from "../useInView";

export type MiniBar = {
  key: string;
  value: number;
  label?: string;
  topLabel?: string;
  peak?: boolean;
};

const LABEL_HEIGHT = 12;
const LABEL_GAP = 5;

function BarLabel({ text }: { text: string | undefined }): React.ReactElement {
  return (
    <span
      style={{
        height: LABEL_HEIGHT,
        lineHeight: `${LABEL_HEIGHT}px`,
        fontFamily: "var(--font-mono)",
        fontWeight: 500,
        fontSize: 10,
        color: "var(--text-on-white-secondary)",
        whiteSpace: "nowrap",
      }}
    >
      {text === undefined || text === "" ? " " : text}
    </span>
  );
}

export function MiniBars({
  bars,
  height = 52,
  gap = 6,
  grow = "off",
}: {
  bars: MiniBar[];
  height?: number;
  gap?: number;
  grow?: "in-view" | "mount" | "off";
}): React.ReactElement {
  const [ref, state] = useInView<HTMLDivElement>(grow);
  const max = Math.max(1, ...bars.map((b) => b.value));
  const hasTopLabels = bars.some((b) => b.topLabel !== undefined);
  const hasAxisLabels = bars.some((b) => b.label !== undefined);
  return (
    <div
      ref={ref}
      className={inViewClass("l-bars", state)}
      style={{ display: "flex", alignItems: "flex-end", gap }}
    >
      {bars.map((b, i) => (
        <div
          key={b.key}
          style={{
            flex: 1,
            minWidth: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: LABEL_GAP,
          }}
        >
          {hasTopLabels && <BarLabel text={b.topLabel} />}
          <div
            className="l-bar"
            style={
              {
                "--bar-index": i,
                width: "100%",
                height: b.value === 0 ? 4 : Math.max(6, Math.round((b.value / max) * height)),
                background:
                  b.value === 0
                    ? "var(--data-bar-empty)"
                    : b.peak
                      ? "var(--data-bar-peak)"
                      : "var(--data-bar)",
                borderRadius: "4px 4px 0 0",
              } as React.CSSProperties
            }
          />
          {hasAxisLabels && <BarLabel text={b.label} />}
        </div>
      ))}
    </div>
  );
}
