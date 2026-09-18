import React from "react";
import { t } from "@sendtally/features/i18n";
import type { TrendTagVM } from "@sendtally/features/trends";

function Tick(): React.ReactElement {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
      <path
        d="M2 5.2 4.1 7.3 8 2.8"
        fill="none"
        stroke="#ffffff"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function TagChecklist({
  tags,
  selected,
  onToggle,
  onClear,
  searchable = true,
}: {
  tags: TrendTagVM[];
  selected: string[];
  onToggle: (slug: string) => void;
  onClear: () => void;
  searchable?: boolean;
}): React.ReactElement {
  const [query, setQuery] = React.useState("");
  const id = React.useId();
  const needle = query.trim().toLowerCase();
  const shown = needle === "" ? tags : tags.filter((g) => g.name.toLowerCase().includes(needle));
  return (
    <div>
      {searchable && (
        <>
          <label htmlFor={id} className="trend-small-label" style={{ margin: "0 6px 6px" }}>
            {t("trends.findTag")}
          </label>
          <input
            id={id}
            type="search"
            className="trend-search"
            value={query}
            placeholder={t("trends.tagSearchPlaceholder")}
            onChange={(e) => setQuery(e.target.value)}
          />
        </>
      )}
      <div className="trend-tag-list" role="group" aria-label={t("common.tags")}>
        {shown.length === 0 && <p className="trend-popover-help">{t("trends.noTagMatch")}</p>}
        {shown.map((g) => (
          <button
            key={g.slug}
            type="button"
            role="checkbox"
            className="trend-option"
            aria-checked={selected.includes(g.slug)}
            onClick={() => onToggle(g.slug)}
          >
            <span className="trend-check">
              <Tick />
            </span>
            <span className="trend-option-name">{g.name}</span>
            <span className="trend-option-count">{g.sessions}</span>
          </button>
        ))}
      </div>
      <div
        className="trend-popover-foot"
        style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--line-on-light-soft)" }}
      >
        <span style={{ fontSize: 12, color: "var(--trend-muted)" }}>
          {t("trends.anyCheckedTag")}
        </span>
        <button type="button" className="trend-link" style={{ height: 32 }} onClick={onClear}>
          {t("common.clear")}
        </button>
      </div>
    </div>
  );
}
