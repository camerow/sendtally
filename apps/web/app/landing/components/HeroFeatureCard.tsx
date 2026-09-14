import React from "react";
import type { HeroFacesCopy, HeroFeatureCopy } from "../copy";
import { useLanding } from "../LandingContext";
import { Badge, GradeBars, Label } from "@sendtally/design";
import { heroFaces, type HeroFaces } from "./heroFaces";
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

function Face({
  feature,
  faces,
  copy,
}: {
  feature: HeroFeatureCopy;
  faces: HeroFaces;
  copy: HeroFacesCopy;
}): React.ReactElement {
  if (feature.key === "tags") {
    return (
      <>
        <div className="l-hero-tags">
          {faces.tags.map((tag) => (
            <span key={tag} className="l-free-pill">
              {tag}
            </span>
          ))}
        </div>
        <Chart label={feature.chartLabel}>
          <MiniBars bars={faces.tagBars} height={64} grow="mount" />
        </Chart>
        <StatGrid tone="white" items={faces.tagStats} />
      </>
    );
  }
  if (feature.key === "effort") {
    return (
      <>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
          <span className="l-hero-figure">7.4</span>
          <Label on="light" size={10}>
            {copy.rpeLastSession}
          </Label>
        </div>
        <Chart label={feature.chartLabel}>
          <MiniBars bars={faces.effortBars} height={64} grow="mount" />
        </Chart>
        <StatGrid tone="white" items={faces.effortStats} />
      </>
    );
  }
  if (feature.key === "pyramid") {
    return (
      <>
        <Chart label={feature.chartLabel}>
          <GradeBars bars={faces.pyramidBars} height={104} />
        </Chart>
        <StatGrid tone="white" items={faces.pyramidStats} />
      </>
    );
  }
  if (feature.key === "projects") {
    return (
      <>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {faces.projects.map((project) => (
            <div key={project.name} className="l-hero-project">
              <span style={{ fontWeight: 600, fontSize: 14 }}>{project.name}</span>
              <Badge tone={project.sent ? "petal" : "azure"} pill={false}>
                {project.grade}
              </Badge>
              <span className="l-hero-project-meta">
                {copy.projectMeta
                  .replace("{sessions}", String(project.sessions))
                  .replace("{attempts}", String(project.attempts))}
              </span>
            </div>
          ))}
        </div>
        <StatGrid tone="white" items={faces.projectStats} />
      </>
    );
  }
  if (feature.key === "strava") {
    return (
      <>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Badge tone="azure" pill={false}>
            {copy.via}
          </Badge>
          <Label on="light" size={10}>
            {copy.rockClimbing}
          </Label>
        </div>
        <div style={{ fontWeight: 600, fontSize: 17, letterSpacing: "-0.01em" }}>
          {copy.stravaTitle}
        </div>
        <Chart label={feature.chartLabel}>
          <GradeBars bars={faces.stravaBars} height={82} />
        </Chart>
        <StatGrid tone="white" items={faces.stravaStats} />
      </>
    );
  }
  return (
    <>
      <RangeChips active="3M" size="sm" />
      <Chart label={feature.chartLabel}>
        <MiniBars bars={faces.trendBars} height={78} grow="mount" />
      </Chart>
      <StatGrid tone="white" items={faces.trendStats} />
    </>
  );
}

export function HeroFeatureCard({ index }: { index: number }): React.ReactElement {
  const { copy } = useLanding();
  const faces = heroFaces(copy);
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
        <Face feature={feature} faces={faces} copy={copy.hero.faces} />
      </div>
    </div>
  );
}
