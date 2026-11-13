import { describe, expect, it } from "vitest";
import sendage from "./fixtures/sendage.csv?raw";
import { summary } from "./fixtures/summary";
import { planImport } from "./plan";

describe("Sendage export", () => {
  it("skips the preamble and reads climbs into sessions by area", () => {
    const plan = planImport(sendage, "UTC");
    expect(plan.format).toBe("sendage");
    expect(plan.issues).toEqual([]);
    expect(summary(plan)).toEqual([
      ["2026-06-08 | Chebucto Head | outdoor", "Tsunami | 8 | send redpoint | 1"],
      ["2026-07-19 | Fontainebleau | outdoor", "La Marie-Rose | 3 | send flash | 1"],
      [
        "2026-07-20 | Fontainebleau | outdoor",
        "Élan | 4 | send flash | 1 | Bas Cuvier, slopey top",
      ],
      ["2026-08-11 | Black Velvet Canyon | outdoor", "The Fixer | 5.13a | send redpoint | 1"],
      [
        "2026-08-12 | Black Velvet Canyon | outdoor",
        "Running Man | 5.10c | send onsight | 1 | Very fun climbing",
      ],
      [
        "2026-09-01 | Smoke Bluffs | outdoor",
        "Rainy Day Women | 5.12a | send redpoint | 1",
        "Penny Lane | 5.10c | send flash | 1 | Great warm up, busy on weekends",
      ],
      [
        "2026-09-02 | Smoke Bluffs | outdoor",
        "Crime of the Century | 5.11b | send onsight | 1 | I\u2019ve never been so pumped",
      ],
      [
        "2026-10-17 | Moe's Valley | outdoor",
        "Indolence | 7 | send | 1",
        'Pork Chop Express | 10 | attempt | 1 | Linked the "crux" from the second move',
      ],
      [
        "2026-10-18 | Moe's Valley | outdoor",
        "Lindners Roof | 9 | send redpoint | 1 | Stuck the start move, finally",
        "Pterodactyl | 1 | send flash | 1",
      ],
    ]);
  });

  const edited = (from: string, to: string): string => sendage.replace(from, to);

  it("decodes comments encoded twice", () => {
    const plan = planImport(edited("I&rsquo;ve", "I&amp;rsquo;ve &#8220;so&#x201D;"), "UTC");
    expect(plan.sessions[6]?.climbs[0]?.note).toBe("I\u2019ve \u201cso\u201d never been so pumped");
  });

  it("reports a send type it does not know on its row in the file", () => {
    const plan = planImport(edited("2026-10-18,flash,", "2026-10-18,toprope,"), "UTC");
    expect(plan.issues).toEqual([
      { row: 7, code: "badKind", value: "toprope", climb: "Pterodactyl" },
    ]);
  });
});
