import React from "react";
import type { GradeScales } from "@sendtally/api-client";
import type { GradeScalesFeature } from "@sendtally/features/settings";
import { disciplineLabel, scaleLabel, type Discipline } from "@sendtally/features/log-session";
import { messageText } from "./styles";

export type GradeScaleSectionProps = {
  scales: GradeScalesFeature;
};

const OPTIONS: Record<Discipline, Array<Partial<GradeScales>>> = {
  boulder: [{ boulder: "v" }, { boulder: "font" }],
  route: [{ route: "yds" }, { route: "french" }],
};

const select: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontWeight: 600,
  fontSize: 13,
  color: "var(--bs-gunmetal)",
  background: "var(--bs-white)",
  border: "1px solid rgba(64,63,76,0.15)",
  borderRadius: "var(--radius-control)",
  padding: "8px 12px",
  minWidth: 120,
  minHeight: 38,
  cursor: "pointer",
};

export function GradeScaleSection({ scales }: GradeScaleSectionProps): React.ReactElement {
  return (
    <>
      {(["boulder", "route"] as const).map((discipline) => (
        <label
          key={discipline}
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 16,
          }}
        >
          <span style={{ fontWeight: 600, fontSize: 13 }}>{disciplineLabel(discipline)}</span>
          <select
            value={scales.scales[discipline]}
            disabled={scales.busy}
            onChange={(e) => scales.set(OPTIONS[discipline][e.target.selectedIndex] ?? {})}
            style={select}
          >
            {OPTIONS[discipline].map((patch) => {
              const scale = patch[discipline] ?? "v";
              return (
                <option key={scale} value={scale}>
                  {scaleLabel(scale)}
                </option>
              );
            })}
          </select>
        </label>
      ))}
      {scales.error !== null && <span style={messageText}>{scales.error}</span>}
    </>
  );
}
