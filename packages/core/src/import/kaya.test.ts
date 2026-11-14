import { describe, expect, it } from "vitest";
import kaya from "./fixtures/kaya.csv?raw";
import { summary } from "./fixtures/summary";
import { planImport } from "./plan";

describe("Kaya export", () => {
  it("reads a real export's layout into sessions on the local date", () => {
    const plan = planImport(kaya, "America/Los_Angeles");
    expect(plan.format).toBe("kaya");
    expect(plan.issues).toEqual([]);
    expect(summary(plan)).toEqual([
      [
        "2023-03-04 |  | outdoor",
        "Pterodactyl | 3 | send flash | 1",
        "Monkey Bar Right | 6 | send redpoint | 6",
        "Crimp, Crimp, Slap | 4 | send redpoint | 1",
      ],
      [
        "2023-03-05 |  | outdoor",
        "Running Man | 5.10c | send onsight | 1",
        'The "Fixer" Arête | 5.12a | send redpoint | 3',
      ],
      [
        "2023-04-14 | Vital Murrieta | indoor",
        " | 2 | send redpoint | 1",
        " | 4 | send | 1",
        " | 1 | send flash | 1",
      ],
      [
        "2023-07-22 |  | outdoor",
        "Lost Tribe | 5 | send flash | 1",
        "Black Slabbath | 7 | send redpoint | 12",
      ],
      ["2023-07-23 |  | outdoor", "Crime of the Century | 5.11b | send onsight | 1"],
      ["2023-09-09 |  | outdoor", "Pterodactyl Roof | 4 | send | 1"],
      ["2023-10-14 |  | outdoor", "Lindners Roof | 9 | send redpoint | 28"],
      ["2023-10-15 |  | outdoor", "Éclair au Chocolat | 0 | send flash | 1"],
    ]);
  });

  it("takes the day from the browser's time zone", () => {
    const dates = (tz: string): string[] => planImport(kaya, tz).sessions.map((s) => s.date);
    expect(dates("UTC")).toContain("2023-03-04");
    expect(dates("Pacific/Honolulu")).toContain("2023-04-13");
  });
});
