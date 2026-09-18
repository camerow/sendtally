import React from "react";
import { t } from "@sendtally/features/i18n";

export function PendingBadge(): React.ReactElement {
  return (
    <span className="area-pending" title={t("areas.pendingHint")}>
      {t("areas.pending")}
    </span>
  );
}
