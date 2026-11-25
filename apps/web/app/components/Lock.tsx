import React from "react";
import { Icon } from "./Icon";

/** Marks what needs a membership: the lock in muted ink, where the thing's trailing control was. */
export function Lock({ size = 16 }: { size?: number }): React.ReactElement {
  return (
    <span className="lock">
      <Icon name="lock" size={size} strokeWidth={2.4} />
    </span>
  );
}
