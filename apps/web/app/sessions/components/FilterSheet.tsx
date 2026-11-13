import React from "react";
import { t } from "@sendtally/features/i18n";
import {
  TRAINING_LOG_SCOPES,
  logScopeItems,
  logScopeLabel,
  type LogItem,
  type LogScope,
} from "@sendtally/features/journal";
import { logCountLabel } from "@sendtally/features/sessions";
import { FilterChip } from "../../components/FilterChip";
import { Sheet } from "../../components/Sheet";

/** What the Training log shows: All, Sessions, Journal or Injuries; applied with its count. */
export function FilterSheet({
  open,
  items,
  scope,
  onApply,
  onClose,
}: {
  open: boolean;
  items: LogItem[];
  scope: LogScope;
  onApply: (scope: LogScope) => void;
  onClose: () => void;
}): React.ReactElement {
  const [draft, setDraft] = React.useState<LogScope>(scope);
  const [wasOpen, setWasOpen] = React.useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setDraft(scope);
  }
  const count = logScopeItems(items, draft);
  return (
    <Sheet
      open={open}
      title={t("common.filters")}
      onClose={onClose}
      action={{
        label: t("sessions.showCount", { label: logCountLabel(count).toLowerCase() }),
        onPress: () => onApply(draft),
      }}
    >
      <div className="filter-head">
        <span className="field-label">{t("journal.show")}</span>
        <button type="button" className="filter-clear" onClick={() => setDraft("all")}>
          {t("common.clear")}
        </button>
      </div>
      <div className="grade-presets">
        {TRAINING_LOG_SCOPES.map((value) => (
          <FilterChip
            key={value}
            label={logScopeLabel(value)}
            active={draft === value}
            onPress={() => setDraft(value)}
          />
        ))}
      </div>
    </Sheet>
  );
}
