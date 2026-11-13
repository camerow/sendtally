import { describe, expect, it } from "vitest";
import theCrag from "./fixtures/thecrag.csv?raw";
import { summary } from "./fixtures/summary";
import { planImport } from "./plan";

describe("theCrag logbook export", () => {
  it("reads ascents into outdoor sessions by crag", () => {
    const plan = planImport(theCrag, "UTC");
    expect(plan.format).toBe("theCrag");
    expect(plan.issues).toEqual([
      { row: 2, code: "unknownGrade", value: "24", climb: "Taipan Wall Classic" },
      { row: 3, code: "unknownGrade", value: "28", climb: "Serpentine" },
      { row: 4, code: "unknownGrade", value: "29", climb: "Serpentine" },
      { row: 11, code: "unknownGrade", value: "VS 4c", climb: "Valkyrie" },
      { row: 12, code: "unknownGrade", value: "E1 5a", climb: "Three Pebble Slab" },
      { row: 13, code: "noDate", climb: "Royal Arches" },
      { row: 15, code: "unknownGrade", value: "VI", climb: "Kleine Zinne Nordwand" },
    ]);
    expect(summary(plan)).toEqual([
      ["2025-04-19 | Grampians | outdoor", "The Wave | 3 | send flash | 1"],
      [
        "2025-09-14 | Can Boquet | outdoor",
        "Nando | 6A+ | send | 1",
        "Los mariachis | 6B | attempt | 1 | Couldn't do the heel hook, back next week",
      ],
      [
        "2025-10-04 | Siurana | outdoor",
        "La Rambla | 9a+ | attempt | 1",
        "Trigonometeria | 6a+ | send onsight | 1",
      ],
      ["2025-11-02 | Sharma Climbing BCN Gavá | outdoor", "73.1 black | 7b | send | 1"],
      ["2026-05-02 | Yosemite Valley | outdoor", "Midnight Lightning | 8 | attempt | 1"],
    ]);
  });

  const header = theCrag.split("\n")[0]!;
  const ascent = (type: string, route = "Biographie", comment = ""): string =>
    `${route},,1,,${type},,8a,Sport,Sport,,,1,,${route},,France,,Céüse,,Céüse,,${comment},,2025-07-02T00:00:00Z,,`;

  it.each([
    ["attempts then a red point", ["Hang dog", "Attempt", "Red point"], "send redpoint | 3"],
    ["a flash after a fall", ["Attempt", "Flash"], "send redpoint | 2"],
    ["only attempts", ["Working", "Hang dog"], "attempt | 2"],
  ])("folds one route's rows on one day: %s", (_, types, climb) => {
    const text = [header, ...types.map((t) => ascent(t))].join("\n");
    expect(summary(planImport(text, "UTC"))[0]?.[1]).toBe(`Biographie | 8a | ${climb}`);
  });

  it("reports an ascent type it does not know", () => {
    const text = [header, ascent("Ghost"), ascent("Onsight", "Berlin")].join("\n");
    expect(planImport(text, "UTC").issues).toEqual([
      { row: 2, code: "badKind", value: "Ghost", climb: "Biographie" },
    ]);
  });
});
