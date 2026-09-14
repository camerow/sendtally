import React from "react";
import { Link } from "react-router";
import {
  UNTAGGED_KEY,
  untaggedLabel,
  type SessionGrouping,
  type TagOption,
} from "@sendtally/features/sessions";
import { t, upper } from "@sendtally/features/i18n";
import { chipStyle } from "../../components/chip";

export type SessionFiltersProps = {
  grouping: SessionGrouping;
  tagOptions: TagOption[];
  untaggedCount: number;
  selectedTags: string[];
  hrefFor: (next: { grouping?: SessionGrouping; tags?: string[] }) => string;
};

function Row({ name, children }: { name: string; children: React.ReactNode }): React.ReactElement {
  return (
    <div className="sessions-filter-row">
      <span className="sessions-filter-label">{name}</span>
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
    chips.push({ key: UNTAGGED_KEY, text: `${upper(untaggedLabel())} ${untaggedCount}` });
  }

  return (
    <div className="sessions-filters">
      <Row name={upper(t("web.sessions.groupBy"))}>
        {(["month", "tag"] as const).map((value) => (
          <Link key={value} to={hrefFor({ grouping: value })} style={chipStyle(grouping === value)}>
            {upper(t(value === "month" ? "web.sessions.groupMonth" : "web.sessions.groupTag"))}
          </Link>
        ))}
      </Row>
      <Row name={upper(t("web.sessions.tags"))}>
        <Link to={hrefFor({ tags: [] })} style={chipStyle(selectedTags.length === 0)}>
          {upper(t("web.sessions.all"))}
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
