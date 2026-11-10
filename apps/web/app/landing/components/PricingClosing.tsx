import React from "react";
import { useLanding } from "../LandingContext";
import { AppStores } from "./AppStores";
import { PhotoBackdrop } from "./PhotoBackdrop";
import { WebAccountLink } from "./WebAccountLink";

export function PricingClosing(): React.ReactElement {
  const { copy } = useLanding();
  return (
    <section id="start" className="l-closing">
      <PhotoBackdrop
        photo="sandstoneWall"
        alt={copy.hero.photoAlt}
        position="68% 45%"
        scrim="even"
      />
      <div className="l-closing-inner">
        <h2 className="l-closing-title">{copy.pricing.closing.title}</h2>
        <AppStores prominent />
        <WebAccountLink label={copy.pricing.closing.webAccount} tone="dark" />
      </div>
    </section>
  );
}
