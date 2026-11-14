import React from "react";
import type { ActivityKind } from "@sendtally/api-client";
import { ACTIVITY_KINDS, kindLabel } from "@sendtally/features/activities";
import { activityColor } from "@sendtally/features/training";
import { t } from "@sendtally/features/i18n";

export type KindChipsProps = { value: ActivityKind; onChange: (kind: ActivityKind) => void };

/** One chip per kind, each with the mark it wears in the statistics. Climbing is logged as a session. */
export function KindChips({ value, onChange }: KindChipsProps): React.ReactElement {
  return (
    <div role="radiogroup" aria-label={t("activities.kind")} className="kind-chips">
      {ACTIVITY_KINDS.filter((k) => k !== "climbing").map((kind) => (
        <button
          key={kind}
          type="button"
          role="radio"
          aria-checked={kind === value}
          className="kind-chip"
          onClick={() => onChange(kind)}
        >
          <span className="kind-chip-mark" style={{ background: activityColor(kind) }} />
          {kindLabel(kind)}
        </button>
      ))}
    </div>
  );
}
