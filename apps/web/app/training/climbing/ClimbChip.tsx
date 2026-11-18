import React from "react";
import { CIRCUIT_HEX } from "@sendtally/features/gyms";
import { t } from "@sendtally/features/i18n";
import type { ClimbDraft } from "@sendtally/features/log-session";
import { Icon } from "../../components/Icon";

/** One climb of a set: grey with a tick once sent, outlined as an attempt. A click flips it, a double click edits it. */
export function ClimbChip({
  climb,
  onFlip,
  onEdit,
}: {
  climb: ClimbDraft;
  onFlip: () => void;
  onEdit: () => void;
}): React.ReactElement {
  const sent = climb.kind === "send";
  const label = climb.circuit?.label ?? climb.grade;
  return (
    <button
      type="button"
      className={sent ? "climb-chip climb-chip--sent" : "climb-chip"}
      aria-label={`${label}, ${sent ? t("logSession.sentTapToAttempt") : t("logSession.attemptTapToSent")}`}
      title={t("tally.editClimb")}
      onClick={onFlip}
      onDoubleClick={onEdit}
      onContextMenu={(e) => {
        e.preventDefault();
        onEdit();
      }}
    >
      {climb.circuit !== undefined && (
        <span
          className="climb-chip-dot"
          style={{ background: CIRCUIT_HEX[climb.circuit.colour] }}
        />
      )}
      {label}
      {sent && <Icon name="check" size={12} strokeWidth={3} />}
    </button>
  );
}
