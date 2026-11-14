import { describe, expect, it } from "vitest";
import mountainProject from "./fixtures/mountain-project.csv?raw";
import { summary } from "./fixtures/summary";
import { planImport } from "./plan";

describe("Mountain Project tick export", () => {
  it("reads ticks into outdoor sessions named after the area they share", () => {
    const plan = planImport(mountainProject, "UTC");
    expect(plan.format).toBe("mountainProject");
    expect(plan.issues).toEqual([
      { row: 5, code: "unknownGrade", value: "5.4", climb: "Tipsy Trees" },
    ]);
    expect(summary(plan)).toEqual([
      [
        "2025-03-15 | Wall of the Ancients | outdoor",
        "Weenie Roast | 5.9 | send redpoint | 1",
        "Ruta Única | 5.10a | send | 1 | Bolted, crowded",
      ],
      [
        "2025-04-05 | El Capitan | outdoor",
        'The Nose | 5.14a | send | 1 | El Cap in a day, "almost"',
      ],
      ["2025-05-17 | Matron | outdoor", "Owl Roof | 5.8 | send | 1"],
      [
        "2025-06-01 | The Christian Brothers | outdoor",
        "Outer Space | 5.9 | send redpoint | 1 | Placed gear on the second lap",
      ],
      [
        "2025-07-12 | Smith Rock | outdoor",
        "Chain Reaction | 5.12c | send redpoint | 1 | Third session, sent",
        "Five Gallon Buckets | 5.8 | send | 1",
      ],
      [
        "2025-08-23 | El Potrero Chico | outdoor",
        "Estrellita | 5.10d | send flash | 1",
        "Snott Girl | 5.10c | attempt | 1",
      ],
      [
        "2025-09-06 | The Trapps | outdoor",
        "High Exposure | 5.6 | send onsight | 1 | Classic, airy, perfect day",
      ],
      [
        "2025-10-17 | Grandpa Peabody | outdoor",
        'Thriller | 10 | attempt | 1 | Fell at the "thank god" jug twice',
      ],
      [
        "2025-10-18 | Columbia Boulder | outdoor",
        "Midnight Lightning | 8 | send | 1 | Finally, the lip traverse went",
        "Bachar Cracker | 4 | send flash | 1",
      ],
    ]);
  });

  const header = mountainProject.split("\n")[0]!;
  const tick = (rating: string, location = "Utah > Moe's Valley"): string =>
    `${header}\n2025-01-01,"A",${rating},,,1,"${location}",,,Send,,Boulder,,,`;

  it.each([
    ["V3-4", 3],
    ["5.10a/b", "5.10a"],
    ["5.11c R", "5.11c"],
    ["V5+", 5],
  ])("reads the grade %s as %s", (rating, grade) => {
    expect(planImport(tick(rating), "UTC").sessions[0]?.climbs[0]?.grade.value).toBe(grade);
  });

  it("never names a session after just a state", () => {
    const text = `${tick("V3")}\n2025-01-01,"B",V4,,,1,"Utah > Joe's Valley",,,Send,,Boulder,,,`;
    expect(planImport(text, "UTC").sessions[0]?.name).toBeUndefined();
  });
});
