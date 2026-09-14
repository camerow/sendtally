import React from "react";
import { useLanding } from "../LandingContext";
import type { SessionSampleCopy } from "../copy";
import { Label } from "@sendtally/design";
import { StatGrid } from "./StatGrid";

type Result = "FLASH" | "SENT" | "PROJECT";

type Climb = {
  n: number;
  grade: string;
  burns: string;
  result: Result;
  top?: boolean;
};

const CLIMBS: Climb[] = [
  {
    n: 1,
    grade: "V2",
    burns: "1",
    result: "FLASH",
  },
  {
    n: 4,
    grade: "V5",
    burns: "2",
    result: "SENT",
  },
  {
    n: 7,
    grade: "V6",
    burns: "2",
    result: "SENT",
  },
  {
    n: 9,
    grade: "V6",
    burns: "3",
    result: "SENT",
  },
  {
    n: 10,
    grade: "V7",
    burns: "5",
    result: "SENT",
    top: true,
  },
  {
    n: 12,
    grade: "V8",
    burns: "2",
    result: "PROJECT",
  },
];

const resultStyles: Record<Result, React.CSSProperties> = {
  FLASH: {
    background: "var(--bs-gold)",
    border: "1px solid var(--bs-gold)",
    color: "var(--bs-gunmetal)",
  },
  SENT: {
    background: "transparent",
    border: "1px solid rgba(64,63,76,0.25)",
    color: "var(--text-on-white-secondary)",
  },
  PROJECT: {
    background: "transparent",
    border: "1px solid rgba(64,63,76,0.15)",
    color: "rgba(64,63,76,0.55)",
  },
};

function ResultBadge({ result }: { result: Result }): React.ReactElement {
  const { copy } = useLanding();
  return (
    <span
      style={{
        justifySelf: "start",
        fontFamily: "var(--font-mono)",
        fontWeight: 500,
        fontSize: 10,
        letterSpacing: "var(--type-label-track)",
        borderRadius: "var(--radius-pill)",
        padding: "3px 9px",
        whiteSpace: "nowrap",
        ...resultStyles[result],
      }}
    >
      {copy.session.sample.results[result]}
    </span>
  );
}

const metaStyle: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontSize: 12,
  color: "var(--text-on-white-secondary)",
};

function ClimbRow({
  climb,
  name,
  sample,
}: {
  climb: Climb;
  name: string;
  sample: SessionSampleCopy;
}): React.ReactElement {
  return (
    <div className="l-climb-row">
      <span
        className="l-climb-num"
        style={{ ...metaStyle, color: "rgba(64,63,76,0.5)", alignSelf: "center" }}
      >
        {climb.n}
      </span>
      <span className="l-climb-name" style={{ fontWeight: 500, fontSize: 15, minWidth: 0 }}>
        {name}
      </span>
      <span className="l-climb-meta">
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontWeight: 600,
            fontSize: 14,
            color: climb.top === true ? "var(--text-label-accent)" : "var(--bs-gunmetal)",
          }}
        >
          {climb.grade}
        </span>
        <span style={metaStyle}>
          {climb.burns}
          <span className="l-inline-label">{climb.burns === "1" ? sample.burn : sample.burns}</span>
        </span>
      </span>
      <span className="l-climb-result">
        <ResultBadge result={climb.result} />
      </span>
    </div>
  );
}

export function SessionBreakdown(): React.ReactElement {
  const { copy } = useLanding();
  const { sample } = copy.session;
  return (
    <div id="session" className="l-session">
      <div className="l-section-header">
        <h2 className="l-section-title" style={{ color: "var(--bs-gunmetal)" }}>
          {copy.session.title}
        </h2>
        <span className="l-section-blurb">{copy.session.blurb}</span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <span
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            fontSize: 26,
            letterSpacing: "-0.02em",
          }}
        >
          {sample.title}
        </span>
        <Label on="light" style={{ letterSpacing: "0.06em" }}>
          {sample.meta}
        </Label>
      </div>

      <StatGrid
        items={[
          { label: sample.stats.time, value: "1H 28M" },
          { label: sample.stats.climbs, value: "12" },
          { label: sample.stats.sends, value: "10" },
          { label: sample.stats.avgGrade, value: "V4.9" },
          { label: sample.stats.flashes, value: "3" },
          { label: sample.stats.attempts, value: "24" },
          { label: sample.stats.top, value: "V7", accent: true },
        ]}
      />

      <div style={{ display: "flex", flexDirection: "column" }}>
        <div className="l-climb-head">
          {sample.headings.map((h) => (
            <Label key={h} on="accent" size={10}>
              {h}
            </Label>
          ))}
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          {CLIMBS.map((c, i) => (
            <ClimbRow key={c.n} climb={c} name={sample.climbs[i] ?? ""} sample={sample} />
          ))}
        </div>
      </div>

      <Label on="light" style={{ letterSpacing: "0.06em" }}>
        {copy.session.footnote}
      </Label>
    </div>
  );
}
