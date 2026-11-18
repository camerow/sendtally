import { describe, expect, it } from "vitest";
import { protocolOf, startWorkoutRun, tick } from "@sendtally/core/hang";
import type { HangPart } from "@sendtally/api-client";
import {
  discardRunBody,
  loggedPartForm,
  livePartForm,
  partBody,
  partEnded,
  partHangs,
  partPlaces,
  partPlanned,
  partRows,
  partSetLine,
  partTotal,
} from "./fingersPart";
import { liveRunSummary, type LiveRun, type RunState } from "./liveRun";
import type { WorkoutRun } from "./runParams";
import type { PlannedRun } from "./usePlannedRun";

const half = { exercise: "half", dose: { sets: 2, reps: 3, onS: 7, offS: 3, setRestS: 60 } };
const open = { exercise: "open", dose: { sets: 1, reps: 2, onS: 10, offS: 0 } };
const pulls = { exercise: "Pull-ups", dose: { sets: 3, reps: 6 } };
const run: WorkoutRun = {
  kind: "strength",
  title: "Fingers and pull",
  date: "2026-11-17",
  workoutId: "w1",
  link: { membershipId: null, week: null, focus: null },
  minutes: 50,
  exerciseRestS: 120,
  items: [half, open, pulls],
};
const isGrip = (e: string): boolean => e === "half" || e === "open";
const model = { setup: () => ({ edgeMm: 20, loadKg: 0 }), gripName: (id: string) => id };
const setups = [
  { edgeMm: 20, loadKg: 5 },
  { edgeMm: 20, loadKg: 10 },
];

describe("a mix's fingerboard part", () => {
  const places = partPlaces(run.items, isGrip);
  const planned = partPlanned(run, places);

  it("is its grips in order, each on its own dose, and nothing without grips", () => {
    expect(places).toEqual([0, 1]);
    expect(planned?.items.map((i) => [i.workout.grip, i.workout.reps, i.workout.sets])).toEqual([
      ["half", 3, 2],
      ["open", 2, 1],
    ]);
    expect(partTotal(planned!)).toBe(8);
    expect(partPlanned(run, partPlaces([pulls], isGrip))).toBeNull();
  });

  it("opens its held sets as rows when its timer ends, a set never reached at no hangs", () => {
    if (planned === null) throw new Error("no part");
    const rows = partRows(
      planned,
      {
        done: [
          {
            item: 0,
            exercise: "half",
            sets: [
              { reps: 3, onS: 7 },
              { reps: 3, onS: 7 },
            ],
          },
          { item: 1, exercise: "open", sets: [{ reps: 2, onS: 10 }] },
        ],
        off: ["0:1", "1:0"],
        setups,
        startedAt: 0,
      },
      model
    );
    expect(rows.map((d) => [d.exercise, d.sets.map((s) => s.reps)])).toEqual([
      ["half", [3, 0]],
      ["open", [0]],
    ]);
    expect(partHangs({ done: rows, setups, planned })).toBe(3);
  });

  it("saves the sets that held, a grip that held none with its dose, and nothing when none held", () => {
    if (planned === null) throw new Error("no part");
    const done = [
      {
        item: 0,
        exercise: "half",
        sets: [
          { reps: 3, onS: 7 },
          { reps: 2, onS: 7 },
        ],
      },
      { item: 1, exercise: "open", sets: [{ reps: 0, onS: 10 }] },
    ];
    const body = partBody({ done, setups, planned });
    expect(body).toMatchObject({ gripId: "half", edgeMm: 20, loadKg: 5, misses: 1 });
    expect(body?.done.map((d) => [d.exercise, d.sets.map((s) => s.reps)])).toEqual([
      ["half", [3, 2]],
      ["open", []],
    ]);
    expect(body?.done[1]?.dose).toMatchObject({ sets: 1, reps: 2, onS: 10 });
    const empty = done.map((d) => ({ ...d, sets: d.sets.map((s) => ({ ...s, reps: 0 })) }));
    expect(partBody({ done: empty, setups, planned })).toBeNull();
    expect(
      livePartForm({ done, setups, planned }).body(done, { edgeMm: 25, loadKg: 5 })
    ).toMatchObject({ edgeMm: 25 });
  });

  it("ends a part still in its timer on the sets it held so far, every grip in place", () => {
    if (planned === null) throw new Error("no part");
    const run = tick(
      startWorkoutRun(
        planned.items.map((i) => protocolOf(i.workout)),
        [],
        0
      ),
      20_000
    );
    const ended = partEnded({ run, setups, planned }, (id) => id);
    expect(ended?.done.map((d) => d.exercise)).toEqual(["half", "open"]);
    expect(partHangs(ended)).toBe(partHangs({ run, setups, planned }));
    expect(partHangs(ended)).toBeGreaterThan(0);
    expect(partEnded({ run, setups }, (id) => id)).toBeUndefined();
    const [first, second] = planned.items;
    if (second === undefined) throw new Error("no second grip");
    const longer: PlannedRun = {
      ...planned,
      items: [first, { ...second, dose: { ...second.dose, sets: 4 } }],
    };
    expect(partEnded({ run, setups, planned: longer }, (id) => id)?.done[1]?.sets).toHaveLength(4);
  });

  it("edits a logged part as it was saved, every grip keeping its own", () => {
    const part = {
      id: "p1",
      activityId: "a1",
      workoutId: "w1",
      gripId: "half",
      date: "2026-11-17",
      edgeMm: 20,
      loadKg: 5,
      pct: 100,
      misses: 0,
      rpe: 7,
      membershipId: null,
      week: null,
      focus: null,
      protocol: {
        name: "Fingers and pull",
        kind: "hang",
        hangS: 7,
        restS: 3,
        reps: 3,
        sets: 1,
        setRestS: 60,
      },
      done: [{ item: 0, exercise: "half", sets: [{ reps: 3, onS: 7 }] }],
    } as HangPart;
    const form = loggedPartForm(part);
    expect(form.setup).toEqual({ edgeMm: 20, loadKg: 5 });
    const edited = [{ item: 0, exercise: "half", sets: [{ reps: 2, onS: 7 }] }];
    expect(form.body(edited, form.setup)).toMatchObject({ gripId: "half", misses: 1 });
  });

  it("says what discarding loses, and the live bar where the part is", () => {
    if (planned === null) throw new Error("no part");
    const timerRun = tick(startWorkoutRun([protocolOf(planned.items[0].workout)], [], 0), 6_000);
    const live = (state: RunState): LiveRun => ({
      title: "Fingers and pull",
      workoutId: "w1",
      pathname: "/workout/sets",
      params: {},
      startedAt: 0,
      state,
    });
    const rows = [{ item: 0, exercise: "half", sets: [{ reps: 3 }, { reps: 2 }] }];
    const sets = { player: "sets" as const, done: [], ticked: [], grips: [0, 1] };
    expect(
      discardRunBody(live({ ...sets, fingers: { done: rows, setups, planned: planned } }))
    ).toBe("Its fingerboard part (5 hangs held) goes too.");
    expect(discardRunBody(live(sets))).toBe("Nothing from it is logged.");
    expect(partSetLine(timerRun, planned, (id) => (id === "half" ? "Half crimp" : id))).toBe(
      "Half crimp · Set 1 of 2"
    );
    expect(liveRunSummary(live({ ...sets, fingers: { run: timerRun, setups } }))).toBe(
      "Fingerboard · Set 1 of 2"
    );
    expect(
      liveRunSummary(
        live({
          ...sets,
          done: [
            { item: 0, exercise: "half", sets: [{ reps: 3 }] },
            { item: 2, exercise: "Pull-ups", sets: [{ reps: 6 }] },
          ],
        })
      )
    ).toBe("Pull-ups · Set 1 of 1");
  });
});
