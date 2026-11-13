import React from "react";
import { CIRCUIT_HEX } from "@sendtally/features/gyms";
import { t } from "@sendtally/features/i18n";
import type { ClimbDraft } from "@sendtally/features/log-session";
import { Icon } from "../../components/Icon";

/** One climb: hollow dots for its falls, a tick once sent. The selected one is what Fell and Sent act on. */
export function TallyRow({
  climb,
  selected,
  onPress,
  onEdit,
}: {
  climb: ClimbDraft;
  selected: boolean;
  onPress: () => void;
  onEdit: () => void;
}): React.ReactElement {
  const sent = climb.kind === "send";
  const falls = Math.max(0, climb.tries - (sent ? 1 : 0));
  const grade = climb.circuit === undefined ? climb.grade : climb.circuit.label;
  const name = climb.name.trim();
  return (
    <div className={selected ? "tally-row tally-row--selected" : "tally-row"}>
      <button
        type="button"
        className="tally-row-main"
        aria-pressed={selected}
        aria-label={[
          grade,
          ...(name === "" ? [] : [name]),
          t("tally.fallCount", { count: falls }),
          ...(sent ? [t("common.sent")] : []),
        ].join(", ")}
        onClick={onPress}
      >
        <span
          className="tally-grade"
          style={
            climb.circuit === undefined
              ? undefined
              : { background: CIRCUIT_HEX[climb.circuit.colour] }
          }
        >
          {climb.circuit === undefined ? climb.grade : ""}
        </span>
        <span className="tally-marks">
          {name !== "" && <span className="tally-name">{name}</span>}
          {Array.from({ length: falls }, (_, i) => (
            <span key={i} className="tally-fall" />
          ))}
          {sent && (
            <span className="tally-sent">
              <Icon name="check" size={20} strokeWidth={3} />
            </span>
          )}
        </span>
      </button>
      {selected && (
        <button
          type="button"
          className="tally-edit"
          aria-label={t("tally.editClimb")}
          onClick={onEdit}
        >
          <Icon name="pencil" size={18} strokeWidth={1.9} />
        </button>
      )}
    </div>
  );
}
