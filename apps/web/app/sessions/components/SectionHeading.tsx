import React from "react";
import { sectionAnchorId } from "../anchors";

export function SectionHeading({
  sectionKey,
  title,
  year,
  meta,
  top = false,
}: {
  sectionKey: string;
  title: string;
  year: number | null;
  meta: string;
  top?: boolean;
}): React.ReactElement {
  return (
    <h3
      id={sectionAnchorId(sectionKey)}
      className={top ? "sessions-month sessions-month--top" : "sessions-month"}
    >
      <span className="sessions-heading-title">
        {title}
        {year !== null && <span className="sessions-heading-year"> {year}</span>}
      </span>
      <span className="sessions-heading-meta">
        {year !== null && <span className="sessions-heading-meta-year">{year} · </span>}
        {meta}
      </span>
    </h3>
  );
}
