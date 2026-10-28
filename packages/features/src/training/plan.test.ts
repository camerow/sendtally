import { describe, expect, it } from "vitest";
import type { Plan } from "@sendtally/api-client";
import type { Workout } from "@sendtally/core/hang";
import {
  nextOccurrence,
  occurrencesOn,
  withoutBlock,
  withoutMembership,
  withoutWorkout,
  type LoggedSession,
} from "./plan";

const TODAY = "2026-11-10";

const squat: Workout = {
  id: "squat",
  kind: "strength",
  name: "Back squat",
  description: "",
  minutes: 45,
  targetRpe: 8,
  items: [
    {
      exercise: "Back squat",
      doses: [
        { sets: 5, reps: 5, weightKg: 100 },
        { sets: 3, reps: 10, weightKg: 75 },
      ],
    },
  ],
  exerciseRestS: 180,
  focus: null,
};

const climbing: Workout = {
  ...squat,
  id: "limit",
  kind: "climbing",
  items: [],
};

const plan: Plan = {
  blocks: [{ id: "b1", name: "Winter base", start: "2026-11-02", weeks: 6, focus: null }],
  memberships: [
    // Tuesdays and Fridays.
    { id: "m1", workoutId: "squat", blockId: "b1", weekdays: [1, 4], start: "2026-11-02" },
    { id: "m2", workoutId: "limit", blockId: null, weekdays: [2], start: "2026-11-02" },
    { id: "once", workoutId: "squat", blockId: null, weekdays: [], start: "2026-11-12" },
  ],
  weekChanges: [
    { membershipId: "m1", week: 2, dose: 1, item: 0, change: { weightKg: 80 } },
    { membershipId: "m1", week: 3, dose: 0, item: 0, change: { sets: 3, weightKg: 95 } },
  ],
};

const workout = (id: string): Workout | undefined =>
  id === "squat" ? squat : id === "limit" ? climbing : undefined;

const logged = (over: Partial<LoggedSession> & Pick<LoggedSession, "date">): LoggedSession => ({
  kind: "strength",
  workoutId: null,
  membershipId: "m1",
  ...over,
});

const on = (date: string, sessions: LoggedSession[] = []) =>
  occurrencesOn(plan, workout, sessions, date, TODAY).map((o) => ({
    id: o.membership.id,
    week: o.week,
    session: o.session,
    status: o.status,
    dose: o.items[0]?.dose,
  }));

describe("occurrencesOn", () => {
  it("lists what lands on a day with the week it falls in and its prescription", () => {
    expect(on("2026-11-10")).toEqual([
      {
        id: "m1",
        week: 2,
        session: 0,
        status: "planned",
        dose: { sets: 5, reps: 5, weightKg: 100 },
      },
    ]);
  });

  it("counts the workout's sessions, each open day before taking one", () => {
    const sessions = [logged({ date: "2026-11-03" })];
    expect(on("2026-11-10", sessions).map((o) => o.session)).toEqual([1]);
    expect(on("2026-11-13", sessions)[0]).toMatchObject({ session: 2, week: 2 });
    expect(on("2026-11-17", sessions)[0]).toMatchObject({
      session: 3,
      week: 3,
      dose: { sets: 3, reps: 10, weightKg: 75 },
    });
  });

  it("counts a session of the workout run outside the plan", () => {
    const own = logged({ date: "2026-11-05", membershipId: null, workoutId: "squat" });
    const other = logged({ date: "2026-11-05", membershipId: null, workoutId: "deadlift" });
    expect(on("2026-11-10", [own, other])[0]).toMatchObject({ session: 1 });
  });

  it("lays the week's change over the dose it names", () => {
    const sessions = [logged({ date: "2026-11-06" })];
    expect(on("2026-11-10", sessions)[0]).toMatchObject({
      session: 1,
      dose: { sets: 3, reps: 10, weightKg: 80 },
    });
  });

  it("keeps a missed day's dose for the next session", () => {
    expect(on("2026-11-06")[0]).toMatchObject({ status: "missed", session: 0 });
    expect(on("2026-11-10")[0]).toMatchObject({ status: "planned", session: 0 });
  });

  it("is done by a session logged against it, counted from the ones before it", () => {
    const sessions = [logged({ date: "2026-11-03" }), logged({ date: "2026-11-06" })];
    expect(on("2026-11-06", sessions)[0]).toMatchObject({ status: "done", session: 1 });
  });

  it("is done by a session of its kind logged on its own that day, and not by another plan's", () => {
    const climb = { kind: "climbing" as const, membershipId: null };
    expect(on("2026-11-04", [logged({ ...climb, date: "2026-11-04" })])[0]?.status).toBe("done");
    const otherPlan = logged({ ...climb, date: "2026-11-04", membershipId: "m9" });
    expect(on("2026-11-04", [otherPlan])[0]?.status).toBe("missed");
  });

  it("runs a membership with no block as written, and a one-off on its day alone", () => {
    expect(on("2026-11-12")).toEqual([
      {
        id: "once",
        week: null,
        session: 0,
        status: "planned",
        dose: { sets: 5, reps: 5, weightKg: 100 },
      },
    ]);
    expect(on("2026-11-19")).toEqual([]);
  });

  it("stops a block's memberships at its end and plans nothing for a block that is gone", () => {
    expect(on("2026-12-15").map((o) => o.id)).toEqual([]);
    const orphan = { ...plan, blocks: [] };
    expect(occurrencesOn(orphan, workout, [], "2026-11-10", TODAY)).toEqual([]);
  });
});

describe("nextOccurrence", () => {
  it("finds the next open day and what it prescribes", () => {
    const m1 = plan.memberships[0]!;
    const next = nextOccurrence(plan, m1, workout, [logged({ date: TODAY })], TODAY);
    expect(next).toMatchObject({ date: "2026-11-13", session: 1, week: 2 });
  });
});

describe("cache edits", () => {
  it("takes a deleted workout out of every block with its week changes", () => {
    expect(withoutWorkout(plan, "squat")).toEqual({
      blocks: plan.blocks,
      memberships: [plan.memberships[1]],
      weekChanges: [],
    });
  });

  it("takes a deleted block's memberships with it", () => {
    expect(withoutBlock(plan, "b1")).toEqual({
      blocks: [],
      memberships: plan.memberships.slice(1),
      weekChanges: [],
    });
  });

  it("takes a deleted membership's week changes with it", () => {
    expect(withoutMembership(plan, "m1").weekChanges).toEqual([]);
    expect(withoutMembership(plan, "m2").weekChanges).toEqual(plan.weekChanges);
  });
});
