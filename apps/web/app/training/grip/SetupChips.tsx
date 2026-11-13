import React from "react";
import { sameSetup, type GripSetup } from "@sendtally/core/hang";
import { gripSetupLabel } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";
import { chipStyle } from "../../components/chip";

export type SetupChipsProps = {
  setups: readonly GripSetup[];
  /** Null for All, when offered. */
  picked: GripSetup | null;
  onPick: (setup: GripSetup | null) => void;
  withAll: boolean;
};

const look = (active: boolean): React.CSSProperties =>
  chipStyle(active, {
    textTransform: "none",
    fontSize: 12,
    letterSpacing: 0,
    minHeight: 40,
    flex: "none",
  });

/** One chip per setup, the most used first, then All when offered. */
export function SetupChips({
  setups,
  picked,
  onPick,
  withAll,
}: SetupChipsProps): React.ReactElement {
  return (
    <div className="setup-chips">
      {setups.map((s) => {
        const active = picked !== null && sameSetup(s, picked);
        return (
          <button
            key={`${s.edgeMm}:${s.hangS}`}
            type="button"
            aria-pressed={active}
            style={look(active)}
            onClick={() => onPick(s)}
          >
            {gripSetupLabel(s)}
          </button>
        );
      })}
      {withAll && (
        <button
          type="button"
          aria-pressed={picked === null}
          style={look(picked === null)}
          onClick={() => onPick(null)}
        >
          {t("hang.allSetups")}
        </button>
      )}
    </div>
  );
}
