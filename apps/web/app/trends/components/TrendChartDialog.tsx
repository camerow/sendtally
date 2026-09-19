import React from "react";
import { t } from "@sendtally/features/i18n";
import type { TrendTileVM } from "@sendtally/features/trends";
import { TrendTile } from "./TrendTile";

export function TrendChartDialog({
  tile,
  onClose,
}: {
  tile: TrendTileVM;
  onClose: () => void;
}): React.ReactElement {
  const ref = React.useRef<HTMLDialogElement>(null);
  const close = React.useRef(onClose);
  React.useEffect(() => {
    close.current = onClose;
  }, [onClose]);

  /** The close event does not bubble, so React's onClose never sees Escape. */
  React.useEffect(() => {
    const dialog = ref.current;
    if (dialog === null) return;
    dialog.showModal();
    const closed = (): void => close.current();
    dialog.addEventListener("close", closed);
    return () => dialog.removeEventListener("close", closed);
  }, []);

  return (
    <dialog
      ref={ref}
      className="trend-chart-dialog trends"
      aria-label={tile.title}
      onClick={(e) => {
        if (e.target === ref.current) ref.current.close();
      }}
    >
      <button
        type="button"
        className="trend-link trend-chart-dialog-close"
        onClick={() => ref.current?.close()}
      >
        {t("common.done")}
      </button>
      <TrendTile tile={tile} plotHeight={360} />
    </dialog>
  );
}
