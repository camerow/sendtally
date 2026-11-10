import React from "react";
import { Label } from "@sendtally/design";
import { useLanding } from "../LandingContext";
import { AppStores } from "./AppStores";
import { PhotoBackdrop } from "./PhotoBackdrop";
import { Shot } from "./Shot";
import { WebAccountLink } from "./WebAccountLink";

export function Hero(): React.ReactElement {
  const { copy } = useLanding();
  return (
    <header id="top" className="l-hero">
      <PhotoBackdrop
        photo="sandstoneWall"
        alt={copy.hero.photoAlt}
        position="68% 45%"
        scrim="left"
        priority
      />
      <div className="l-hero-inner">
        <div className="l-hero-copy">
          <span className="l-rise" style={{ animationDelay: "40ms" }}>
            <Label on="dark">{copy.hero.eyebrow}</Label>
          </span>
          <h1 className="l-hero-title l-rise" style={{ animationDelay: "100ms" }}>
            {copy.hero.title}
          </h1>
          <p className="l-hero-body l-rise" style={{ animationDelay: "180ms" }}>
            {copy.hero.body}
          </p>
          <div className="l-rise l-cta-stack" style={{ animationDelay: "260ms" }}>
            <AppStores prominent />
            <WebAccountLink label={copy.hero.webAccount} tone="dark" />
          </div>
        </div>
        <Shot media={copy.hero.phone} className="l-shot--hero l-rise" priority />
      </div>
    </header>
  );
}
