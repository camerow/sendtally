import { describe, expect, it } from "vitest";
import eightA from "./fixtures/8a.csv?raw";
import { summary } from "./fixtures/summary";
import { planImport } from "./plan";

const header = eightA.split("\n")[0]!;

describe("8a.nu export", () => {
  it("reads routes and boulders from one file, on the date as written", () => {
    const plan = planImport(eightA, "Pacific/Honolulu");
    expect(plan.format).toBe("8a");
    expect(plan.issues).toEqual([]);
    expect(summary(plan)).toEqual([
      [
        "2023-03-11 | Fontainebleau | outdoor",
        "La Marie-Rose | 6A | send flash | 1 | Classic, polished feet",
        "Élephant | 6B+ | send redpoint | 1",
      ],
      [
        "2023-03-12 |  | outdoor",
        'Rainbow Rocket | 8A | attempt | 1 | Only did the moves, "almost" linked',
      ],
      [
        "2023-07-02 | Hautes-Alpes | outdoor",
        "Biographie | 9a+ | attempt | 1 | Projecting",
        "Berlin | 7a+ | send onsight | 1",
      ],
      [
        "2023-07-03 | Hautes-Alpes | outdoor",
        "La Femme Blanche | 8a+ | send redpoint | 1 | Second day,\nclipped the chains in the rain",
      ],
      ["2023-10-21 |  | outdoor", "Chilam Balam | 6b | send | 1"],
      [
        "2024-02-17 | Ticino | outdoor",
        "Dreamtime | 8B | send redpoint | 1",
        "Le Pied à Coulisse | 6C | send flash | 1",
      ],
      ["2024-05-04 | Frankenjura | outdoor", "Action Directe | 9a | send redpoint | 1"],
      [
        "2024-05-05 | Frankenjura | outdoor",
        "Wallstreet | 8c | send redpoint | 1",
        "Om | 6c+ | send flash | 1",
      ],
      ["2024-09-14 | Yosemite (CA) | outdoor", "Midnight Lightning | 7B | send redpoint | 1"],
      ["2024-11-09 |  | outdoor", "Thriller | 7C | send redpoint | 1"],
    ]);
  });

  it.each([
    [
      "a boulder graded in lower case is Font",
      `"BOULDER","A","B","C","D","FR","2023-01-01T00:00:00Z","f",,,,,,"6c",,,,,`,
      "A | 6C | send flash | 1",
    ],
    [
      "a route graded in upper case is French",
      `"ROUTE","A","B","C","D","FR","2023-01-01T00:00:00Z","rp",,,,,,"7A",,,,,`,
      "A | 7a | send redpoint | 1",
    ],
  ])("%s", (_, row, climb) => {
    expect(summary(planImport(`${header}\n${row}\n`, "UTC"))[0]?.[1]).toBe(climb);
  });

  it("reports an ascent type it does not know", () => {
    const row = `"ROUTE","A","B","C","D","FR","2023-01-01T00:00:00Z","xx",,,,,,"7a",,,,,`;
    const ok = `"ROUTE","E","B","C","D","FR","2023-01-01T00:00:00Z","rp",,,,,,"7a",,,,,`;
    expect(planImport(`${header}\n${row}\n${ok}\n`, "UTC").issues).toEqual([
      { row: 2, code: "badKind", value: "xx", climb: "A" },
    ]);
  });

  it("falls back to the conversion prompt when 8a.nu changes its columns", () => {
    const changed = eightA.replace('"difficulty"', '"grade_label"');
    expect(planImport(changed, "UTC").issues).toEqual([{ row: 1, code: "noHeader" }]);
  });
});
