import React from "react";
import type { GradeScales } from "@sendtally/api-client";
import type { GradeScalesFeature } from "@sendtally/features/settings";
import { messageText } from "./styles";

export type GradeScaleSectionProps = {
  scales: GradeScalesFeature;
};

const ROWS: Array<{
  title: string;
  options: Array<{ label: string; patch: Partial<GradeScales> }>;
  active: (current: GradeScales) => string;
}> = [
  {
    title: "Boulders",
    options: [
      { label: "V", patch: { boulder: "v" } },
      { label: "FONT", patch: { boulder: "font" } },
    ],
    active: (current) => (current.boulder === "v" ? "V" : "FONT"),
  },
  {
    title: "Routes",
    options: [
      { label: "YDS", patch: { route: "yds" } },
      { label: "FRENCH", patch: { route: "french" } },
    ],
    active: (current) => (current.route === "yds" ? "YDS" : "FRENCH"),
  },
];

const chip = (active: boolean): React.CSSProperties => ({
  fontFamily: "var(--font-mono)",
  fontWeight: 500,
  fontSize: 10,
  letterSpacing: "0.06em",
  padding: "0 14px",
  minWidth: 64,
  minHeight: 34,
  borderRadius: "var(--radius-pill)",
  cursor: "pointer",
  background: active ? "var(--bs-gold)" : "transparent",
  color: active ? "var(--bs-gunmetal)" : "rgba(64,63,76,0.65)",
  border: active ? "1px solid var(--bs-gold)" : "1px solid rgba(64,63,76,0.18)",
});

export function GradeScaleSection({ scales }: GradeScaleSectionProps): React.ReactElement {
  return (
    <>
      {ROWS.map((row) => {
        const active = row.active(scales.scales);
        return (
          <div
            key={row.title}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 16,
              flexWrap: "wrap",
            }}
          >
            <span style={{ fontWeight: 600, fontSize: 13 }}>{row.title}</span>
            <div style={{ display: "flex", gap: 8 }}>
              {row.options.map((option) => (
                <button
                  key={option.label}
                  type="button"
                  aria-pressed={option.label === active}
                  disabled={scales.busy}
                  onClick={() => scales.set(option.patch)}
                  style={chip(option.label === active)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        );
      })}
      {scales.error !== null && <span style={messageText}>{scales.error}</span>}
    </>
  );
}
