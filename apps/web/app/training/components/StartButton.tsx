import React from "react";
import { Icon } from "../../components/Icon";
import type { StartAction } from "../library-detail/useWorkoutStart";

/** ▶ Start or Resume, in the page's primary blue. */
export function StartButton({
  start,
  className = "detail-primary start-button",
}: {
  start: StartAction;
  className?: string;
}): React.ReactElement {
  return (
    <button type="button" className={className} onClick={start.onPress}>
      <Icon name="play" size={16} strokeWidth={2.2} />
      {start.label}
    </button>
  );
}
