import { disciplineOf, isLikelyDuplicate, parseGrade } from "@sendtally/core";
import { z } from "zod";
import type {
  AreaClimbEdit,
  AreaClimbRevisionWrite,
  AreaClimbRow,
  AreaRevisionWrite,
  AreaRow,
  Box,
  RevisionRow,
  UserRow,
} from "./repo";
import { tagSlug } from "./tags";

export type ContentStatus = "pending" | "active";

export type Viewer = { id: string; role: UserRow["role"] };

export const NEAR_KM = 2;

export function initialStatus(_user: Viewer): ContentStatus {
  return "pending";
}

export const isRegion = (area: AreaRow): boolean => area.region_code !== null;

export const isOpen = (row: { status: string }): boolean =>
  row.status === "active" || row.status === "pending";

const name = z
  .string()
  .trim()
  .min(1)
  .max(120)
  .refine((n) => tagSlug(n) !== "", "a name needs at least one letter or number");

const optionalText = (max: number) => z.string().trim().max(max).nullish();

const areaFields = z.object({
  name,
  description: optionalText(4000),
  lat: z.number().min(-90).max(90).nullish(),
  lon: z.number().min(-180).max(180).nullish(),
});

const bothOrNeither = (a: { lat?: number | null; lon?: number | null }): boolean =>
  (a.lat == null) === (a.lon == null);

export const areaEditBody = areaFields.refine(bothOrNeither, "lat and lon go together");

export const areaBody = areaFields
  .extend({ parentId: z.string().min(1), confirmedNew: z.boolean().default(false) })
  .refine(bothOrNeither, "lat and lon go together");

export const areaSimilarBody = z
  .object({
    parentId: z.string().min(1),
    name,
    lat: z.number().min(-90).max(90).optional(),
    lon: z.number().min(-180).max(180).optional(),
  })
  .refine(bothOrNeither, "lat and lon go together");

export type AreaInput = z.input<typeof areaBody>;

const CLIMB_TYPES = ["boulder", "sport", "trad", "top_rope"] as const;

const climbFields = z.object({
  name,
  description: optionalText(4000),
  type: z.enum(CLIMB_TYPES),
  gradeScale: z.enum(["v", "font", "yds", "french"]),
  grade: z.string().trim().max(10).nullish(),
  lengthM: z.number().int().min(1).max(3000).nullish(),
  bolts: z.number().int().min(0).max(200).nullish(),
  firstAscent: optionalText(200),
});

type ClimbFields = z.infer<typeof climbFields>;

const matchingScale = (c: ClimbFields): boolean =>
  (c.type === "boulder") === (disciplineOf(c.gradeScale) === "boulder");

const knownGrade = (c: ClimbFields): boolean =>
  c.grade == null || c.grade === "" || parseGrade(c.gradeScale, c.grade) !== undefined;

export const areaClimbEditBody = climbFields
  .refine(matchingScale, "grade scale does not match the climb type")
  .refine(knownGrade, "unknown grade");

export const areaClimbBody = climbFields
  .extend({ areaId: z.string().min(1), confirmedNew: z.boolean().default(false) })
  .refine(matchingScale, "grade scale does not match the climb type")
  .refine(knownGrade, "unknown grade");

export const areaClimbSimilarBody = z.object({ areaId: z.string().min(1), name });

export type AreaClimbInput = z.input<typeof areaClimbBody>;

export function climbWrite(c: ClimbFields): AreaClimbEdit {
  return {
    name: c.name,
    name_key: tagSlug(c.name),
    description: c.description || null,
    type: c.type,
    grade_scale: c.gradeScale,
    grade_value: c.grade || null,
    length_m: c.lengthM ?? null,
    bolts: c.bolts ?? null,
    first_ascent: c.firstAscent || null,
  };
}

// Readable first, then qualified by the parent, then numbered. Set once:
// a rename never changes it.
export async function uniqueSlug(
  name: string,
  parentSlug: string,
  taken: (slug: string) => Promise<boolean>
): Promise<string> {
  const base = tagSlug(name);
  if (!(await taken(base))) return base;
  const qualified = `${base}-${parentSlug}`;
  if (!(await taken(qualified))) return qualified;
  for (let n = 2; ; n++) {
    const slug = `${qualified}-${n}`;
    if (!(await taken(slug))) return slug;
  }
}

export function distanceKm(
  a: { lat: number; lon: number },
  b: { lat: number; lon: number }
): number {
  const rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad;
  const dLon = (b.lon - a.lon) * rad;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLon / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(h));
}

export function boundingBox(at: { lat: number; lon: number }, km: number): Box {
  const dLat = km / 111.32;
  const dLon = dLat / Math.max(Math.cos((at.lat * Math.PI) / 180), 0.01);
  return {
    minLat: at.lat - dLat,
    maxLat: at.lat + dLat,
    minLon: at.lon - dLon,
    maxLon: at.lon + dLon,
  };
}

export function duplicatesOf<T extends { id: string; name_key: string }>(
  nameKey: string,
  rows: T[],
  excludeId?: string
): T[] {
  const seen = new Set<string>();
  return rows.filter((r) => {
    if (r.id === excludeId || seen.has(r.id) || !isLikelyDuplicate(nameKey, r.name_key))
      return false;
    seen.add(r.id);
    return true;
  });
}

export type AreaSummary = {
  id: string;
  parent_id: string | null;
  name: string;
  slug: string;
  depth: number;
  lat: number | null;
  lon: number | null;
  region_code: string | null;
  status: AreaRow["status"];
};

export type Area = AreaSummary & {
  description: string | null;
  version: number;
  mine: boolean;
  created_at: string;
  updated_at: string;
};

export function areaSummaryOf(row: AreaRow): AreaSummary {
  return {
    id: row.id,
    parent_id: row.parent_id,
    name: row.name,
    slug: row.slug,
    depth: row.depth,
    lat: row.lat,
    lon: row.lon,
    region_code: row.region_code,
    status: row.status,
  };
}

export function areaOf(row: AreaRow, viewer: Viewer): Area {
  return {
    ...areaSummaryOf(row),
    description: row.description,
    version: row.version,
    mine: row.created_by === viewer.id,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export type AreaClimb = Omit<
  AreaClimbRow,
  "created_by" | "name_key" | "merged_into_id" | "review_note"
> & {
  mine: boolean;
};

export function areaClimbOf(row: AreaClimbRow, viewer: Viewer): AreaClimb {
  const { created_by, name_key: _key, merged_into_id: _merged, review_note: _note, ...rest } = row;
  return { ...rest, mine: created_by === viewer.id };
}

export type ContentEntity = "area" | "climb";

export type Fields = Record<string, unknown>;

// What a suggested edit may change, in column names. A draft's base and
// proposal both use these keys, so a three-way check can compare them directly.
export const EDITABLE_FIELDS = {
  area: ["parent_id", "name", "description", "lat", "lon"],
  climb: [
    "area_id",
    "name",
    "description",
    "type",
    "grade_scale",
    "grade_value",
    "length_m",
    "bolts",
    "first_ascent",
  ],
} as const satisfies {
  area: readonly (keyof AreaRow)[];
  climb: readonly (keyof AreaClimbRow)[];
};

export function snapshotOf(type: ContentEntity, row: AreaRow | AreaClimbRow): Fields {
  const values: Fields = row;
  return {
    ...Object.fromEntries(EDITABLE_FIELDS[type].map((f) => [f, values[f] ?? null])),
    version: row.version,
  };
}

export function changesFrom(current: Fields, next: Fields): Fields {
  return Object.fromEntries(Object.entries(next).filter(([f, v]) => v !== current[f]));
}

const summary = { changeSummary: optionalText(500) };

export const areaDraftBody = areaFields
  .partial()
  .extend({ parentId: z.string().min(1).optional(), ...summary });

export const areaClimbDraftBody = climbFields
  .partial()
  .extend({ areaId: z.string().min(1).optional(), ...summary });

const defined = (form: Fields): Fields =>
  Object.fromEntries(Object.entries(form).filter(([, v]) => v !== undefined));

// A draft is the entity with the sent fields laid over it, checked by the same
// rules as creation, so a partial edit cannot leave a climb with a V grade on
// a sport route.
export function areaDraftOf(row: AreaRow, form: Fields): z.infer<typeof areaBody> | null {
  const parsed = areaBody.safeParse({
    parentId: row.parent_id,
    name: row.name,
    description: row.description,
    lat: row.lat,
    lon: row.lon,
    ...defined(form),
  });
  return parsed.success ? parsed.data : null;
}

export function areaClimbDraftOf(
  row: AreaClimbRow,
  form: Fields
): z.infer<typeof areaClimbBody> | null {
  const parsed = areaClimbBody.safeParse({
    areaId: row.area_id,
    name: row.name,
    description: row.description,
    type: row.type,
    gradeScale: row.grade_scale,
    grade: row.grade_value,
    lengthM: row.length_m,
    bolts: row.bolts,
    firstAscent: row.first_ascent,
    ...defined(form),
  });
  return parsed.success ? parsed.data : null;
}

export function areaFieldsOf(a: z.infer<typeof areaBody>): Omit<AreaRevisionWrite, "name_key"> {
  return {
    parent_id: a.parentId,
    name: a.name,
    description: a.description || null,
    lat: a.lat ?? null,
    lon: a.lon ?? null,
  };
}

export function areaClimbFieldsOf(
  c: z.infer<typeof areaClimbBody>
): Omit<AreaClimbRevisionWrite, "name_key"> {
  const { name_key: _key, ...fields } = climbWrite(c);
  return { area_id: c.areaId, ...fields };
}

export type Draft = {
  id: string;
  entity_type: ContentEntity;
  entity_id: string;
  proposed: Fields;
  base: Fields;
  change_summary: string | null;
  created_at: string;
  updated_at: string;
};

export function draftOf(row: RevisionRow): Draft {
  return {
    id: row.id,
    entity_type: row.entity_type,
    entity_id: row.entity_id,
    proposed: JSON.parse(row.proposed_json) as Fields,
    base: JSON.parse(row.base_json) as Fields,
    change_summary: row.change_summary,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export type Conflict = { field: string; base: unknown; proposed: unknown; current: unknown };

// Field by field over what the revision proposes: untouched since the base
// applies, already equal to the proposal is a no-op, anything else conflicts
// unless the moderator picked a value for it.
export function reconcile(
  base: Fields,
  proposed: Fields,
  current: Fields,
  resolutions: Fields = {}
): { apply: Fields; conflicts: Conflict[] } {
  const apply: Fields = {};
  const conflicts: Conflict[] = [];
  for (const [field, value] of Object.entries(proposed)) {
    if (Object.hasOwn(resolutions, field)) apply[field] = resolutions[field];
    else if (base[field] === current[field]) apply[field] = value;
    else if (value !== current[field]) {
      conflicts.push({ field, base: base[field], proposed: value, current: current[field] });
    }
  }
  return { apply, conflicts };
}

export type Revision = Draft & {
  slug: string | null;
  current: Fields | null;
  conflicts: Conflict[];
};

export function revisionOf(row: RevisionRow, entity: AreaRow | AreaClimbRow | null): Revision {
  const draft = draftOf(row);
  const current = entity === null ? null : snapshotOf(row.entity_type, entity);
  return {
    ...draft,
    slug: entity?.slug ?? null,
    current,
    conflicts: current === null ? [] : reconcile(draft.base, draft.proposed, current).conflicts,
  };
}

export type ApprovalProblem = {
  error: string;
  current?: Fields;
  conflicts?: Conflict[];
  version?: number;
};

// The entity must still be live and at the version the moderator reviewed,
// and every conflict resolved; what comes back is what to apply.
export function approvalOf<T extends AreaRow | AreaClimbRow>(
  entity: T | null,
  revision: RevisionRow,
  version: number,
  resolutions: Fields
): { problem: ApprovalProblem } | { entity: T; apply: Fields } {
  if (entity === null || entity.status !== "active")
    return { problem: { error: "no longer live" } };
  const { base, proposed } = draftOf(revision);
  const current = snapshotOf(revision.entity_type, entity);
  if (entity.version !== version) {
    return { problem: { error: "changed since you loaded it", current } };
  }
  const { apply, conflicts } = reconcile(base, proposed, current, resolutions);
  if (conflicts.length > 0) return { problem: { error: "conflicts", conflicts, version } };
  return { entity, apply };
}

export const versionBody = z.object({ version: z.number().int().min(1) });

export const approveRevisionBody = versionBody.extend({
  resolutions: z.record(z.string(), z.unknown()).default({}),
});

export const rejectBody = z.object({ note: optionalText(500) });

export const creationRef = z.object({
  entity_type: z.enum(["area", "climb"]),
  id: z.string().min(1),
  version: z.number().int().min(1),
});

// A reject touches two statements per climb and the free D1 plan allows 50
// queries an invocation, so a larger selection arrives as several requests.
export const BULK_CREATIONS_MAX = 20;

export const bulkCreationsBody = z.object({
  action: z.enum(["approve", "reject"]),
  note: optionalText(500),
  items: z.array(creationRef).min(1).max(BULK_CREATIONS_MAX),
});

export const moveCreationsBody = z.object({
  parentId: z.string().min(1),
  items: z.array(creationRef).min(1).max(BULK_CREATIONS_MAX),
});

export const contentReportBody = z.object({
  entityType: z.enum(["area", "climb"]),
  entityId: z.string().min(1),
  body: z.string().trim().min(1).max(2000),
});

export const duplicateReportBody = z.object({
  keepClimbId: z.string().min(1),
  note: optionalText(500),
});

export const mergeBody = z.object({ swap: z.boolean().default(false) });
