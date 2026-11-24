import React from "react";
import { t } from "@sendtally/features/i18n";
import { Icon } from "../../components/Icon";
import { playTone } from "../../lib/tones";

export type ClockToggleProps = {
  /** Seconds left before the clock reaches its time. */
  left: number;
  running: boolean;
  onToggle: () => void;
  /** What the clock is for, ahead of Start or Pause, where more than one shows. */
  label?: string | undefined;
};

/** A climbing clock's start and pause, with a tone on start, on stop and on reaching its time. */
export function ClockToggle({
  left,
  running,
  onToggle,
  label,
}: ClockToggleProps): React.ReactElement {
  const was = React.useRef({ running, left });
  React.useEffect(() => {
    const before = was.current;
    was.current = { running, left };
    if (running && !before.running) playTone("work");
    else if (before.running && before.left > 0 && left === 0) playTone("finish");
    else if (before.running && !running && before.left > 0) playTone("rest");
  }, [running, left]);
  const action = running ? t("hang.pause") : t("hang.start");
  return (
    <button
      type="button"
      className="clock-toggle"
      aria-label={label === undefined ? action : `${label}, ${action}`}
      disabled={left === 0}
      onClick={onToggle}
    >
      <Icon name={running ? "pause" : "play"} size={18} strokeWidth={2.4} />
    </button>
  );
}
