import React from "react";
import type { ProjectBar } from "@sendtally/features/climbs";

const HEIGHT = 120;
const VALUE_BAND = 14;

const label: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontWeight: 500,
  fontSize: 9,
  lineHeight: "12px",
  color: "rgba(64,63,76,0.72)",
  whiteSpace: "nowrap",
};

function fill(bar: ProjectBar): string {
  if (bar.sent) return "var(--bs-gold)";
  return bar.peak ? "var(--data-bar-peak)" : "var(--data-bar)";
}

export function ProjectChart({ bars }: { bars: ProjectBar[] }): React.ReactElement {
  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ position: "relative", height: HEIGHT + VALUE_BAND }}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: VALUE_BAND + (HEIGHT * i) / 3,
              borderTop: "1px solid var(--line-on-light-soft)",
            }}
          />
        ))}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "flex-end",
            gap: 5,
          }}
        >
          {bars.map((bar, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                minWidth: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "flex-end",
              }}
            >
              <span style={{ ...label, height: VALUE_BAND, overflow: "hidden" }}>
                {bar.valueLabel}
              </span>
              <div
                style={{
                  width: "100%",
                  maxWidth: 72,
                  height: Math.max(6, Math.round(bar.height * HEIGHT)),
                  background: fill(bar),
                  borderRadius: "4px 4px 0 0",
                }}
              />
            </div>
          ))}
        </div>
      </div>
      <div
        style={{
          borderTop: "1px solid var(--line-on-light)",
          display: "flex",
          gap: 5,
          height: 16,
        }}
      >
        {bars.map((bar, i) => (
          <span
            key={i}
            style={{ ...label, flex: 1, minWidth: 0, textAlign: "center", paddingTop: 3 }}
          >
            {bar.axisLabel}
          </span>
        ))}
      </div>
    </div>
  );
}
