import React from "react";
import type { Focus } from "@sendtally/core/hang";
import { colors } from "@sendtally/design/tokens";
import { focusLabel } from "@sendtally/features/training";
import { KindTag } from "./KindTag";

export type FocusTagProps = { focus: Focus | null; small?: boolean };

/** What a workout, block or session trains for, General for none. Focus wears no colour. */
export function FocusTag({ focus, small }: FocusTagProps): React.ReactElement {
  return (
    <KindTag
      label={focusLabel(focus)}
      color={colors.gunmetal}
      background={colors.surfaceSoft}
      small={small}
    />
  );
}
