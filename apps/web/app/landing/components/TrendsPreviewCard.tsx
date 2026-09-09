import React from "react";
import { Label } from "@sendtally/design";
import { COPY } from "../copy";
import { prefersReducedMotion } from "../useInView";
import { HERO_RANGES } from "./heroRanges";
import { MiniBars } from "./MiniBars";
import { RangeChips } from "./RangeChips";
import { StatGrid } from "./StatGrid";

const CYCLE_MS = 3200;
const FADE_MS = 240;

export function TrendsPreviewCard(): React.ReactElement {
  const [index, setIndex] = React.useState(0);
  const [cycled, setCycled] = React.useState(false);
  const [swapping, setSwapping] = React.useState(false);

  React.useEffect(() => {
    if (prefersReducedMotion()) return;
    let fade: ReturnType<typeof setTimeout> | undefined;
    const tick = setInterval(() => {
      setSwapping(true);
      fade = setTimeout(() => {
        setIndex((i) => (i + 1) % HERO_RANGES.length);
        setCycled(true);
        setSwapping(false);
      }, FADE_MS);
    }, CYCLE_MS);
    return () => {
      clearInterval(tick);
      if (fade !== undefined) clearTimeout(fade);
    };
  }, []);

  const range = HERO_RANGES[index] ?? HERO_RANGES[0]!;

  return (
    <div className={swapping ? "l-hero-card l-hero-card--swap" : "l-hero-card"}>
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
          {COPY.hero.card.title}
        </span>
        <span className="l-hero-card-fade">
          <Label on="light" size={10}>
            {range.caption}
          </Label>
        </span>
      </div>

      <RangeChips active={range.chip} size="sm" />

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <Label on="accent">{COPY.hero.card.chartLabel}</Label>
        <MiniBars key={range.key} bars={range.bars} height={78} grow={cycled ? "mount" : "off"} />
      </div>

      <div className="l-hero-card-fade">
        <StatGrid tone="white" items={range.stats} />
      </div>
    </div>
  );
}
