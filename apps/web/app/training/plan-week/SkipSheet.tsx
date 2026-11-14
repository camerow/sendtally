import React from "react";
import { SKIP_REASONS, type SkipReason } from "@sendtally/core/hang";
import { t } from "@sendtally/features/i18n";
import { plannedOn, type Occurrence } from "@sendtally/features/training";
import { Sheet } from "../../components/Sheet";
import { chipStyle } from "../../components/chip";
import { usePlanActions } from "../data/usePlanActions";

export type SkipSheetProps = { occurrence: Occurrence; name: string; onClose: () => void };

/** Skips one planned run, with why if the user says: it counts as neither done nor missed. */
export function SkipSheet({ occurrence: o, name, onClose }: SkipSheetProps): React.ReactElement {
  const actions = usePlanActions();
  const [reason, setReason] = React.useState<SkipReason | null>(null);
  const [note, setNote] = React.useState("");
  return (
    <Sheet
      open
      kicker={name}
      title={t("plan.skipTitle")}
      onClose={onClose}
      action={{
        label: t("plan.skip"),
        onPress: () => {
          void actions.savePlanChange({
            membershipId: o.membership.id,
            plannedOn: plannedOn(o),
            kind: "skip",
            movedTo: null,
            reason,
            note: note.trim() === "" ? null : note.trim(),
          });
          onClose();
        },
      }}
    >
      <p className="sheet-copy">{t("plan.skipBody")}</p>
      <div className="skip-reasons" role="group" aria-label={t("plan.skipWhy")}>
        <span className="plan-label plan-label--muted">{t("plan.skipWhy")}</span>
        <div className="skip-reason-chips">
          {SKIP_REASONS.map((r) => (
            <button
              key={r}
              type="button"
              aria-pressed={reason === r}
              style={chipStyle(reason === r, { textTransform: "none" })}
              onClick={() => setReason(reason === r ? null : r)}
            >
              {t(`plan.reason_${r}`)}
            </button>
          ))}
        </div>
      </div>
      <input
        className="field-input"
        value={note}
        maxLength={280}
        placeholder={t("plan.skipNote")}
        aria-label={t("plan.skipNote")}
        onChange={(e) => setNote(e.target.value)}
      />
    </Sheet>
  );
}
