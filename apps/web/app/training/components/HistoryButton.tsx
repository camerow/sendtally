import React from "react";
import { Link } from "react-router";
import { t } from "@sendtally/features/i18n";
import { Icon } from "../../components/Icon";

export type HistoryButtonProps = { name: string; to: string };

/** The History icon beside an exercise or a workout, opening its one history view. */
export function HistoryButton({ name, to }: HistoryButtonProps): React.ReactElement {
  return (
    <Link to={to} className="history-button" aria-label={t("common.historyOf", { name })}>
      <Icon name="history" size={20} strokeWidth={1.9} />
    </Link>
  );
}
