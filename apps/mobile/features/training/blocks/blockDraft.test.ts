import { describe, expect, it } from "@jest/globals";
import type { TrainingBlock } from "@sendtally/api-client";
import { blockDraft, blockOf, withWeeks } from "./blockDraft";

const TODAY = "2026-10-01";

const block: TrainingBlock = {
  id: "b1",
  name: "Autumn finger block",
  start: "2026-09-28",
  weeks: 4,
  phases: ["build", "build", "test", "deload"],
  notes: "Max hangs, then a test",
  endedOn: null,
};

describe("block drafts", () => {
  it("starts a new block today, four weeks with a closing deload", () => {
    const draft = blockDraft(null, TODAY);
    expect(blockOf(draft, "n1", null)).toEqual({
      id: "n1",
      name: "Finger block",
      start: TODAY,
      weeks: 4,
      phases: ["build", "build", "build", "deload"],
      notes: null,
      endedOn: null,
    });
  });

  it("saves an edited block unchanged, and lets it start before today", () => {
    const draft = blockDraft(block, TODAY);
    expect(draft.minStart).toBe("2026-09-28");
    expect(blockOf(draft, "b1", null)).toEqual(block);
  });

  it("keeps each week's phase as weeks come and go, within range", () => {
    const draft = blockDraft(block, TODAY);
    expect(withWeeks(draft, 5)?.phases).toEqual(["build", "build", "test", "deload", "build"]);
    expect(withWeeks(draft, 2)?.phases).toEqual(["build", "build"]);
    expect(withWeeks(draft, 0)).toBeNull();
    expect(withWeeks(draft, 17)).toBeNull();
  });

  it("is no block without a name, and stays ended only while that is inside it", () => {
    expect(blockOf({ ...blockDraft(block, TODAY), name: " " }, "b1", null)).toBeNull();
    const draft = blockDraft(block, TODAY);
    expect(blockOf(draft, "b1", "2026-10-10")?.endedOn).toBe("2026-10-10");
    expect(
      blockOf({ ...draft, weeks: 1, phases: ["build"] }, "b1", "2026-10-10")?.endedOn
    ).toBeNull();
  });
});
