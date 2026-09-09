import React from "react";
import { Label } from "@sendtally/design";
import { COPY } from "../copy";
import { AccountCta } from "./AccountCta";
import { SessionPreviewCard } from "./SessionPreviewCard";

export function StravaSection(): React.ReactElement {
  return (
    <div id="strava" className="l-strava">
      <div className="l-strava-inner">
        <div
          style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 20 }}
        >
          <Label on="dark" style={{ letterSpacing: "0.1em" }}>
            {COPY.strava.eyebrow}
          </Label>
          <h2
            className="l-section-title"
            style={{ color: "var(--text-on-dark)", textWrap: "balance" }}
          >
            {COPY.strava.title}
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
            {COPY.strava.body}
          </p>
          <AccountCta variant="azure" label={COPY.strava.cta} />
        </div>
        <SessionPreviewCard />
      </div>
    </div>
  );
}
