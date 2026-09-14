import React from "react";
import { Badge, GradeBars, Label, StatStrip } from "@sendtally/design";
import { useLanding } from "../LandingContext";

export function SessionPreviewCard(): React.ReactElement {
  const { copy } = useLanding();
  const { stats } = copy.hero.faces;
  return (
    <div
      style={{
        background: "var(--bs-white)",
        border: "1px solid var(--line-on-light-soft)",
        borderRadius: "var(--radius-card-lg)",
        boxShadow: "0 20px 48px rgba(20,19,26,0.14)",
        overflow: "hidden",
        fontFamily: "var(--font-sans)",
        color: "var(--bs-gunmetal)",
      }}
    >
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: 11,
          padding: "16px 18px 12px",
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            background: "var(--bs-petal-ink)",
            color: "var(--bs-white)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "var(--font-mono)",
            fontWeight: 600,
            fontSize: 14,
          }}
        >
          WH
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <span style={{ fontWeight: 600, fontSize: 14 }}>Will Cameron</span>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 12,
              color: "var(--text-on-white-secondary)",
            }}
          >
            {copy.strava.preview.meta}
          </span>
        </div>
        <Badge tone="azure" pill={false} style={{ marginLeft: "auto", whiteSpace: "nowrap" }}>
          {copy.hero.faces.via}
        </Badge>
      </div>
      <div
        style={{ padding: "0 18px 14px", fontWeight: 600, fontSize: 19, letterSpacing: "-0.01em" }}
      >
        {copy.hero.faces.stravaTitle}
      </div>
      <StatStrip
        stats={[
          { label: stats.time, value: "1:24" },
          { label: stats.sends, value: "14" },
          { label: stats.attempts, value: "31" },
          { label: stats.grades, value: "V4–V7" },
        ]}
      />
      <div style={{ padding: "16px 18px 18px", display: "flex", flexDirection: "column", gap: 10 }}>
        <Label on="light" size={10}>
          {copy.strava.preview.chartLabel}
        </Label>
        <GradeBars
          bars={[
            { grade: "V4", count: 4 },
            { grade: "V5", count: 6 },
            { grade: "V6", count: 3 },
            { grade: "V7", count: 1, peak: true },
            { grade: "V8", count: 0 },
          ]}
        />
      </div>
    </div>
  );
}
