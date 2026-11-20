import React from "react";
import { t } from "@sendtally/features/i18n";
import { holdRowVM, type Hold } from "@sendtally/features/workouts";
import { Button } from "../components/Button";
import { ClockRow } from "./ClockRow";

export type HoldRowProps = {
  hold: Hold;
  now: number;
  /** What sits first, as the set table's set number. */
  lead?: React.ReactNode;
  onPause: () => void;
  onResume: () => void;
  onDone: () => void;
};

/**
 * A timed set running where it sits, the rest row's twin: a green fill grows toward the target
 * as it counts up, after a count-in, and Done ends it early.
 */
export function HoldRow({
  hold,
  now,
  lead,
  onPause,
  onResume,
  onDone,
}: HoldRowProps): React.ReactElement {
  const vm = holdRowVM(hold, now);
  return (
    <ClockRow
      share={vm.share}
      accessibilityLabel={vm.label}
      lead={lead}
      word={vm.word}
      clock={vm.clock}
      of={vm.of}
    >
      <Button
        label={vm.paused ? t("hang.resume") : t("hang.pause")}
        onPress={vm.paused ? onResume : onPause}
        variant="link"
        height={40}
      />
      <Button label={t("common.done")} onPress={onDone} variant="link" height={40} />
    </ClockRow>
  );
}
