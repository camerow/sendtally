import React from "react";
import { Label } from "@sendtally/design";
import { useLanding } from "../LandingContext";

export function PricingHeader(): React.ReactElement {
  const { copy } = useLanding();
  return (
    <header id="top" className="l-pricing-head">
      <Label on="accent">{copy.pricing.eyebrow}</Label>
      <h1 className="l-pricing-title">{copy.pricing.title}</h1>
      <p className="l-pricing-body">{copy.pricing.body}</p>
    </header>
  );
}
