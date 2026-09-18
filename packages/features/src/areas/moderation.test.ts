import { describe, expect, it } from "vitest";
import type { RevisionItem } from "@sendtally/api-client";
import { diffRows, resolutionsOf, revisionVersion } from "./moderation";

const revision = {
  id: "r1",
  entity_type: "climb",
  entity_id: "c1",
  slug: "the-mandala",
  change_summary: null,
  created_at: "2026-09-01T00:00:00Z",
  updated_at: "2026-09-01T00:00:00Z",
  base: { name: "Mandala", grade_value: "V12", type: "boulder", bolts: null, version: 3 },
  proposed: { name: "The Mandala", grade_value: "V11", type: "sport" },
  current: { name: "Mandala", grade_value: "V13", type: "boulder", bolts: null, version: 4 },
  conflicts: [{ field: "grade_value", base: "V12", proposed: "V11", current: "V13" }],
} as unknown as RevisionItem;

describe("diffRows", () => {
  it("lists each proposed field with before, proposed and now, flagging conflicts", () => {
    expect(diffRows(revision)).toEqual([
      {
        field: "name",
        label: "Name",
        before: "Mandala",
        proposed: "The Mandala",
        now: "Mandala",
        conflict: false,
      },
      {
        field: "grade_value",
        label: "Grade",
        before: "V12",
        proposed: "V11",
        now: "V13",
        conflict: true,
      },
      {
        field: "type",
        label: "Type",
        before: "Boulder",
        proposed: "Sport",
        now: "Boulder",
        conflict: false,
      },
    ]);
  });

  it("shows a dash for now when the entity is gone", () => {
    expect(diffRows({ ...revision, current: null }).map((r) => r.now)).toEqual(["-", "-", "-"]);
  });
});

describe("resolutionsOf", () => {
  it("waits for a pick on every conflict", () => {
    expect(resolutionsOf(revision, {})).toBeNull();
  });

  it("sends the picked side's raw value per conflicting field", () => {
    expect(resolutionsOf(revision, { grade_value: "current" })).toEqual({ grade_value: "V13" });
    expect(resolutionsOf(revision, { grade_value: "proposed" })).toEqual({ grade_value: "V11" });
  });

  it("is empty when nothing conflicts", () => {
    expect(resolutionsOf({ ...revision, conflicts: [] }, {})).toEqual({});
  });
});

describe("revisionVersion", () => {
  it("reads the live entity's version", () => {
    expect(revisionVersion(revision)).toBe(4);
    expect(revisionVersion({ ...revision, current: null })).toBeNull();
  });
});
