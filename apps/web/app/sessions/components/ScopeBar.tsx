import React from "react";
import type { ScopeItem } from "@sendtally/features/sessions";
import { Icon } from "../../components/Icon";
import { sectionAnchorId } from "../anchors";

const chip: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontWeight: 500,
  fontSize: 11,
  letterSpacing: "0.06em",
  display: "inline-flex",
  alignItems: "center",
  height: 30,
  padding: "0 11px",
  borderRadius: "var(--radius-pill)",
  textDecoration: "none",
  whiteSpace: "nowrap",
  flex: "none",
};

export function ScopeBar({
  items,
  currentKey,
  filtersActive,
  onOpenFilters,
}: {
  items: ScopeItem[];
  currentKey: string | null;
  filtersActive: boolean;
  onOpenFilters: () => void;
}): React.ReactElement {
  return (
    <nav className="sessions-scope" aria-label="Jump to">
      <div className="sessions-scope-strip">
        {items.map((item) => {
          const strong = item.kind === "year";
          const active = !strong && item.sectionKey === currentKey;
          return (
            <a
              key={item.key}
              href={`#${sectionAnchorId(item.sectionKey)}`}
              aria-current={active ? "true" : undefined}
              style={{
                ...chip,
                fontWeight: strong ? 600 : 500,
                background: active ? "var(--bs-gold)" : "transparent",
                color: active || strong ? "var(--bs-gunmetal)" : "rgba(64,63,76,0.65)",
                border: `1px solid ${
                  active ? "var(--bs-gold)" : strong ? "var(--bs-gunmetal)" : "rgba(64,63,76,0.18)"
                }`,
              }}
            >
              {item.label}
            </a>
          );
        })}
      </div>
      <div className="sessions-scope-tools">
        <button
          type="button"
          onClick={onOpenFilters}
          aria-label="Filters"
          aria-pressed={filtersActive}
          className="sessions-scope-filters"
          style={{
            background: filtersActive ? "var(--bs-gold)" : "transparent",
            borderColor: filtersActive ? "var(--bs-gold)" : "rgba(64,63,76,0.18)",
          }}
        >
          <Icon name="funnel" size={18} />
        </button>
      </div>
    </nav>
  );
}
