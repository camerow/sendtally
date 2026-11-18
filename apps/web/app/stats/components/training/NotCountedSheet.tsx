import React from "react";
import { t } from "@sendtally/features/i18n";
import type { WorkloadLeftOutVM } from "@sendtally/features/statistics";
import { Sheet } from "../../../components/Sheet";
import { NotCountedRows } from "./NotCountedRows";

/** The records in the range left out of the load, nothing else. */
export function NotCountedSheet({
  rows,
  open,
  onClose,
}: {
  rows: WorkloadLeftOutVM[];
  open: boolean;
  onClose: () => void;
}): React.ReactElement | null {
  return (
    <Sheet open={open} title={t("statistics.loadTitle")} onClose={onClose} cancel={false}>
      <div className="load-not-counted">
        <NotCountedRows label={t("statistics.loadNotCountedTitle")} rows={rows} />
      </div>
    </Sheet>
  );
}
