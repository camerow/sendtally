import { describe, expect, it } from "vitest";
import type { AreaClimb, AreaSummary, ClimbSummary } from "@sendtally/api-client";
import { areaChoice, climbSuggestions, isNewClimb, placeOf } from "./addClimb";

const mine = (name: string, sessions = 2): ClimbSummary =>
  ({ id: `m-${name}`, name, sessions }) as unknown as ClimbSummary;

const inAreas = (name: string, grade: string | null): AreaClimb =>
  ({ id: `a-${name}`, name, grade_value: grade }) as unknown as AreaClimb;

const area = (name: string): AreaSummary => ({ id: `c-${name}`, name }) as unknown as AreaSummary;

describe("climbSuggestions", () => {
  const found = [inAreas("Pocket Rocket", "6B+"), inAreas("Pocket Rocks Arete", null)];

  it("offers the area's climbs with their grade first, then the user's own", () => {
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

describe("areaChoice", () => {
  const found = [area("Burbage South"), area("Stanage Popular")];

  it("keeps the area picked", () => {
    const picked = { id: "x", name: "Stanage Popular" };
    expect(areaChoice("Stanage Popular", picked, found)).toEqual({ kind: "area", area: picked });
  });

  it("takes an Areas area typed out in full without a tap", () => {
    expect(areaChoice("burbage south", null, found)).toEqual({
      kind: "area",
      area: { id: "c-Burbage South", name: "Burbage South" },
    });
  });

  it("keeps an area that is not found as typed, to add on save", () => {
    expect(areaChoice(" Burbage Valley North ", null, found)).toEqual({
      kind: "new",
      name: "Burbage Valley North",
    });
    expect(areaChoice(" ", null, found)).toBeNull();
  });
});

describe("placeOf", () => {
  const api = () => {
    const sent: unknown[] = [];
    return {
      sent,
      createArea: (input: unknown) => {
        sent.push(input);
        return Promise.resolve({ area: { id: "new-1", name: "Burbage Valley North" } as never });
      },
    };
  };

  it("adds a new area at the top level, with no parent and no second prompt", async () => {
    const fake = api();
    expect(await placeOf(fake, { kind: "new", name: "Burbage Valley North" })).toEqual({
      id: "new-1",
      name: "Burbage Valley North",
    });
    expect(fake.sent).toEqual([{ name: "Burbage Valley North", confirmedNew: true }]);
  });

  it("adds nothing for an area already in Areas, or none at all", async () => {
    const fake = api();
    const picked = { id: "x", name: "Stanage Popular" };
    expect(await placeOf(fake, { kind: "area", area: picked })).toBe(picked);
    expect(await placeOf(fake, null)).toBeNull();
    expect(fake.sent).toEqual([]);
  });
});
