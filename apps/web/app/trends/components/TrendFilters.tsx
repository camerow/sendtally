import React from "react";
import { TREND_DISCIPLINES, TREND_RANGES, type TrendsFeature } from "@sendtally/features/trends";
import { chipStyle } from "../../components/chip";

export function TrendFilters({ feature }: { feature: TrendsFeature }): React.ReactElement {
  const { state, range, setRange, setDiscipline, tagOptions, selectedTags, toggleTag, clearTags } =
    feature;
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
        {TREND_RANGES.map((r) => (
          <button
            key={r.value}
            onClick={() => setRange(r.value)}
            style={chipStyle(range === r.value)}
          >
            {r.label}
          </button>
        ))}
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
