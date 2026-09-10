import React from "react";
import { Button, Label } from "@sendtally/design";
import { COPY } from "../copy";
import { useLanding } from "../LandingContext";
import { AccountCta } from "./AccountCta";
import { AppStores } from "./AppStores";
import { LANDING_PHOTOS } from "../photos";
import { Photo } from "./Photo";
import { TrendsPreviewCard } from "./TrendsPreviewCard";

export function Hero(): React.ReactElement {
  const { signedIn } = useLanding();
  return (
    <div className="l-hero">
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 26 }}>
        <div className="l-rise" style={{ animationDelay: "60ms" }}>
          <Label on="accent" style={{ letterSpacing: "0.1em" }}>
            {COPY.hero.eyebrow}
          </Label>
        </div>
        <h1 className="l-hero-title l-rise" style={{ animationDelay: "140ms" }}>
          {COPY.hero.title}
        </h1>
        <p
          className="l-rise"
          style={{
            animationDelay: "220ms",
            margin: 0,
            fontSize: 18,
            lineHeight: 1.55,
            color: "var(--text-on-white-secondary)",
            maxWidth: 470,
            textWrap: "pretty",
          }}
        >
          {COPY.hero.body}
        </p>
        <div
          className="l-rise"
          style={{
            animationDelay: "300ms",
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: 12,
          }}
        >
          <AccountCta label={COPY.hero.cta} />
          {!signedIn && (
            <Button variant="ghostOnLight" href="/sign-in">
              {COPY.hero.signIn}
            </Button>
          )}
        </div>
        <div className="l-rise" style={{ animationDelay: "340ms" }}>
          <AppStores prominent />
        </div>
        <div className="l-free-pills l-rise" style={{ animationDelay: "420ms" }}>
          {COPY.hero.pills.map((pill) => (
            <span key={pill} className="l-free-pill">
              {pill}
            </span>
          ))}
        </div>
      </div>
      <div className="l-hero-visual">
        <Photo photo={LANDING_PHOTOS.hero} className="l-hero-photo l-rise" priority />
        <div className="l-hero-card-slot l-rise" style={{ animationDelay: "260ms" }}>
          <TrendsPreviewCard />
        </div>
      </div>
    </div>
  );
}
