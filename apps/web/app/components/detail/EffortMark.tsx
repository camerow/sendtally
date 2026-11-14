import React from "react";
import { effortColor } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";

/** A logged session's effort in a list: a dot in its effort colour and the RPE beside it. */
export function EffortMark({ rpe }: { rpe: number }): React.ReactElement {
  return (
    <span className="effort-mark">
      <span className="effort-mark-dot" style={{ background: effortColor(rpe) }} />
      {t("hang.rpeValue", { value: rpe })}
    </span>
  );
}
