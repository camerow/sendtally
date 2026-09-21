import type { RevisionItem } from "@sendtally/api-client";
import { formatDate, formatNumber } from "../i18n";
import { climbTypeLabel } from "./transforms";
import type { ClimbType } from "./types";

// Moderation is internal tooling: English only, no i18n.
export type ModerationTab = "creations" | "revisions" | "duplicates" | "reports";

export const MODERATION_TABS: readonly ModerationTab[] = [
  "creations",
  "revisions",
  "duplicates",
  "reports",
];

const TAB_LABELS: Record<ModerationTab, string> = {
  creations: "Creations",
  revisions: "Edits",
  duplicates: "Duplicates",
  reports: "Reports",
};

export function moderationTabLabel(tab: ModerationTab): string {
  return TAB_LABELS[tab];
}

const FIELD_LABELS: Record<string, string> = {
  parent_id: "Parent area",
  area_id: "Crag",
  name: "Name",
  description: "Description",
  lat: "Latitude",
  lon: "Longitude",
  type: "Type",
  grade_scale: "Grade scale",
  grade_value: "Grade",
  length_m: "Length (m)",
  bolts: "Bolts",
  first_ascent: "First ascent",
};

export function fieldLabel(field: string): string {
  return FIELD_LABELS[field] ?? field;
}

export function fieldValue(field: string, value: unknown): string {
  if (value === null || value === undefined || value === "") return "-";
  if (field === "type") return climbTypeLabel(value as ClimbType);
  if (typeof value === "number") return formatNumber(value, { maximumFractionDigits: 6 });
  return String(value);
}

/** Which side of a conflict the moderator keeps. */
export type Side = "proposed" | "current";

export type DiffRow = {
  field: string;
  label: string;
  before: string;
  proposed: string;
  now: string;
  conflict: boolean;
};

/** One row per proposed field: what the suggester saw, what they want, and what is live now. */
export function diffRows(revision: RevisionItem): DiffRow[] {
  const conflicts = new Set(revision.conflicts.map((c) => c.field));
  return Object.keys(revision.proposed).map((field) => ({
    field,
    label: fieldLabel(field),
    before: fieldValue(field, revision.base[field]),
    proposed: fieldValue(field, revision.proposed[field]),
    now: revision.current === null ? "-" : fieldValue(field, revision.current[field]),
    conflict: conflicts.has(field),
  }));
}

/** The approval body's resolutions, or null while a conflicting field still has no pick. */
export function resolutionsOf(
  revision: RevisionItem,
  picks: Partial<Record<string, Side>>
): Record<string, unknown> | null {
  const resolutions: Record<string, unknown> = {};
  for (const conflict of revision.conflicts) {
    const side = picks[conflict.field];
    if (side === undefined) return null;
    resolutions[conflict.field] = conflict[side];
  }
  return resolutions;
}

/** The version the approval is checked against: the entity's, as the queue last read it. */
export function revisionVersion(revision: RevisionItem): number | null {
  const version = revision.current?.["version"];
  return typeof version === "number" ? version : null;
}

export function queuedOn(iso: string): string {
  return formatDate(new Date(iso), { day: "numeric", month: "short" });
}
