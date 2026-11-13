import React from "react";
import { KIND_LOOK } from "@sendtally/features/training";
import { CategoryMark } from "../../training/components/CategoryMark";

export type ClimbingHeroProps = {
  /** The kicker beside the climbing mark; none leaves the title to lead. */
  kind?: string;
  title: string;
  /** Above the title, as a climb's Project pill. */
  kicker?: React.ReactNode;
  /** Where it was, between the title and the meta line. */
  place?: string;
  meta: string;
};

/** A climbing detail page's top: the climbing mark and kicker or a status, the title, where, and a meta line. */
export function ClimbingHero({
  kind,
  title,
  kicker,
  place = "",
  meta,
}: ClimbingHeroProps): React.ReactElement {
  return (
    <div className="climbing-hero">
      {kind !== undefined && (
        <span className="climbing-hero-kind" style={{ color: KIND_LOOK.climbing.ink }}>
          <CategoryMark kind="climbing" size={28} />
          {kind}
        </span>
      )}
      {kicker}
      <h1 className="climbing-hero-title">{title}</h1>
      {place !== "" && <span className="climbing-hero-place">{place}</span>}
      <span className="climbing-hero-meta">{meta}</span>
    </div>
  );
}
