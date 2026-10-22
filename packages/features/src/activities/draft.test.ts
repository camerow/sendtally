import { describe, expect, it } from "vitest";
import {
  activityFromDraft,
  draftFromActivity,
  newActivityDraft,
  parseMinutes,
  stepMinutes,
  trainingLoadLabel,
} from "./draft";

describe("activity drafts", () => {
  it("takes what the route knows and ignores a kind it does not", () => {
    expect(newActivityDraft({ kind: "run", planItemId: "p1" }, "2026-10-22")).toMatchObject({
      kind: "run",
      date: "2026-10-22",
      planItemId: "p1",
    });
    expect(newActivityDraft({ kind: "climb" }, "2026-10-22").kind).toBe("strength");
    expect(newActivityDraft({ minutes: "45" }, "2026-10-22").minutes).toBe(45);
    expect(newActivityDraft({ minutes: "soon" }, "2026-10-22").minutes).toBe(60);
  });

  it("names an untitled activity after its kind and drops empty text", () => {
    const draft = { ...newActivityDraft({ kind: "yoga" }, "2026-10-22"), notes: "  " };
    const activity = activityFromDraft("a1", draft);
    expect(activity).toMatchObject({ id: "a1", title: "Yoga", startTime: null, notes: null });
    expect(draftFromActivity(activity)).toEqual({ ...draft, title: "Yoga", notes: "" });
  });

  it("starts from a plan's template and saves only what was filled in", () => {
    const draft = newActivityDraft({ kind: "mobility" }, "2026-10-22", {
      kind: "checklist",
      items: [{ text: "Cat-cow", dose: "× 10" }],
    });
    expect(draft.detail).toEqual({
      kind: "checklist",
      items: [{ text: "Cat-cow", dose: "× 10", done: false }],
    });
    const blank = { ...draft, detail: { kind: "checklist" as const, items: [] } };
    expect(activityFromDraft("a1", blank).detail).toBeNull();
  });

  it("steps minutes to the next multiple of five and keeps them in range", () => {
    expect(stepMinutes(52, 1)).toBe(55);
    expect(stepMinutes(52, -1)).toBe(50);
    expect(stepMinutes(5, -1)).toBe(1);
    expect(parseMinutes("45")).toBe(45);
    expect(parseMinutes("2000")).toBe(1440);
    expect(parseMinutes("abc")).toBeNull();
    expect(parseMinutes("")).toBeNull();
  });

  it("shows the load only once there is an effort", () => {
    expect(trainingLoadLabel({ minutes: 50, rpe: 7 })).toBe("50 min × 7 = 350");
    expect(trainingLoadLabel({ minutes: 50, rpe: null })).toBeNull();
  });
});
