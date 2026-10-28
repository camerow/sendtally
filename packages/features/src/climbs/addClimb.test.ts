import { describe, expect, it } from "vitest";
import type { AreaClimb, AreaSummary, ClimbSummary } from "@sendtally/api-client";
import { climbSuggestions, cragChoice, isNewClimb } from "./addClimb";

const mine = (name: string, sessions = 2): ClimbSummary =>
  ({ id: `m-${name}`, name, sessions }) as unknown as ClimbSummary;

const inAreas = (name: string, grade: string | null): AreaClimb =>
  ({ id: `a-${name}`, name, grade_value: grade }) as unknown as AreaClimb;

const crag = (name: string): AreaSummary => ({ id: `c-${name}`, name }) as unknown as AreaSummary;

describe("climbSuggestions", () => {
  const found = [inAreas("Pocket Rocket", "6B+"), inAreas("Pocket Rocks Arete", null)];

  it("offers the crag's climbs with their grade first, then the user's own", () => {
    const own = [mine("Pocket Rockets Arête"), mine("pocket rocket"), mine("Other")];
    expect(
      climbSuggestions("pocket rock", own, found, "Stanage").map((s) => [s.kind, s.name, s.meta])
    ).toEqual([
      ["areas", "Pocket Rocket", "6B+ · Stanage"],
      ["areas", "Pocket Rocks Arete", "Stanage"],
      ["mine", "Pocket Rockets Arête", "Yours · 2 days"],
    ]);
  });

  it("offers nothing before anything is typed", () => {
    expect(climbSuggestions("  ", [mine("A")], found, null)).toEqual([]);
  });
});

describe("isNewClimb", () => {
  it("is new only when neither Areas nor the user has the name", () => {
    expect(isNewClimb("The Ramp", [mine("Other")], [inAreas("Ramp Left", null)])).toBe(true);
    expect(isNewClimb(" the ramp ", [mine("The Ramp")], [])).toBe(false);
    expect(isNewClimb("The Ramp", [], [inAreas("THE RAMP", "7a")])).toBe(false);
    expect(isNewClimb("", [], [])).toBe(false);
  });
});

describe("cragChoice", () => {
  const found = [crag("Burbage South"), crag("Stanage Popular")];

  it("keeps the crag picked", () => {
    const picked = { id: "x", name: "Stanage Popular" };
    expect(cragChoice("Stanage Popular", picked, found)).toEqual({ kind: "area", area: picked });
  });

  it("takes an Areas crag typed out in full without a tap", () => {
    expect(cragChoice("burbage south", null, found)).toEqual({
      kind: "area",
      area: { id: "c-Burbage South", name: "Burbage South" },
    });
  });

  it("keeps a crag that is not found as typed, to add on save", () => {
    expect(cragChoice(" Burbage Valley North ", null, found)).toEqual({
      kind: "new",
      name: "Burbage Valley North",
    });
    expect(cragChoice(" ", null, found)).toBeNull();
  });
});
