import { describe, expect, it } from "vitest";
import type { ClimbSummary } from "@sendtally/api-client";
import type { ClimbDraft } from "../log-session/types";
import {
  canAddToAreas,
  climbFormFromDraft,
  climbOptions,
  atCrumb,
  cragsOf,
  isInside,
  pickedArea,
  pickedInside,
  stepUp,
  withAreaClimb,
  withTypedName,
} from "./logForm";
import type { AreaClimb, AreaHit, AreaSummary } from "./types";

const own = (name: string, project = false): ClimbSummary =>
  ({ name, slug: name.toLowerCase(), project, grade: null }) as ClimbSummary;

const areaClimb = (
  id: string,
  name: string,
  grade: Partial<Pick<AreaClimb, "grade_scale" | "grade_value">> = {}
): AreaClimb =>
  ({ id, name, slug: id, grade_scale: "v", grade_value: null, ...grade }) as AreaClimb;

const row: ClimbDraft = {
  key: "climb-1",
  scale: "v",
  grade: "V3",
  name: "",
  kind: "send",
  style: "redpoint",
  tries: 1,
  note: "",
};

describe("climbOptions", () => {
  it("offers an own climb that is in Areas as the Areas climb, keeping its place and flag", () => {
    const options = climbOptions(
      [own("Dread", true), own("Cryosphere")],
      [areaClimb("c2", "Mandala"), areaClimb("c1", "dread")]
    );
    expect(options.map((o) => [o.kind, o.climb.name])).toEqual([
      ["areas", "dread"],
      ["mine", "Cryosphere"],
      ["areas", "Mandala"],
    ]);
    expect(options[0]).toMatchObject({ project: true, logged: true });
    expect(options[2]).toMatchObject({ project: false, logged: false });
  });

  it("leaves out the climb the row is already linked to", () => {
    expect(climbOptions([], [areaClimb("c1", "Mandala")], "c1")).toEqual([]);
  });
});

describe("canAddToAreas", () => {
  it("offers a typed name Areas does not have", () => {
    expect(canAddToAreas("Pinch Me", [areaClimb("c1", "Mandala")])).toBe(true);
    expect(canAddToAreas(" mandala ", [areaClimb("c1", "Mandala")])).toBe(false);
    expect(canAddToAreas("  ", [])).toBe(false);
  });
});

describe("cragsOf", () => {
  it("drops regions", () => {
    const areas = [
      { id: "r", region_code: "US-CA" },
      { id: "b", region_code: null },
    ] as AreaSummary[];
    expect(cragsOf(areas).map((a) => a.id)).toEqual(["b"]);
  });
});

describe("withAreaClimb", () => {
  it("links the row and takes the grade in the row's scale", () => {
    const picked = withAreaClimb(
      { ...row, scale: "font", grade: "6A" },
      areaClimb("c1", "Mandala", { grade_value: "V12" })
    );
    expect(picked).toMatchObject({ name: "Mandala", climbId: "c1", scale: "font", grade: "8A+" });
  });

  it("switches discipline when the climb is a route", () => {
    const picked = withAreaClimb(
      row,
      areaClimb("c1", "Separate Reality", { grade_scale: "yds", grade_value: "5.11d" })
    );
    expect(picked).toMatchObject({ scale: "yds", grade: "5.11d" });
  });

  it("keeps the row's grade when the climb has none", () => {
    expect(withAreaClimb(row, areaClimb("c1", "Mandala")).grade).toBe("V3");
  });
});

describe("withTypedName", () => {
  it("unlinks the row", () => {
    const typed = withTypedName({ ...row, name: "Mandala", climbId: "c1" }, "Mandala sit");
    expect(typed.name).toBe("Mandala sit");
    expect(typed).not.toHaveProperty("climbId");
  });
});

describe("climbFormFromDraft", () => {
  it("prefills the name, discipline and grade from the row", () => {
    const scales = { boulder: "v", route: "yds" } as const;
    expect(climbFormFromDraft({ ...row, name: " Pinch Me " }, scales)).toMatchObject({
      name: "Pinch Me",
      type: "boulder",
      gradeScale: "v",
      grade: "V3",
    });
    expect(climbFormFromDraft({ ...row, scale: "french", grade: "7a" }, scales)).toMatchObject({
      type: "sport",
      gradeScale: "french",
      grade: "7a",
    });
  });
});

const summary = (id: string, name: string, region = false): AreaSummary =>
  ({ id, name, region_code: region ? id.toUpperCase() : null }) as AreaSummary;

describe("picked area paths", () => {
  const hit: AreaHit = {
    ...summary("pb", "Peabody Boulders"),
    ancestors: [
      summary("us", "United States", true),
      summary("bishop", "Bishop"),
      summary("bm", "Buttermilks"),
    ],
  };

  it("keeps regions out of the trail", () => {
    expect(pickedArea(hit)).toEqual({
      id: "pb",
      name: "Peabody Boulders",
      region: false,
      trail: [
        { id: "bishop", name: "Bishop" },
        { id: "bm", name: "Buttermilks" },
      ],
    });
  });

  it("steps up one chip at a time and stops at the top", () => {
    const up = stepUp(pickedArea(hit));
    expect(up).toEqual({
      id: "bm",
      name: "Buttermilks",
      region: false,
      trail: [{ id: "bishop", name: "Bishop" }],
    });
    expect(stepUp(atCrumb(pickedArea(hit), 0))).toBeNull();
    expect(stepUp({ id: "legacy", name: "Old draft" })).toBeNull();
  });

  it("places a new area under the one it was added inside, never under a region", () => {
    expect(pickedInside(pickedArea(hit), { id: "gp", name: "Grandpa Peabody" }).trail).toEqual([
      { id: "bishop", name: "Bishop" },
      { id: "bm", name: "Buttermilks" },
      { id: "pb", name: "Peabody Boulders" },
    ]);
    const region = { id: "us-ca", name: "California", region: true };
    expect(pickedInside(region, { id: "bishop", name: "Bishop" }).trail).toEqual([]);
  });

  it("knows a hit inside the picked area", () => {
    expect(isInside(hit, { id: "bm", name: "Buttermilks" })).toBe(true);
    expect(isInside(hit, { id: "sq", name: "Squamish" })).toBe(false);
    expect(isInside(hit, null)).toBe(false);
  });
});
