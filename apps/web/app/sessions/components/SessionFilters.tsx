import React from "react";
import { Link } from "react-router";
import {
  UNTAGGED_KEY,
  UNTAGGED_LABEL,
  type SessionGrouping,
  type TagOption,
} from "@sendtally/features/sessions";
import { chipStyle } from "../../components/chip";

const label: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontWeight: 500,
  fontSize: 10,
  letterSpacing: "0.08em",
  color: "rgba(64,63,76,0.55)",
  minWidth: 62,
};

export type SessionFiltersProps = {
  grouping: SessionGrouping;
  tagOptions: TagOption[];
  untaggedCount: number;
  selectedTags: string[];
  hrefFor: (next: { grouping?: SessionGrouping; tags?: string[] }) => string;
};

function Row({ children, name }: { children: React.ReactNode; name: string }): React.ReactElement {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
      <span style={label}>{name}</span>
      {children}
    </div>
  );
}

export function SessionFilters({
  grouping,
  tagOptions,
  untaggedCount,
  selectedTags,
  hrefFor,
}: SessionFiltersProps): React.ReactElement {
  const toggled = (slug: string): string[] =>
    selectedTags.includes(slug) ? selectedTags.filter((s) => s !== slug) : [...selectedTags, slug];

  const chips: Array<{ key: string; text: string }> = tagOptions.map((t) => ({
    key: t.slug,
    text: `${t.name.toUpperCase()} ${t.count}`,
  }));
  if (untaggedCount > 0) {
    chips.push({ key: UNTAGGED_KEY, text: `${UNTAGGED_LABEL.toUpperCase()} ${untaggedCount}` });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 24 }}>
      <Row name="GROUP BY">
        {(["month", "tag"] as const).map((value) => (
          <Link key={value} to={hrefFor({ grouping: value })} style={chipStyle(grouping === value)}>
            {value.toUpperCase()}
          </Link>
        ))}
      </Row>
      <Row name="TAGS">
        <Link to={hrefFor({ tags: [] })} style={chipStyle(selectedTags.length === 0)}>
          ALL
        </Link>
        {chips.map((chip) => (
          <Link
            key={chip.key}
            to={hrefFor({ tags: toggled(chip.key) })}
            aria-pressed={selectedTags.includes(chip.key)}
            style={chipStyle(selectedTags.includes(chip.key))}
          >
            {chip.text}
          </Link>
        ))}
      </Row>
    </div>
  );
}
