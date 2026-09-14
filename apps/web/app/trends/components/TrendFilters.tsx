import React from "react";
import { disciplineLabel } from "@sendtally/features/log-session";
import {
  TREND_DISCIPLINES,
  TREND_RANGES,
  trendRangeLabel,
  type TrendsFeature,
} from "@sendtally/features/trends";
import { t } from "@sendtally/features/i18n";
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
              key={d}
              onClick={() => setDiscipline(d)}
              aria-pressed={discipline === d}
              style={chipStyle(discipline === d)}
            >
              {disciplineLabel(d)}
            </button>
          ))}
        </div>
      )}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {TREND_RANGES.map((r) => (
          <button key={r} onClick={() => setRange(r)} style={chipStyle(range === r)}>
            {trendRangeLabel(r)}
          </button>
        ))}
      </div>
      {tagOptions.length > 0 && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button onClick={clearTags} style={chipStyle(selectedTags.length === 0)}>
            {t("trends.allTags")}
          </button>
          {tagOptions.map((tag) => (
            <button
              key={tag.slug}
              onClick={() => toggleTag(tag.slug)}
              aria-pressed={selectedTags.includes(tag.slug)}
              style={chipStyle(selectedTags.includes(tag.slug))}
            >
              {tag.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
