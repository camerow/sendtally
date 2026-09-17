import React from "react";
import type { SessionNameCount } from "@sendtally/features/import";
import type { TagOption } from "@sendtally/features/sessions";
import { t } from "@sendtally/features/i18n";
import { TagPicker } from "../../components/TagPicker";
import {
  bodyText,
  monoMuted,
  sectionLabel,
  underlineButton,
} from "../../settings/components/styles";
import { select } from "../styles";

const linkButton: React.CSSProperties = { ...underlineButton, alignSelf: "center" };

export type SessionTagBarProps = {
  names: SessionNameCount[];
  selectedCount: number;
  total: number;
  tags: string[];
  suggestions: TagOption[];
  disabled: boolean;
  onSelectNamed: (name: string) => void;
  onSelectAll: () => void;
  onClear: () => void;
  onAdd: (tag: string) => void;
  onRemove: (tag: string) => void;
};

export function SessionTagBar({
  names,
  selectedCount,
  total,
  tags,
  suggestions,
  disabled,
  onSelectNamed,
  onSelectAll,
  onClear,
  onAdd,
  onRemove,
}: SessionTagBarProps): React.ReactElement {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 10,
        padding: "14px 18px",
        background: "var(--surface-soft)",
        borderBottom: "1px solid var(--line-on-light)",
      }}
    >
      <span style={sectionLabel}>{t("import.tagSelected")}</span>
      <p style={bodyText}>{t("import.tagSelectedHint")}</p>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12 }}>
        {names.length > 0 && (
          <select
            value=""
            disabled={disabled}
            aria-label={t("import.selectNamed")}
            onChange={(e) => onSelectNamed(e.target.value)}
            style={select}
          >
            <option value="" disabled>
              {t("import.selectNamed")}
            </option>
            {names.map(({ name, sessions }) => (
              <option key={name} value={name}>
                {`${name} · ${sessions}`}
              </option>
            ))}
          </select>
        )}
        {selectedCount < total && (
          <button type="button" style={linkButton} disabled={disabled} onClick={onSelectAll}>
            {t("import.selectAll")}
          </button>
        )}
        {selectedCount > 0 && (
          <button type="button" style={linkButton} disabled={disabled} onClick={onClear}>
            {t("import.selectNone")}
          </button>
        )}
        <span style={{ ...monoMuted, marginLeft: "auto" }}>
          {t("import.selectedCount", { count: selectedCount })}
        </span>
      </div>
      <div style={{ opacity: selectedCount === 0 ? 0.5 : 1 }}>
        <TagPicker
          tags={tags}
          suggestions={suggestions}
          disabled={disabled || selectedCount === 0}
          onAdd={onAdd}
          onRemove={onRemove}
        />
      </div>
    </div>
  );
}
