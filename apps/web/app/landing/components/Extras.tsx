import React from "react";
import { Label } from "@sendtally/design";
import { useLanding } from "../LandingContext";
import { Reveal } from "./Reveal";

export function Extras(): React.ReactElement {
  const { copy } = useLanding();
  return (
    <section className="l-extras">
      {copy.extras.map((card, i) => (
        <Reveal key={card.eyebrow} delay={i * 80} className="l-extra">
          <Label on="accent">{card.eyebrow}</Label>
          <span className="l-extra-title">{card.title}</span>
          <span className="l-extra-body">{card.body}</span>
        </Reveal>
      ))}
    </section>
  );
}
