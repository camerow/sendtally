import React from "react";
import { Icon, type IconName } from "./Icon";

/** A filter chip, gold when on, as mobile's. */
export function FilterChip({
  label,
  active,
  icon,
  leading,
  upper = false,
  onPress,
}: {
  label: string;
  active: boolean;
  icon?: IconName;
  leading?: React.ReactNode;
  upper?: boolean;
  onPress: () => void;
}): React.ReactElement {
  return (
    <button
      type="button"
      className={upper ? "chip chip--upper" : "chip"}
      aria-pressed={active}
      onClick={onPress}
    >
      {leading}
      {icon !== undefined && <Icon name={icon} size={14} strokeWidth={2} />}
      {label}
    </button>
  );
}
