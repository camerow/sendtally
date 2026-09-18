import { disciplineOf, isLikelyDuplicate, parseGrade } from "@sendtally/core";
import { z } from "zod";
import type { AreaClimbEdit, AreaClimbRow, AreaRow, Box, UserRow } from "./repo";
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

export type AreaClimb = Omit<AreaClimbRow, "created_by" | "name_key" | "merged_into_id"> & {
  mine: boolean;
};

export function areaClimbOf(row: AreaClimbRow, viewer: Viewer): AreaClimb {
  const { created_by, name_key: _key, merged_into_id: _merged, ...rest } = row;
  return { ...rest, mine: created_by === viewer.id };
}
