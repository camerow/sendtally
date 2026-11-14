import React from "react";

/** The id a month's header carries, so the scope bar can jump to it. */
export const sectionId = (key: string): string => `log-section-${key}`;

/** A month of the log: its name and what it holds, stuck to the top while its rows scroll. */
export function SectionHeader({
  title,
  meta,
  sectionKey,
}: {
  title: string;
  meta: string;
  sectionKey?: string;
}): React.ReactElement {
  return (
    <h2
      className="log-section-header"
      id={sectionKey === undefined ? undefined : sectionId(sectionKey)}
      data-section={sectionKey}
    >
      <span className="log-section-title">{title}</span>
      <span className="log-section-meta">{meta}</span>
    </h2>
  );
}
