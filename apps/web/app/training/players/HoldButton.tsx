import React from "react";
import { t } from "@sendtally/features/i18n";
import { elapsedClock } from "@sendtally/features/sessions";
import { Icon } from "../../components/Icon";

export type HoldButtonProps = { name: string; targetS: number; onPress: () => void };

/** ▶ and the target: runs a timed set or line in its own row. */
export function HoldButton({ name, targetS, onPress }: HoldButtonProps): React.ReactElement {
  const time = elapsedClock(targetS);
  return (
    <button
      type="button"
      className="hold-button"
      aria-label={t("activities.holdStart", { name, time })}
      onClick={onPress}
    >
      <Icon name="play" size={14} strokeWidth={2.2} />
      {time}
    </button>
  );
}
