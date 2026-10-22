import { describe, expect, it } from "@jest/globals";
import type { PlanItem } from "@sendtally/api-client";
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
    });
    expect(planItemSummary(draft)).toBe("Thu · from Oct 1");
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
