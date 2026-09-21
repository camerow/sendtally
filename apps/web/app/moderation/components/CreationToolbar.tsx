import React from "react";
import {
  CREATION_SORTS,
  type CreationFilter,
  type CreationSort,
  type CreationType,
  type DuplicateFilter,
} from "@sendtally/features/areas";

export type CreationToolbarProps = {
  filter: CreationFilter;
  onChange: (filter: CreationFilter) => void;
};

export function CreationToolbar({ filter, onChange }: CreationToolbarProps): React.ReactElement {
  return (
    <div className="mod-toolbar">
      <input
        type="search"
        className="mod-search"
        aria-label="Search the queue"
        placeholder="Search area, climb or submitter"
        value={filter.query}
        onChange={(e) => onChange({ ...filter, query: e.target.value })}
      />
      <select
        className="mod-select"
        aria-label="Type"
        value={filter.type}
        onChange={(e) => onChange({ ...filter, type: e.target.value as CreationType })}
      >
        <option value="all">All types</option>
        <option value="area">Areas only</option>
        <option value="climb">Climbs only</option>
      </select>
      <select
        className="mod-select"
        aria-label="Possible duplicates"
        value={filter.duplicates}
        onChange={(e) => onChange({ ...filter, duplicates: e.target.value as DuplicateFilter })}
      >
        <option value="all">Any duplicate status</option>
        <option value="clean">No possible duplicates</option>
        <option value="flagged">Possible duplicates</option>
      </select>
      <select
        className="mod-select"
        aria-label="Sort"
        value={filter.sort}
        onChange={(e) => onChange({ ...filter, sort: e.target.value as CreationSort })}
      >
        {CREATION_SORTS.map((sort) => (
          <option key={sort.value} value={sort.value}>
            {sort.label}
          </option>
        ))}
      </select>
    </div>
  );
}
