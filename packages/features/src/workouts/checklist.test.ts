import { describe, expect, it } from "vitest";
import { bodyHeading, checklistLine, checklistTitle, itemDoseText, itemTitle } from "./checklist";

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
