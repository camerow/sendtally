import { describe, expect, it } from "vitest";
import { ApiError, type AreaClimb } from "@sendtally/api-client";
import {
  areaFieldsOf,
  breadcrumbOf,
  climbFacts,
  climbFieldsOf,
  climbFormOf,
  conflictCandidates,
  emptyClimbForm,
  withType,
} from "./transforms";

const scales = { boulder: "font", route: "french" } as const;

const mandala: AreaClimb = {
  id: "c1",
  area_id: "a1",
  name: "The Mandala",
  slug: "the-mandala",
  description: null,
  type: "boulder",
  grade_scale: "v",
  grade_value: "V12",
  length_m: null,
  bolts: null,
  first_ascent: "Chris Sharma, 2000",
  status: "active",
  version: 1,
  created_at: "2026-09-18T00:00:00.000Z",
  updated_at: "2026-09-18T00:00:00.000Z",
  mine: false,
};

describe("climbFacts", () => {
  it("lists only what the climb has, the grade in its own scale", () => {
    expect(climbFacts(mandala)).toEqual([
      { label: "Type", value: "Boulder" },
      { label: "Grade", value: "V12" },
      { label: "First ascent", value: "Chris Sharma, 2000" },
    ]);
    const route = { ...mandala, type: "sport", length_m: 25, bolts: 9 } as const;
    expect(climbFacts(route).map((f) => f.value)).toEqual([
      "Sport",
      "V12",
      "25 m",
      "9",
      "Chris Sharma, 2000",
    ]);
  });
});

describe("climb form", () => {
  it("starts on the user's boulder scale and swaps scale only when the type needs it", () => {
    const form = { ...emptyClimbForm(scales), grade: "7A" };
    expect(form.gradeScale).toBe("font");
    const sport = withType(form, "sport", scales);
    expect(sport).toMatchObject({ gradeScale: "french", grade: "" });
    expect(withType({ ...sport, grade: "7a" }, "trad", scales)).toMatchObject({ grade: "7a" });
  });

  it("drops route-only fields from a boulder and blanks to null", () => {
    const fields = climbFieldsOf({
      ...climbFormOf(mandala),
      lengthM: "12",
      bolts: "4",
      description: "  ",
    });
    expect(fields).toMatchObject({ lengthM: null, bolts: null, description: null, grade: "V12" });
  });

  it("lays the caller's draft over the climb", () => {
    const draft = {
      id: "r1",
      entity_type: "climb" as const,
      entity_id: "c1",
      proposed: { grade_value: "V11" },
      base: {},
      change_summary: null,
      created_at: "",
      updated_at: "",
    };
    expect(climbFormOf(mandala, draft)).toMatchObject({ name: "The Mandala", grade: "V11" });
  });
});

describe("areaFieldsOf", () => {
  it("takes decimal commas and refuses half-filled or out-of-range coordinates", () => {
    const base = { name: " Buttermilks ", description: "" };
    expect(areaFieldsOf({ ...base, lat: "37,327", lon: "-118.577" })).toEqual({
      name: "Buttermilks",
      description: null,
      lat: 37.327,
      lon: -118.577,
    });
    expect(areaFieldsOf({ ...base, lat: "", lon: "" })).toMatchObject({ lat: null, lon: null });
    expect(areaFieldsOf({ ...base, lat: "37", lon: "" })).toBeNull();
    expect(areaFieldsOf({ ...base, lat: "91", lon: "0" })).toBeNull();
  });
});

describe("conflictCandidates", () => {
  it("reads candidates from a 409 and nothing else", () => {
    const body = { error: "possible duplicates", candidates: [{ id: "x" }] };
    expect(conflictCandidates(new ApiError(409, "possible duplicates", body))).toEqual([
      { id: "x" },
    ]);
    expect(conflictCandidates(new ApiError(400, "bad", body))).toBeNull();
    expect(conflictCandidates(new Error("offline"))).toBeNull();
  });
});

describe("breadcrumbOf", () => {
  it("orders ancestors from the top", () => {
    const at = (id: string, depth: number) =>
      ({ id, depth }) as unknown as Parameters<typeof breadcrumbOf>[0][number];
    expect(breadcrumbOf([at("b", 2), at("a", 0), at("c", 1)]).map((a) => a.id)).toEqual([
      "a",
      "c",
      "b",
    ]);
  });
});
