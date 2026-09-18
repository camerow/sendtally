import type { RevisionItem } from "@sendtally/api-client";
import { formatDate, formatNumber, t, type MessageKey } from "../i18n";
import { climbTypeLabel } from "./transforms";
import type { ClimbType } from "./types";

export type ModerationTab = "creations" | "revisions" | "duplicates" | "reports";

export const MODERATION_TABS: readonly ModerationTab[] = [
  "creations",
  "revisions",
  "duplicates",
  "reports",
];

const TAB_KEYS: Record<ModerationTab, MessageKey> = {
  creations: "moderation.creations",
  revisions: "moderation.edits",
  duplicates: "moderation.duplicates",
  reports: "moderation.reports",
};

export function moderationTabLabel(tab: ModerationTab): string {
  return t(TAB_KEYS[tab]);
}

const FIELD_KEYS: Record<string, MessageKey> = {
  parent_id: "moderation.parentArea",
  area_id: "areas.crag",
  name: "areas.name",
  description: "areas.description",
  lat: "areas.latitude",
  lon: "areas.longitude",
  type: "areas.type",
  grade_scale: "areas.gradeScale",
  grade_value: "areas.grade",
  length_m: "areas.lengthMetres",
  bolts: "areas.bolts",
  first_ascent: "areas.firstAscent",
};

export function fieldLabel(field: string): string {
  const key = FIELD_KEYS[field];
  return key === undefined ? field : t(key);
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
