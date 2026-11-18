import { afterEach, describe, expect, it } from "vitest";
import { isChecklist } from "@sendtally/core/hang";
import { setLocale } from "../i18n";
import {
  bodyHeading,
  checklistLine,
  checklistTitle,
  itemDoseText,
  itemTitle,
  runItems,
} from "./checklist";

afterEach(() => setLocale("en"));

describe("a checklist's progress", () => {
  it("reads as how many lines are ticked of how many", () => {
    expect(checklistLine(2, 3)).toBe("2 of 3");
    expect(checklistTitle(4, 5)).toBe("Checklist · 4 of 5");
  });
});

describe("a checklist as a workout's item", () => {
  it("reads as Checklist and its count of lines, an exercise as its name and dose", () => {
    const list = {
      exercise: "Checklist",
      dose: { sets: 2 },
      checklist: { lines: ["Jog", "Hang"] },
    };
    expect(itemTitle(list)).toBe("Checklist");
    expect(itemDoseText("strength", list, "kg")).toBe("2 lines");
    const rows = { exercise: "Row", dose: { sets: 3, reps: 8 } };
    expect(itemTitle(rows)).toBe("Row");
    expect(itemDoseText("strength", rows, "kg")).toBe("3 × 8");
  });
});

describe("a workout body's heading", () => {
  it("says In this workout once a checklist is in it, as a checklist is not an exercise", () => {
    expect(bodyHeading([{}])).toBe("Exercises");
    expect(bodyHeading([{}, { checklist: { lines: ["Jog"] } }])).toBe("In this workout");
  });
});

describe("an item's title wherever it is named", () => {
  it("names a checklist in the reader's language, and anything else by the name it is given", () => {
    setLocale("de");
    expect(itemTitle({ exercise: "Checklist", checklist: { lines: ["Jog"] } })).toBe("Checkliste");
    expect(itemTitle({ exercise: "Pull-ups" }, (e) => `my ${e}`)).toBe("my Pull-ups");
  });
});

describe("a run's items handed to the exercise picker", () => {
  it("keeps a checklist a checklist, so the picker can leave it out", () => {
    const list = { exercise: "Checklist", dose: { sets: 1 }, checklist: { lines: ["Jog"] } };
    const row = { exercise: "Row", dose: { sets: 3, reps: 8 } };
    expect(runItems([list, row]).map(isChecklist)).toEqual([true, false]);
    expect(runItems([row])).toEqual([{ exercise: "Row", doses: [{ sets: 3, reps: 8 }] }]);
  });
});
