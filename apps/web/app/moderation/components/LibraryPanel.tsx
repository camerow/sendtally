import React from "react";
import type { BuiltInLibrary, LibraryEntry, SendtallyApi } from "@sendtally/api-client";
import { KIND_LOOK } from "@sendtally/features/training";
import { formatDate, formatNumber } from "@sendtally/features/i18n";
import {
  categoryLabel,
  descriptionSummary,
  entryKind,
  filterCounts,
  LIBRARY_FILTERS,
  libraryFilterLabel,
  libraryGroups,
  type LibraryFilter,
} from "@sendtally/features/library";
import { FilterChip } from "../../components/FilterChip";
import { LibraryItemEditor } from "./LibraryItemEditor";

export type LibraryPanelProps = {
  api: SendtallyApi;
  library: BuiltInLibrary;
  /** The built-in open for editing, as "type:id". */
  item: string | null;
  onOpen: (item: string | null) => void;
};

const keyOf = (e: LibraryEntry): string => `${e.type}:${e.id}`;

function Row({ entry, onOpen }: { entry: LibraryEntry; onOpen: () => void }): React.ReactElement {
  const kind = entryKind(entry);
  const summary = descriptionSummary(entry.description);
  return (
    <button type="button" className="mod-lib-row" onClick={onOpen}>
      <span className="mod-lib-name">{entry.name}</span>
      <span className="mod-lib-mono" style={{ color: KIND_LOOK[kind].ink }}>
        {categoryLabel(kind)}
      </span>
      {summary === null ? (
        <span className="mod-lib-missing">No description</span>
      ) : (
        <span className="mod-lib-ok">✓ {summary}</span>
      )}
      <span className="mod-lib-mono mod-muted">
        {entry.updatedAt === null
          ? "Seeded"
          : formatDate(new Date(entry.updatedAt), { month: "short", day: "numeric" })}
      </span>
    </button>
  );
}

/** Every built-in with what it lacks, or one of them open for editing. */
export function LibraryPanel({
  api,
  library,
  item,
  onOpen,
}: LibraryPanelProps): React.ReactElement {
  const [filter, setFilter] = React.useState<LibraryFilter>("all");
  const all = [...library.workouts, ...library.grips, ...library.exercises];
  const open = all.find((e) => keyOf(e) === item);
  if (open !== undefined)
    return (
      <LibraryItemEditor
        key={`${keyOf(open)}:${open.updatedAt ?? ""}`}
        api={api}
        entry={open}
        onBack={() => onOpen(null)}
      />
    );
  const counts = filterCounts(library);
  return (
    <div className="mod-lib">
      <div className="mod-lib-filters">
        {LIBRARY_FILTERS.map((f) => (
          <FilterChip
            key={f}
            label={`${libraryFilterLabel(f)} ${formatNumber(counts[f])}`}
            active={f === filter}
            onPress={() => setFilter(f)}
          />
        ))}
      </div>
      <div className="mod-lib-row mod-lib-head" aria-hidden="true">
        <span>Name</span>
        <span>Category</span>
        <span>Description</span>
        <span>Changed</span>
      </div>
      {libraryGroups(library, filter).map((group) => (
        <section key={group.title} aria-label={group.title}>
          <h2 className="mod-lib-group">{`${group.title} · ${formatNumber(group.entries.length)}`}</h2>
          {group.entries.map((entry) => (
            <Row key={keyOf(entry)} entry={entry} onOpen={() => onOpen(keyOf(entry))} />
          ))}
        </section>
      ))}
    </div>
  );
}
