import React from "react";
import { Icon } from "../../../components/Icon";

/** A card's bottom row: a line of mono text that opens more, with a chevron. */
export function CardRow({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}): React.ReactElement {
  return (
    <button type="button" className="workload-row" onClick={onClick}>
      <span className="workload-mono">{children}</span>
      <Icon name="chevron" size={16} />
    </button>
  );
}
