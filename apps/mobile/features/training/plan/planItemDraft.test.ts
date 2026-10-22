import { describe, expect, it } from "@jest/globals";
import type { PlanItem } from "@sendtally/api-client";
import { libraryOf } from "@sendtally/features/workouts";
import { planFromWorkout } from "./planFromWorkout";
import { planItemDraft, planItemOf, planItemShades, planItemSummary } from "./planItemDraft";

const TODAY = "2026-10-01";

const item: PlanItem = {
  id: "p1",
  kind: "climb",
  title: "Limit boulders",
  days: [],
  perWeek: 2,
  start: "2026-09-28",
  end: "2026-10-26",
  skip: ["2026-10-05"],
  minutes: 90,
  targetRpe: 9,
  projectId: "grey-arete",
  template: null,
  workoutId: null,
  blockId: null,
};

describe("plan item drafts", () => {
  it("starts a new plan with the kind's name, on the chosen day, ongoing", () => {
    const draft = planItemDraft({ mode: "new", kind: "strength", days: [3], start: TODAY }, TODAY);
    expect(planItemOf(draft, "n1", [])).toEqual({
      id: "n1",
      kind: "strength",
      title: "Strength session",
      days: [3],
      perWeek: null,
      start: TODAY,
      end: null,
      skip: [],
      minutes: null,
      targetRpe: null,
      projectId: null,
      template: null,
      workoutId: null,
      blockId: null,
    });
    expect(planItemSummary(draft)).toBe("Thu · from Oct 1");
  });

  it("plans a block's member on the block's dates, whatever its own say", () => {
    const block = {
      id: "b1",
      name: "Autumn finger block",
      start: "2026-10-05",
      weeks: 4,
      loads: [{ load: 100 }, { load: 100 }, { load: 100 }, { load: 100 }],
      notes: null,
      endedOn: null,
    };
    const draft = planItemDraft(
      { mode: "new", kind: "strength", days: [3], start: TODAY, blockId: "b1" },
      TODAY
    );
    expect(planItemOf(draft, "n1", [], block)).toMatchObject({
      start: "2026-10-05",
      end: "2026-11-02",
      blockId: "b1",
    });
  });

  it("saves an edited plan unchanged, skips and all", () => {
    const draft = planItemDraft({ mode: "edit", item }, TODAY);
    expect(draft).toMatchObject({ mode: "perWeek", endMode: "weeks", weeks: 4 });
    expect(planItemOf(draft, item.id, item.skip)).toEqual(item);
    expect(planItemSummary(draft)).toBe("2 a week · Sep 28 to Oct 25");
  });

  it("is not a plan without a name or a day, and drops the project off a climb", () => {
    const draft = planItemDraft({ mode: "edit", item }, TODAY);
    expect(planItemOf({ ...draft, title: "  " }, "x", [])).toBeNull();
    expect(planItemSummary({ ...draft, title: "" })).toBe("Give it a name.");
    expect(planItemOf({ ...draft, mode: "days", days: [] }, "x", [])).toBeNull();
    expect(planItemOf({ ...draft, kind: "run" }, "x", [])?.projectId).toBeNull();
  });

  it("shades every day of a weekly goal, and only the set days otherwise", () => {
    const draft = planItemDraft({ mode: "edit", item }, TODAY);
    expect(planItemShades(draft, "2026-09-29")).toBe(true);
    expect(planItemShades(draft, "2026-10-26")).toBe(false);
    expect(planItemShades({ ...draft, mode: "days", days: [0] }, "2026-09-29")).toBe(false);
  });
});

describe("planning a library workout", () => {
  const library = libraryOf([], []);
  const byId = (id: string) => library.find((w) => w.id === id)!;
  const at = { days: [1] as const, start: TODAY };

  it("plans its name, length, effort and body, linked to it", () => {
    const request = planFromWorkout(byId("strength-5x5"), { ...at, days: [1] });
    expect(request.mode).toBe("item");
    if (request.mode !== "item") return;
    const planned = planItemOf(planItemDraft(request.request, TODAY), "n1", []);
    expect(planned).toMatchObject({
      kind: "strength",
      title: "5x5 strength",
      days: [1],
      minutes: 45,
      targetRpe: 8,
      workoutId: "strength-5x5",
      template: { kind: "sets" },
    });
  });

  it("plans a climbing workout's project and no template", () => {
    const limit = {
      ...byId("climb-limit"),
      body: { kind: "climb" as const, focus: "project" as const, projectId: "grey-arete" },
    };
    const request = planFromWorkout(limit, { ...at, days: [1] });
    if (request.mode !== "item") throw new Error("not a plan item");
    expect(planItemOf(planItemDraft(request.request, TODAY), "n1", [])).toMatchObject({
      kind: "climb",
      projectId: "grey-arete",
      template: null,
      workoutId: "climb-limit",
    });
  });

  it("hands a hangboard workout to the hangboard planner", () => {
    const hang = { ...byId("strength-5x5"), id: "rep73", category: "hang" as const };
    expect(planFromWorkout(hang, { days: [2], start: TODAY, blockId: "b1" })).toEqual({
      mode: "hang",
      request: {
        mode: "new",
        workoutId: "rep73",
        gripId: null,
        days: [2],
        start: TODAY,
        blockId: "b1",
      },
    });
  });

  it("keeps the workout an existing plan runs", () => {
    const linked = { ...item, kind: "strength" as const, projectId: null, workoutId: "w1" };
    expect(planItemDraft({ mode: "edit", item: linked }, TODAY).workoutId).toBe("w1");
  });
});
