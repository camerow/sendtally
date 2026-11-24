import { describe, expect, it } from "vitest";
import {
  doneAsPrescribed,
  protocolOf,
  startWorkoutRun,
  currentPhase,
  remainingInPhase,
  tick,
  togglePause,
  type ItemDone,
} from "@sendtally/core/hang";
import type { HangPart } from "@sendtally/api-client";
import {
  discardRunBody,
  gripTimer,
  gripTimerLabel,
  loggedPartForm,
  livePartForm,
  partBody,
  partEnded,
  partOfRows,
  partPlaces,
  partPlanned,
  partSetups,
  partRows,
  partTimerStart,
  timerWrites,
  withTimerWrites,
} from "./fingersPart";
import { setKey } from "./setsRun";
import { timerText } from "../hang/timerText";
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
  session: 0,
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
    expect(discardRunBody(live({ ...sets, done: rows, ticked: ["0:0", "0:1"] }))).toBe(
      "Its fingerboard part (5 hangs held) goes too."
    );
    expect(discardRunBody(live({ ...sets, done: rows, ticked: ["0:1"] }))).toBe(
      "Its fingerboard part (2 hangs held) goes too."
    );
    expect(discardRunBody(live(sets))).toBe("Nothing from it is logged.");
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
    ).toBe("Half crimp · Set 1 of 1");
  });

  const rowsOf = (done: readonly ItemDone[]) =>
    doneAsPrescribed(run.items).map((d) => done.find((x) => x.item === d.item) ?? d);

  it("lays a timer's sets into its grip's rows from where it started, ticking each set it ended", () => {
    const start = partTimerStart(run, isGrip, undefined, { item: 0, set: 1 });
    if (start === null) throw new Error("no timer");
    expect(start.planned.items.map((i) => [i.workout.grip, i.workout.sets])).toEqual([["half", 1]]);
    const protocols = start.planned.items.map((i) => protocolOf(i.workout));
    const twoHangs = tick(startWorkoutRun(protocols, [], 0), 23_000);
    const part = { run: twoHangs, setups, planned: start.planned, at: { item: 0, set: 1 } };
    const writes = timerWrites(part, [0, 1]);
    expect(writes.map((w) => [w.at, w.value.reps, w.ended])).toEqual([
      [{ item: 0, set: 1 }, 2, false],
    ]);
    const after = withTimerWrites(rowsOf([]), new Set(), writes);
    expect(after?.done[0]?.sets.map((s) => s.reps)).toEqual([3, 2]);
    expect([...(after?.ticked ?? [])]).toEqual([]);
    expect(withTimerWrites(after?.done ?? [], after?.ticked ?? new Set(), writes)).toBeNull();
    const done = tick(twoHangs, 60_000);
    const ended = timerWrites({ ...part, run: done }, [0, 1]);
    expect(ended.map((w) => [w.at.set, w.value.reps, w.ended])).toEqual([[1, 3, true]]);
  });

  it("opens a run saved before grips had rows on the sets its part held, none of them lost", () => {
    if (planned === null) throw new Error("no part");
    const held = [
      {
        item: 0,
        exercise: "half",
        sets: [
          { reps: 3, onS: 7 },
          { reps: 0, onS: 7 },
        ],
      },
      { item: 1, exercise: "open", sets: [{ reps: 2, onS: 10, weightKg: 10 }] },
    ];
    const after = withTimerWrites(
      rowsOf([]),
      new Set(),
      timerWrites({ done: held, setups, planned }, [0, 1])
    );
    expect(after?.done.slice(0, 2).map((d) => d.sets.map((s) => s.reps))).toEqual([[3, 3], [2]]);
    expect([...(after?.ticked ?? [])]).toEqual(["0:0", "1:0"]);
    expect(after?.done[1]?.sets[0]?.weightKg).toBe(10);
    const protocols = planned.items.map((i) => protocolOf(i.workout));
    const old = { run: tick(startWorkoutRun(protocols, [], 0), 20_000), setups, planned };
    expect(timerWrites(old, [0, 1]).every((w) => w.at.item === 0)).toBe(true);
    expect(partTimerStart(run, isGrip, old, null)?.resumed).toEqual(old);
  });

  it("saves a set ticked by hand as the timer saves one it ran, apart from what was done", () => {
    if (planned === null) throw new Error("no part");
    const byHand = partOfRows(rowsOf([]), new Set(["0:0"]), [0, 1], planned, setups);
    const start = partTimerStart(run, isGrip, undefined, { item: 0, set: 0 });
    if (start === null) throw new Error("no timer");
    const protocols = start.planned.items.map((i) => protocolOf(i.workout));
    const ran = tick(startWorkoutRun(protocols, [], 0), 5_000 + 3 * 10_000);
    const writes = timerWrites(
      { run: ran, setups, planned: start.planned, at: { item: 0, set: 0 } },
      [0, 1]
    );
    const timed = withTimerWrites(rowsOf([]), new Set(), writes);
    expect([...(timed?.ticked ?? [])]).toContain("0:0");
    const byTimer = partOfRows(timed?.done ?? [], new Set(["0:0"]), [0, 1], planned, setups);
    expect(partBody(byTimer!)).toEqual(partBody(byHand!));
    expect(byHand?.done.map((d) => d.sets.map((s) => s.reps))).toEqual([[3, 0], [0]]);
    expect(
      partOfRows(rowsOf([]), new Set([setKey({ item: 2, set: 0 })]), [0, 1], planned, setups)
    ).toBeUndefined();
  });

  it("names each grip's timer button from where its sets stand", () => {
    const none = new Set<string>();
    expect(gripTimerLabel(gripTimer(0, 2, none, undefined, [0, 1])!)).toBe("Start timer");
    expect(gripTimerLabel(gripTimer(0, 2, new Set(["0:0"]), undefined, [0, 1])!)).toBe(
      "Start timer at set 2"
    );
    expect(gripTimer(0, 2, new Set(["0:0", "0:1"]), undefined, [0, 1])).toBeNull();
    const start = partTimerStart(run, isGrip, undefined, { item: 1, set: 0 });
    if (start === null) throw new Error("no timer");
    const protocols = start.planned.items.map((i) => protocolOf(i.workout));
    const paused = {
      run: startWorkoutRun(protocols, [], 0),
      setups,
      planned: start.planned,
      at: { item: 1, set: 0 },
    };
    expect(gripTimerLabel(gripTimer(1, 1, none, paused, [0, 1])!)).toBe("Resume timer");
    expect(gripTimerLabel(gripTimer(0, 2, none, paused, [0, 1])!)).toBe("Start timer");
  });

  const timerOn = (item: number, set: number) => {
    const start = partTimerStart(run, isGrip, undefined, { item, set });
    if (start === null) throw new Error("no timer");
    const protocols = start.planned.items.map((i) => protocolOf(i.workout));
    return { planned: start.planned, at: { item, set }, run: startWorkoutRun(protocols, [], 0) };
  };

  it("logs a set the timer left part held as the row shows it, once ticked by hand", () => {
    const { planned: one, at, run: started } = timerOn(0, 0);
    const writes = timerWrites({ run: tick(started, 23_000), setups, planned: one, at }, [0, 1]);
    const rows = withTimerWrites(rowsOf([]), new Set(), writes);
    expect(rows?.done[0]?.sets[0]?.reps).toBe(2);
    if (planned === null || rows === null) throw new Error("no rows");
    const saved = partBody(partOfRows(rows.done, new Set(["0:0"]), [0, 1], planned, setups)!);
    expect(saved?.done[0]?.sets.map((s) => s.reps)).toEqual([2]);
  });

  it("saves a set ticked by hand and one the timer ran alike at the same hangs and load", () => {
    if (planned === null) throw new Error("no part");
    const { planned: one, at, run: started } = timerOn(0, 0);
    const ran = tick(started, 5_000 + 3 * 10_000);
    const loads = [[7.5]];
    const writes = timerWrites({ run: ran, setups, loads, planned: one, at }, [0, 1]);
    const timed = withTimerWrites(rowsOf([]), new Set(), writes);
    const byHand = rowsOf([]).map((d) =>
      d.item === 0
        ? { ...d, sets: d.sets.map((s, i) => (i === 0 ? { ...s, weightKg: 7.5 } : s)) }
        : d
    );
    const a = partBody(partOfRows(timed?.done ?? [], new Set(["0:0"]), [0, 1], planned, setups)!);
    const b = partBody(partOfRows(byHand, new Set(["0:0"]), [0, 1], planned, setups)!);
    expect(a).toEqual(b);
    expect(a?.done[0]?.sets[0]).toMatchObject({ reps: 3, weightKg: 7.5 });
  });

  it("starts grip B while grip A's timer sits paused, A's rows keeping what it wrote", () => {
    const a = timerOn(0, 0);
    const paused = { ...a, setups, run: togglePause(tick(a.run, 23_000), 23_000) };
    const rows = withTimerWrites(rowsOf([]), new Set(), timerWrites(paused, [0, 1]));
    expect(gripTimerLabel(gripTimer(0, 2, new Set(), paused, [0, 1])!)).toBe("Resume timer");
    const b = partTimerStart(run, isGrip, paused, { item: 1, set: 0 });
    expect(b?.resumed).toBeNull();
    expect(b?.at).toEqual({ item: 1, set: 0 });
    expect(b?.planned.items.map((i) => i.workout.grip)).toEqual(["open"]);
    const fresh = { ...timerOn(1, 0), setups };
    expect(gripTimerLabel(gripTimer(0, 2, rows?.ticked ?? new Set(), fresh, [0, 1])!)).toBe(
      "Start timer"
    );
    expect(rows?.done[0]?.sets[0]?.reps).toBe(2);
    expect(rows?.ticked.has("0:0")).toBe(false);
  });

  it("keeps each grip's setup where its rows sit, from an old saved part or a grip's timer", () => {
    if (planned === null) throw new Error("no part");
    expect(partSetups({ done: [], setups, planned }, [0, 1])).toEqual({
      "0": setups[0],
      "1": setups[1],
    });
    const b = timerOn(1, 0);
    expect(partSetups({ ...b, setups: [{ edgeMm: 25, loadKg: 0 }] }, [0, 1])).toEqual({
      "1": { edgeMm: 25, loadKg: 0 },
    });
  });

  it("resumes a timer paused in its rest from the run's rest row, one clock for both", () => {
    const a = timerOn(0, 0);
    const resting = tick(a.run, 5_000 + 6 * 10_000 + 1_000);
    expect(currentPhase(resting).kind).not.toBe("hang");
    const paused = { ...a, setups, run: togglePause(resting, 66_000) };
    const now = 200_000;
    const start = partTimerStart(run, isGrip, paused, null, { endsAt: now + 30_000 }, now);
    expect(remainingInPhase(start!.resumed!.run, now)).toBe(30);
    expect(remainingInPhase(start!.resumed!.run, now + 60_000)).toBe(30);
  });

  it("numbers a timer opened at set 2 by the grip's rows", () => {
    const { run: started } = timerOn(0, 1);
    const hanging = tick(started, 5_500);
    expect(timerText(hanging, 6, 1, 1).setLine).toBe("Set 2 of 2");
  });

  it("names a grip's timer on the live bar by its row's set", () => {
    const a = timerOn(0, 1);
    const live: LiveRun = {
      title: "Fingers and pull",
      workoutId: "w1",
      pathname: "/workout/sets",
      params: {},
      startedAt: 0,
      state: {
        player: "sets",
        done: rowsOf([]),
        ticked: ["0:0"],
        grips: [0, 1],
        fingers: { ...a, setups, run: tick(a.run, 6_000) },
      },
    };
    expect(liveRunSummary(live)).toBe("Half crimp · Set 2 of 2");
  });
});
