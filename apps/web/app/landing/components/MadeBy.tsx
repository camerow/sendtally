import React from "react";
import { Label } from "@sendtally/design";
import { useLanding } from "../LandingContext";
import { PHOTOS } from "../media";
import { Reveal } from "./Reveal";

export function MadeBy(): React.ReactElement {
  const { copy } = useLanding();
  return (
    <section id="made" className="l-made">
      <img
        className="l-made-photo"
        src={PHOTOS.willCameron}
        alt={copy.made.photoAlt}
        loading="lazy"
        decoding="async"
      />
      <Reveal className="l-made-copy">
        <Label on="dark">{copy.made.eyebrow}</Label>
        <h2 className="l-made-title">{copy.made.title}</h2>
        {copy.made.paragraphs.map((p) => (
          <p key={p} className="l-made-body">
            {p}
          </p>
        ))}
        <a href="/support" className="l-textlink l-textlink--gold">
          {copy.made.link}
        </a>
      </Reveal>
    </section>
  );
}
