import { describe, expect, it } from "vitest";
import { finishSummary, tallyStep, type TallySelection } from "./tallySelection";
import { tallyDraft, type TallyChoice } from "./tally";

const NOW = new Date(2026, 10, 12, 18, 0);
const grade = (chip: string): TallyChoice => ({ kind: "grade", scale: "v", grade: chip });

describe("tallyStep", () => {
  it("starts a climb from a pending grade, keeping it selected after a fall", () => {
    const start = tallyDraft(NOW);
    const fell = tallyStep(start, { kind: "pending", chip: "V4" }, "fell", grade, null)!;
    const key = fell.draft.climbs[0]!.key;
    expect(fell.selection).toEqual({ kind: "row", key });
    expect(fell.undo).toMatchObject({ id: 1, message: "Fell on V4", draft: start });

    const sent = tallyStep(fell.draft, fell.selection, "sent", grade, fell.undo)!;
    expect(sent.selection).toBeNull();
    expect(sent.draft.climbs[0]).toMatchObject({ kind: "send", tries: 2 });
    expect(sent.undo).toMatchObject({ id: 2, message: "Sent V4", selection: fell.selection });
  });

  it("lets go of a pending grade once it is sent", () => {
    const sent = tallyStep(tallyDraft(NOW), { kind: "pending", chip: "V2" }, "sent", grade, null)!;
    expect(sent.selection).toBeNull();
    expect(sent.draft.climbs[0]).toMatchObject({ kind: "send", style: "flash" });
  });

  it("does nothing with no selection, a missing row or an unknown chip", () => {
    const draft = tallyDraft(NOW);
    const missing: TallySelection = { kind: "row", key: "nope" };
    expect(tallyStep(draft, null, "fell", grade, null)).toBeNull();
    expect(tallyStep(draft, missing, "fell", grade, null)).toBeNull();
    expect(tallyStep(draft, { kind: "pending", chip: "x" }, "fell", () => null, null)).toBeNull();
  });
});

describe("finishSummary", () => {
  it("says the time, the sends and the hardest one", () => {
    const one = tallyStep(tallyDraft(NOW), { kind: "pending", chip: "V3" }, "sent", grade, null)!;
    const two = tallyStep(one.draft, { kind: "pending", chip: "V5" }, "sent", grade, null)!;
    expect(finishSummary(two.draft, 80)).toBe("1h 20m · 2 sent · top V5");
    expect(finishSummary(tallyDraft(NOW), 5)).toBe("5m · 0 sent");
  });
});
