import React from "react";
import { Label } from "@sendtally/design";
import type { FeatureCopy } from "../copy";
import { PhotoBackdrop } from "./PhotoBackdrop";
import { Reveal } from "./Reveal";
import { Shot } from "./Shot";

export type FeatureSectionProps = {
  feature: FeatureCopy;
  flip: boolean;
};

/** One feature: copy on one side, two phone captures on the other, on white, soft or a photo. */
export function FeatureSection({ feature, flip }: FeatureSectionProps): React.ReactElement {
  const tone = feature.photo === undefined ? (flip ? "soft" : "white") : "photo";
  return (
    <section
      id={feature.id}
      className={["l-feature", `l-feature--${tone}`, flip ? "l-feature--flip" : ""]
        .filter(Boolean)
        .join(" ")}
    >
      {feature.photo !== undefined && (
        <PhotoBackdrop
          photo={feature.photo.key}
          alt={feature.photo.alt}
          scrim={flip ? "right" : "left"}
        />
      )}
      <Reveal className="l-feature-copy">
        <Label on={tone === "photo" ? "dark" : "accent"}>{feature.eyebrow}</Label>
        <h2 className="l-feature-title">{feature.title}</h2>
        <p className="l-feature-body">{feature.body}</p>
        {feature.points.length > 0 && (
          <ul className="l-points">
            {feature.points.map((point) => (
              <li key={point}>
                <span className="l-tick" aria-hidden="true" />
                {point}
              </li>
            ))}
          </ul>
        )}
      </Reveal>
      <Reveal delay={120} className="l-feature-media">
        <Shot media={feature.media[0]} />
        <Shot media={feature.media[1]} className="l-shot--low" />
      </Reveal>
    </section>
  );
}
