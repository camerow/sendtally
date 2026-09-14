import React from "react";
import type { StoredSessionDraft } from "@sendtally/features/log-session";
import { formatDate, t } from "@sendtally/features/i18n";

export function DiscardDraftDialog({
  stored,
  onCancel,
  onDiscard,
}: {
  stored: StoredSessionDraft;
  onCancel: () => void;
  onDiscard: () => void;
}): React.ReactElement {
  const ref = React.useRef<HTMLDialogElement>(null);
  const count = stored.draft.climbs.length;
  const day = formatDate(stored.savedAt, { weekday: "long" });

  const cancel = React.useRef(onCancel);
  React.useEffect(() => {
    cancel.current = onCancel;
  }, [onCancel]);

  /** The close event does not bubble, so React's onClose never sees Escape. */
  React.useEffect(() => {
    const dialog = ref.current;
    if (dialog === null) return;
    dialog.showModal();
    const closed = (): void => cancel.current();
    dialog.addEventListener("close", closed);
    return () => dialog.removeEventListener("close", closed);
  }, []);

  return (
    <dialog
      ref={ref}
      className="confirm-dialog"
      onClick={(e) => {
        if (e.target === ref.current) ref.current.close();
      }}
    >
      <h2
        style={{
          margin: 0,
          fontFamily: "var(--font-display)",
          fontWeight: 700,
          fontSize: 21,
          letterSpacing: "-0.02em",
        }}
      >
        {t("web.components.discardDraftTitle")}
      </h2>
      <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55, color: "rgba(64,63,76,0.88)" }}>
        {t("web.components.discardDraftBody", { count, day })}
      </p>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 4 }}>
        <button type="button" autoFocus onClick={onCancel} className="confirm-dialog-cancel">
          {t("web.shell.cancel")}
        </button>
        <button type="button" onClick={onDiscard} className="confirm-dialog-confirm">
          {t("web.components.discard")}
        </button>
      </div>
    </dialog>
  );
}
