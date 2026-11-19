import React from "react";
import { colors } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import { elapsedClock } from "@sendtally/features/sessions";
import { IconButton } from "../components/IconButton";
import { ClockRow } from "../hold/ClockRow";
import { useTimerSounds } from "../timer/useTimerSounds";

export type WallClockProps = {
  /** The set's time on the wall. */
  targetS: number;
  left: number;
  running: boolean;
  onToggle: () => void;
};

/**
 * A timed climbing set's clock, under its climbs: only its own button starts and pauses it, with
 * a tone on start, on stop and on reaching its time.
 */
export function WallClock({
  targetS,
  left,
  running,
  onToggle,
}: WallClockProps): React.ReactElement {
  const play = useTimerSounds();
  const was = React.useRef({ running, left });
  React.useEffect(() => {
    const before = was.current;
    was.current = { running, left };
    if (running && !before.running) play("work");
    else if (before.running && before.left > 0 && left === 0) play("finish");
    else if (before.running && !running && before.left > 0) play("rest");
  }, [running, left, play]);
  const clock = elapsedClock(targetS - left);
  const of = t("activities.holdOf", { time: elapsedClock(targetS) });
  const word = t("tally.onTheWall");
  return (
    <ClockRow
      share={targetS > 0 ? (targetS - left) / targetS : 0}
      accessibilityLabel={`${word} ${clock} ${of}`}
      word={word}
      clock={clock}
      of={of}
    >
      <IconButton
        icon={running ? "pause" : "play"}
        label={running ? t("hang.pause") : t("hang.start")}
        onPress={onToggle}
        color={colors.gunmetal}
        size={40}
        iconSize={18}
        disabled={left === 0}
      />
    </ClockRow>
  );
}
