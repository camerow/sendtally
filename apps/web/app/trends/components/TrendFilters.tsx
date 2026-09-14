import React from "react";
import {
  PREVIEW_TREND_RANGE,
  TREND_DISCIPLINES,
  TREND_RANGES,
  type TrendsFeature,
} from "@sendtally/features/trends";
import { chipStyle } from "../../components/chip";

const lockedChip: React.CSSProperties = {
  borderStyle: "dashed",
  color: "rgba(64,63,76,0.42)",
  display: "inline-flex",
  alignItems: "center",
  gap: 5,
};

function LockGlyph(): React.ReactElement {
  return (
    <svg width="8" height="9" viewBox="0 0 8 9" aria-hidden="true">
      <rect
        x="0.75"
        y="3.75"
        width="6.5"
        height="4.5"
        rx="1"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
      />
      <path
        d="M2 3.75V2.5a2 2 0 0 1 4 0v1.25"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
      />
    </svg>
  );
}

export function TrendFilters({
  feature,
  onLockedRange,
}: {
  feature: TrendsFeature;
  onLockedRange?: () => void;
}): React.ReactElement {
  const {
    state,
    preview,
    range,
    setRange,
    setDiscipline,
    tagOptions,
    selectedTags,
    toggleTag,
    clearTags,
  } = feature;
  const disciplines = state.status === "ready" ? state.data.disciplines : [];
  const discipline = state.status === "ready" ? state.data.discipline : null;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 18 }}>
      {disciplines.length > 1 && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {TREND_DISCIPLINES.map((d) => (
            <button
              key={d.value}
              onClick={() => setDiscipline(d.value)}
              aria-pressed={discipline === d.value}
              style={chipStyle(discipline === d.value)}
            >
              {d.label}
            </button>
          ))}
        </div>
      )}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {TREND_RANGES.map((r) => {
          const locked = preview && r.value !== PREVIEW_TREND_RANGE;
          return (
            <button
              key={r.value}
              onClick={() => (locked ? onLockedRange?.() : setRange(r.value))}
              aria-pressed={range === r.value}
              aria-label={locked ? `${r.label}, members only` : undefined}
              style={chipStyle(range === r.value, locked ? lockedChip : {})}
            >
              {locked && <LockGlyph />}
              {r.label}
            </button>
          );
        })}
      </div>
      {tagOptions.length > 0 && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button onClick={clearTags} style={chipStyle(selectedTags.length === 0)}>
            ALL TAGS
          </button>
          {tagOptions.map((tag) => (
            <button
              key={tag.slug}
              onClick={() => toggleTag(tag.slug)}
              aria-pressed={selectedTags.includes(tag.slug)}
              style={chipStyle(selectedTags.includes(tag.slug))}
            >
              {tag.name.toUpperCase()}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
