import React from "react";
import { Card, Label } from "@sendtally/design";
import { COPY } from "../copy";
import { INSIGHT_SERIES } from "./insightSeries";
import { MiniBars } from "./MiniBars";
import { RangeChips } from "./RangeChips";
import { Reveal } from "./Reveal";

function InsightCard({
  eyebrow,
  headline,
  meta,
  chart,
  body,
  wide = false,
  delay,
}: {
  eyebrow: string;
  headline: React.ReactNode;
  meta: string;
  chart: React.ReactNode;
  body: string;
  wide?: boolean;
  delay: number;
}): React.ReactElement {
  return (
    <Reveal delay={delay} className={wide ? "l-card-wide" : undefined}>
      <Card className="l-lift" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Label on="accent">{eyebrow}</Label>
          <span className="l-member-tag">{COPY.trends.memberTag}</span>
        </div>
        <span
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            fontSize: 30,
            letterSpacing: "-0.02em",
          }}
        >
          {headline}
        </span>
        <Label on="light" style={{ letterSpacing: "0.06em" }}>
          {meta}
        </Label>
        <div style={{ marginTop: 6 }}>{chart}</div>
        <span style={{ fontSize: 14, lineHeight: 1.55, color: "var(--text-on-white-secondary)" }}>
          {body}
        </span>
      </Card>
    </Reveal>
  );
}

export function Insights(): React.ReactElement {
  return (
    <div id="insights" className="l-insights">
      <div className="l-section-inner">
        <div className="l-section-header">
          <Reveal>
            <h2 className="l-section-title" style={{ maxWidth: 640, textWrap: "balance" }}>
              {COPY.trends.title}
            </h2>
          </Reveal>
          <Reveal delay={80}>
            <span className="l-section-blurb">{COPY.trends.blurb}</span>
          </Reveal>
        </div>

        <Reveal delay={80} className="l-rangebar">
          <Label on="dark">{COPY.trends.rangeLabel}</Label>
          <RangeChips active="3M" />
        </Reveal>

        <div className="l-card-grid">
          {INSIGHT_SERIES.map((s, i) => (
            <InsightCard
              key={s.metric}
              delay={(i % 3) * 80}
              wide={i === INSIGHT_SERIES.length - 1}
              eyebrow={s.eyebrow}
              headline={s.headline}
              meta={s.meta}
              chart={
                <MiniBars
                  bars={s.bars}
                  height={i === INSIGHT_SERIES.length - 1 ? 62 : 48}
                  gap={i === INSIGHT_SERIES.length - 1 ? 8 : s.metric === "volume" ? 4 : 6}
                  grow="in-view"
                />
              }
              body={s.body}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
