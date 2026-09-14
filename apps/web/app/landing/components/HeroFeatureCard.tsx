import React from "react";
import type { HeroFeatureCopy } from "../copy";
import { useLanding } from "../LandingContext";
import { Badge, GradeBars, Label } from "@sendtally/design";
import {
  EFFORT_BARS,
  EFFORT_STATS,
  PYRAMID_BARS,
  PROJECT_STATS,
  PROJECTS,
  PYRAMID_STATS,
  STRAVA_BARS,
  STRAVA_STATS,
  TAG_BARS,
  TAG_STATS,
  TAGS,
  TREND_BARS,
  TREND_STATS,
} from "./heroFaces";
import { MiniBars } from "./MiniBars";
import { RangeChips } from "./RangeChips";
import { StatGrid } from "./StatGrid";

function Chart({
  label,
  children,
}: {
  label?: string;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <Label on="accent">{label}</Label>
      {children}
    </div>
  );
}

function Face({ feature }: { feature: HeroFeatureCopy }): React.ReactElement {
  if (feature.key === "tags") {
    return (
      <>
        <div className="l-hero-tags">
          {TAGS.map((tag) => (
            <span key={tag} className="l-free-pill">
              {tag}
            </span>
          ))}
        </div>
        <Chart label={feature.chartLabel}>
          <MiniBars bars={TAG_BARS} height={64} grow="mount" />
        </Chart>
        <StatGrid tone="white" items={TAG_STATS} />
      </>
    );
  }
  if (feature.key === "effort") {
    return (
      <>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
          <span className="l-hero-figure">7.4</span>
          <Label on="light" size={10}>
            RPE LAST SESSION
          </Label>
        </div>
        <Chart label={feature.chartLabel}>
          <MiniBars bars={EFFORT_BARS} height={64} grow="mount" />
        </Chart>
        <StatGrid tone="white" items={EFFORT_STATS} />
      </>
    );
  }
  if (feature.key === "pyramid") {
    return (
      <>
        <Chart label={feature.chartLabel}>
          <GradeBars bars={PYRAMID_BARS} height={104} />
        </Chart>
        <StatGrid tone="white" items={PYRAMID_STATS} />
      </>
    );
  }
  if (feature.key === "projects") {
    return (
      <>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {PROJECTS.map((project) => (
            <div key={project.name} className="l-hero-project">
              <span style={{ fontWeight: 600, fontSize: 14 }}>{project.name}</span>
              <Badge tone={project.sent ? "petal" : "azure"} pill={false}>
                {project.grade}
              </Badge>
              <span className="l-hero-project-meta">
                {project.sessions} sessions · {project.attempts} tries
              </span>
            </div>
          ))}
        </div>
        <StatGrid tone="white" items={PROJECT_STATS} />
      </>
    );
  }
  if (feature.key === "strava") {
    return (
      <>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Badge tone="azure" pill={false}>
            via sendtally
          </Badge>
          <Label on="light" size={10}>
            ROCK CLIMBING
          </Label>
        </div>
        <div style={{ fontWeight: 600, fontSize: 17, letterSpacing: "-0.01em" }}>
          Solid climbing session - 18 climbs, top V7
        </div>
        <Chart label={feature.chartLabel}>
          <GradeBars bars={STRAVA_BARS} height={82} />
        </Chart>
        <StatGrid tone="white" items={STRAVA_STATS} />
      </>
    );
  }
  return (
    <>
      <RangeChips active="3M" size="sm" />
      <Chart label={feature.chartLabel}>
        <MiniBars bars={TREND_BARS} height={78} grow="mount" />
      </Chart>
      <StatGrid tone="white" items={TREND_STATS} />
    </>
  );
}

export function HeroFeatureCard({ index }: { index: number }): React.ReactElement {
  const { copy } = useLanding();
  const feature = copy.hero.features[index] ?? copy.hero.features[0];
  return (
    <div className="l-hero-card">
      <div key={feature.key} className="l-hero-face">
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "baseline",
            justifyContent: "space-between",
            gap: "4px 16px",
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              fontSize: 26,
              letterSpacing: "-0.02em",
            }}
          >
            {feature.cardTitle}
          </span>
          <Label on="light" size={10}>
            {feature.cardCaption}
          </Label>
        </div>
        <Face feature={feature} />
      </div>
    </div>
  );
}
