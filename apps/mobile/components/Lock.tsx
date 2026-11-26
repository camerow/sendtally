import React from "react";
import { colors } from "@sendtally/design/tokens";
import { Icon } from "./Icon";

/** Marks what needs a membership: the lock in muted ink, where the thing's trailing control was. */
export function Lock(): React.ReactElement {
  return <Icon name="lock" color={colors.textMuted} size={16} strokeWidth={2.4} />;
}
