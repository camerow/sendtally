import React from "react";
import { Icon, type IconName } from "./Icon";

/** A filter chip, gold when on, as mobile's. */
export function FilterChip({
  label,
  active,
  icon,
  onPress,
}: {
  label: string;
  active: boolean;
  icon?: IconName;
  onPress: () => void;
}): React.ReactElement {
  return (
    <button type="button" className="chip" aria-pressed={active} onClick={onPress}>
      {icon !== undefined && <Icon name={icon} size={14} strokeWidth={2} />}
      {label}
    </button>
  );
}
