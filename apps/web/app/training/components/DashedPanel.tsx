import React from "react";

export type DashedPanelProps = { title?: string; body: string };

/** An empty state: a dashed outline around a line or two, under an optional label. */
export function DashedPanel({ title, body }: DashedPanelProps): React.ReactElement {
  return (
    <div className="dashed-panel">
      {title !== undefined && <span className="train-label dashed-panel-title">{title}</span>}
      <p className="dashed-panel-body">{body}</p>
    </div>
  );
}
