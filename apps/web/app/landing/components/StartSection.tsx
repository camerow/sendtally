import React from "react";
import { Label } from "@sendtally/design";
import { useLanding } from "../LandingContext";
import { AppStores } from "./AppStores";
import { WebAccountLink } from "./WebAccountLink";

export function StartSection(): React.ReactElement {
  const { copy } = useLanding();
  return (
    <section id="start" className="l-start">
      <Label on="light" style={{ color: "var(--text-on-light)" }}>
        {copy.start.eyebrow}
      </Label>
      <h2 className="l-start-title">{copy.start.title}</h2>
      <p className="l-start-body">{copy.start.body}</p>
      <AppStores prominent />
      <WebAccountLink label={copy.start.webAccount} />
      <a href="/pricing" className="l-textlink l-textlink--plain">
        {copy.start.pricing}
      </a>
    </section>
  );
}
