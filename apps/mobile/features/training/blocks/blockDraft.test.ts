import { describe, expect, it } from "@jest/globals";
import type { TrainingBlock } from "@sendtally/api-client";
import { blockDraft, blockOf, withWeeks } from "./blockDraft";

const TODAY = "2026-10-01";

const block: TrainingBlock = {
  id: "b1",
  name: "Autumn finger block",
  start: "2026-09-28",
  weeks: 4,
  loads: [{ load: 100 }, { load: 110 }, { load: 120, phase: "test" }, { load: 70 }],
  notes: "Max hangs, then a test",
  endedOn: null,
};

describe("block drafts", () => {
  it("starts a new block today, four even weeks with no phase", () => {
    const draft = blockDraft(null, TODAY);
    expect(blockOf(draft, "n1", null)).toEqual({
      id: "n1",
      name: "Finger block",
      start: TODAY,
      weeks: 4,
      loads: [{ load: 100 }, { load: 100 }, { load: 100 }, { load: 100 }],
      notes: null,
      endedOn: null,
    });
  });

  it("saves an edited block unchanged, and lets it start before today", () => {
    const draft = blockDraft(block, TODAY);
    expect(draft.minStart).toBe("2026-09-28");
    expect(blockOf(draft, "b1", null)).toEqual(block);
  });

  it("keeps each week as weeks come and go, new ones at the last load, within range", () => {
    const draft = blockDraft(block, TODAY);
    expect(withWeeks(draft, 5)?.loads).toEqual([...block.loads, { load: 70 }]);
    expect(withWeeks(draft, 2)?.loads).toEqual(block.loads.slice(0, 2));
    expect(withWeeks(draft, 0)).toBeNull();
    expect(withWeeks(draft, 17)).toBeNull();
  });

  it("is no block without a name, and stays ended only while that is inside it", () => {
    expect(blockOf({ ...blockDraft(block, TODAY), name: " " }, "b1", null)).toBeNull();
    const draft = blockDraft(block, TODAY);
    expect(blockOf(draft, "b1", "2026-10-10")?.endedOn).toBe("2026-10-10");
    expect(
      blockOf({ ...draft, weeks: 1, loads: [{ load: 100 }] }, "b1", "2026-10-10")?.endedOn
    ).toBeNull();
  });
});
