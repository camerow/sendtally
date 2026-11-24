import React from "react";
import { colors } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import { IconButton } from "../components/IconButton";
import { useTimerSounds } from "../timer/useTimerSounds";

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
  const play = useTimerSounds();
  const was = React.useRef({ running, left });
  React.useEffect(() => {
    const before = was.current;
    was.current = { running, left };
    if (running && !before.running) play("work");
    else if (before.running && before.left > 0 && left === 0) play("finish");
    else if (before.running && !running && before.left > 0) play("rest");
  }, [running, left, play]);
  const action = running ? t("hang.pause") : t("hang.start");
  return (
    <IconButton
      icon={running ? "pause" : "play"}
      label={label === undefined ? action : `${label}, ${action}`}
      onPress={onToggle}
      color={colors.gunmetal}
      size={40}
      iconSize={18}
      disabled={left === 0}
    />
  );
}
