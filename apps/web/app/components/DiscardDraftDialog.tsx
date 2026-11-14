import React from "react";
import type { StoredSessionDraft } from "@sendtally/features/log-session";
import { formatDate, t } from "@sendtally/features/i18n";
import { Sheet } from "./Sheet";

/** Asks before a saved draft is thrown away; Discard is the red outline, as every destructive confirm. */
export function DiscardDraftDialog({
  stored,
  onCancel,
  onDiscard,
}: {
  stored: StoredSessionDraft;
  onCancel: () => void;
  onDiscard: () => void;
}): React.ReactElement {
  const count = stored.draft.climbs.length;
  const day = formatDate(stored.savedAt, { weekday: "long" });
  return (
    <Sheet
      open
      title={t("common.discardDraftTitle")}
      onClose={onCancel}
      action={{ label: t("common.discard"), danger: true, onPress: onDiscard }}
    >
      <p className="sheet-body">{t("common.discardDraftBody", { count, day })}</p>
    </Sheet>
  );
}
