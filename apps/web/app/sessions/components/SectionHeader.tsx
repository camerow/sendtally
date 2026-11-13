import React from "react";

/** A month of the log: its name and what it holds, stuck to the top while its rows scroll. */
export function SectionHeader({
  title,
  meta,
}: {
  title: string;
  meta: string;
}): React.ReactElement {
  return (
    <h2 className="log-section-header">
      <span className="log-section-title">{title}</span>
      <span className="log-section-meta">{meta}</span>
    </h2>
  );
}
