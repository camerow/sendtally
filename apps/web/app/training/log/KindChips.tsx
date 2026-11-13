import React from "react";
import type { ActivityKind } from "@sendtally/api-client";
import { ACTIVITY_KINDS, kindLabel } from "@sendtally/features/activities";
import { activityColor } from "@sendtally/features/training";
import { t } from "@sendtally/features/i18n";
import { chipStyle } from "../../components/chip";

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
          style={chipStyle(kind === value, {
            display: "inline-flex",
            alignItems: "center",
            gap: 7,
            height: 44,
            padding: "0 14px",
            borderRadius: 22,
            fontFamily: "var(--font-sans)",
            fontSize: 14,
            letterSpacing: 0,
            textTransform: "none",
            ...(kind === value && {
              background: "var(--bs-gunmetal)",
              borderColor: "var(--bs-gunmetal)",
              color: "var(--bs-white)",
              fontWeight: 600,
            }),
          })}
          onClick={() => onChange(kind)}
        >
          <span
            style={{
              width: 10,
              height: 10,
              boxSizing: "border-box",
              borderRadius: 3,
              background: activityColor(kind),
              ...(kind === value && { border: "1.5px solid var(--bs-white)" }),
            }}
          />
          {kindLabel(kind)}
        </button>
      ))}
    </div>
  );
}
