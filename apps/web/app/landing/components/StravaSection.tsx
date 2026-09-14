import React from "react";
import { useLanding } from "../LandingContext";
import { Label } from "@sendtally/design";
import { AccountCta } from "./AccountCta";
import { SessionPreviewCard } from "./SessionPreviewCard";

export function StravaSection(): React.ReactElement {
  const { copy } = useLanding();
  return (
    <div id="strava" className="l-strava">
      <div className="l-strava-inner">
        <div
          style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 20 }}
        >
          <Label on="dark" style={{ letterSpacing: "0.1em" }}>
            {copy.strava.eyebrow}
          </Label>
          <h2
            className="l-section-title"
            style={{ color: "var(--text-on-dark)", textWrap: "balance" }}
          >
            {copy.strava.title}
          </h2>
          <p
            style={{
              margin: 0,
              fontSize: 17,
              lineHeight: 1.55,
              color: "var(--text-on-dark-secondary)",
              maxWidth: 470,
              textWrap: "pretty",
            }}
          >
            {copy.strava.body}
          </p>
          <AccountCta variant="azure" label={copy.strava.cta} />
        </div>
        <SessionPreviewCard />
      </div>
    </div>
  );
}
