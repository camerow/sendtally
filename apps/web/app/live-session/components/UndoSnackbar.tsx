import React from "react";
import { t } from "@sendtally/features/i18n";

export const UNDO_MS = 4000;

/** What the last Fell or Sent did, with Undo, for four seconds; a new id restarts the count. */
export function UndoSnackbar({
  id,
  message,
  onUndo,
  onExpire,
}: {
  id: number;
  message: string;
  onUndo: () => void;
  onExpire: () => void;
}): React.ReactElement {
  const expire = React.useRef(onExpire);
  React.useEffect(() => {
    expire.current = onExpire;
  });
  React.useEffect(() => {
    const timer = setTimeout(() => expire.current(), UNDO_MS);
    return () => clearTimeout(timer);
  }, [id]);
  return (
    <div className="undo-snackbar" role="status">
      <span>{message}</span>
      <button type="button" onClick={onUndo}>
        {t("tally.undo")}
      </button>
    </div>
  );
}
