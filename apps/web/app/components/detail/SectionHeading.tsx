import React from "react";
import { Icon } from "../Icon";

/** A detail page section's heading: its label, and a round + when something can be added. */
export function SectionHeading({
  title,
  add,
}: {
  title: string;
  add?: { label: string; onPress: () => void } | undefined;
}): React.ReactElement {
  return (
    <div className="detail-heading">
      <h2 className="detail-label">{title}</h2>
      {add !== undefined && (
        <button type="button" className="detail-add" aria-label={add.label} onClick={add.onPress}>
          <Icon name="plus" size={18} strokeWidth={2.5} />
        </button>
      )}
    </div>
  );
}
