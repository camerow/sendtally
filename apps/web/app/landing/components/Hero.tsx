import React from "react";
import { useLanding } from "../LandingContext";
import { Label } from "@sendtally/design";
import { AppStores } from "./AppStores";
import { LANDING_PHOTOS } from "../photos";
import { Photo } from "./Photo";
import { HeroFeatureCard } from "./HeroFeatureCard";
import { RotatingWord } from "./RotatingWord";
import { useRotation } from "../useRotation";

const ROTATION_MS = 3200;

export function Hero(): React.ReactElement {
  const { copy } = useLanding();
  const index = useRotation(copy.hero.features.length, ROTATION_MS);
  return (
    <div className="l-hero">
      <Photo photo={LANDING_PHOTOS.hero} className="l-hero-bg" priority />
      <div className="l-hero-scrim" />
      <div className="l-hero-inner">
        <div
          style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 26 }}
        >
          <h1 className="l-hero-title l-rise" style={{ animationDelay: "60ms" }}>
            {copy.hero.title}
          </h1>
          <div className="l-rise" style={{ animationDelay: "140ms" }}>
            <Label on="dark" style={{ letterSpacing: "0.1em" }}>
              <RotatingWord
                words={copy.hero.features.map((f) => f.eyebrow)}
                index={index}
                className="l-eyebrow-slot"
              />
            </Label>
          </div>
          <p
            className="l-rise"
            style={{
              animationDelay: "220ms",
              margin: 0,
              fontSize: 18,
              lineHeight: 1.55,
              color: "var(--text-on-dark-secondary)",
              maxWidth: 470,
              textWrap: "pretty",
            }}
          >
            {copy.hero.body}
          </p>
          <div className="l-rise" style={{ animationDelay: "340ms" }}>
            <AppStores prominent />
          </div>
        </div>
        <div className="l-hero-card-slot l-rise" style={{ animationDelay: "260ms" }}>
          <HeroFeatureCard index={index} />
        </div>
      </div>
    </div>
  );
}
