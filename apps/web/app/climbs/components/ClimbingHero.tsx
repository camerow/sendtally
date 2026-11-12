import React from "react";

export type ClimbingHeroProps = {
  title: string;
  /** Above the title, as a climb's Project pill. */
  kicker?: React.ReactNode;
  meta: string;
};

/** A climbing detail page's top: a status above the title, and a meta line. */
export function ClimbingHero({ title, kicker, meta }: ClimbingHeroProps): React.ReactElement {
  return (
    <div className="climbing-hero">
      {kicker}
      <h1 className="climbing-hero-title">{title}</h1>
      <span className="climbing-hero-meta">{meta}</span>
    </div>
  );
}
