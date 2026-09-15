import React from "react";
import { useNavigate } from "react-router";
import {
  UNTAGGED_KEY,
  untaggedLabel,
  countLabel,
  filterSessionsByTags,
  type SessionGrouping,
  type TagOption,
} from "@sendtally/features/sessions";
import type { LogItem } from "@sendtally/features/journal";
import { t } from "@sendtally/features/i18n";
import { chipStyle } from "../../components/chip";

export type SessionFilterSheetProps = {
  onClose: () => void;
  items: LogItem[];
  grouping: SessionGrouping;
  tagOptions: TagOption[];
  untaggedCount: number;
  selectedTags: string[];
  hrefFor: (next: { grouping?: SessionGrouping; tags?: string[] }) => string;
};

const sheetChip = (active: boolean): React.CSSProperties =>
  chipStyle(active, {
    display: "inline-flex",
    alignItems: "center",
    height: 40,
    padding: "0 14px",
    background: active ? "var(--bs-gold)" : "transparent",
  });

function Field({
  name,
  children,
}: {
  name: string;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
      <span className="sessions-filter-label">{name}</span>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>{children}</div>
    </div>
  );
}

export function SessionFilterSheet({
  onClose,
  items,
  grouping,
  tagOptions,
  untaggedCount,
  selectedTags,
  hrefFor,
}: SessionFilterSheetProps): React.ReactElement {
  const navigate = useNavigate();
  const [draftGrouping, setDraftGrouping] = React.useState<SessionGrouping>(grouping);
  const [draftTags, setDraftTags] = React.useState<string[]>(selectedTags);

  const toggleTag = (slug: string): void =>
    setDraftTags((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  const count = filterSessionsByTags(items, draftTags).length;
  const chips: Array<{ key: string; text: string }> = tagOptions.map((t) => ({
    key: t.slug,
    text: `${t.name} ${t.count}`,
  }));
  if (untaggedCount > 0) {
    chips.push({ key: UNTAGGED_KEY, text: `${untaggedLabel()} ${untaggedCount}` });
  }

  return (
    <div className="sessions-sheet-backdrop" onClick={onClose}>
      <div
        className="sessions-sheet"
        role="dialog"
        aria-modal="true"
        aria-label={t("common.filters")}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="sessions-sheet-handle" />
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
          <span
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              fontSize: 22,
              letterSpacing: "-0.02em",
            }}
          >
            {t("common.filters")}
          </span>
          <button
            type="button"
            className="sessions-sheet-clear"
            onClick={() => {
              setDraftGrouping("month");
              setDraftTags([]);
            }}
          >
            {t("common.clear")}
          </button>
        </div>
        <Field name={t("sessions.groupBy")}>
          {(["month", "tag"] as const).map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={draftGrouping === value}
              style={sheetChip(draftGrouping === value)}
              onClick={() => setDraftGrouping(value)}
            >
              {t(value === "month" ? "sessions.groupMonth" : "sessions.groupTag")}
            </button>
          ))}
        </Field>
        {chips.length > 0 && (
          <Field name={t("common.tags")}>
            {chips.map((chip) => (
              <button
                key={chip.key}
                type="button"
                aria-pressed={draftTags.includes(chip.key)}
                style={sheetChip(draftTags.includes(chip.key))}
                onClick={() => toggleTag(chip.key)}
              >
                {chip.text}
              </button>
            ))}
          </Field>
        )}
        <button
          type="button"
          className="sessions-sheet-apply"
          onClick={() => {
            onClose();
            void navigate(hrefFor({ grouping: draftGrouping, tags: draftTags }));
          }}
        >
          {t("sessions.showCount", { label: countLabel(count).toLowerCase() })}
        </button>
      </div>
    </div>
  );
}
