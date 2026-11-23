import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { act, cleanup, fireEvent, screen } from "@testing-library/react-native";
import { router } from "expo-router";
import type { Dose } from "@sendtally/core/hang";
import {
  newTallyClimb,
  startExercise,
  withExerciseClimb,
  withLapRemoved,
  writeStoredDraft,
} from "@sendtally/features/log-session";
import { runParams, type WorkoutRun } from "@sendtally/features/workouts";
import { liveRun } from "../../live-session/liveRun";
import { exerciseTallyStorage } from "../../../lib/exerciseTallyStorage";
import { liveRunStorage } from "../../../lib/liveRunStorage";
import { anExercise, hangData, renderWithHang } from "../data/renderWithHang";
import { SetsScreen } from "./SetsScreen";

jest.mock("expo-router", () => ({
  router: { push: jest.fn(), replace: jest.fn(), back: jest.fn(), canGoBack: () => true },
  useLocalSearchParams: () => ({}),
}));
const mockApi = {
  status: () => new Promise(() => undefined),
  gyms: () => Promise.resolve({ gyms: [] }),
  climbs: () => Promise.resolve({ climbs: [] }),
};
jest.mock("../../../lib/api", () => ({ useApi: () => mockApi }));
jest.mock("../../../lib/liveRunStorage");

const runOf = (exercise: string, dose: Dose): WorkoutRun => ({
  kind: "climbing",
  title: "Power endurance",
  date: "2026-11-17",
  workoutId: "w1",
  link: { membershipId: null, week: null, focus: null },
  session: 0,
  minutes: 60,
  exerciseRestS: 0,
  items: [{ exercise, dose }],
});
const fours = runOf("4x4s", { sets: 2, reps: 4, setRestS: 240 });
const laps = runOf("Circuit laps", { sets: 2, reps: 40 });
const exercises = [anExercise("e1", "Circuit laps", "climbing", { measure: "laps" })];

const liveRunOf = (run: WorkoutRun): void =>
  liveRun.writeAsIs({
    title: run.title,
    workoutId: run.workoutId,
    pathname: "/workout/sets",
    params: runParams(run),
    startedAt: Date.now() - 300_000,
    state: {
      player: "sets",
      done: run.items.map((it, item) => ({
        item,
        exercise: it.exercise,
        sets: Array.from({ length: it.dose.sets }, () => ({})),
      })),
      ticked: [],
    },
  });

const advance = async (ms: number): Promise<void> => {
  await act(async () => {
    jest.advanceTimersByTime(ms);
  });
};
const add = async (grade: string): Promise<void> => {
  await fireEvent.press(screen.getByLabelText(grade));
};
const finished = async (): Promise<unknown> => {
  await fireEvent.press(screen.getByText("Finish"));
  const href = jest.mocked(router.replace).mock.calls.at(-1)?.[0];
  return JSON.parse(String(typeof href === "object" ? href.params?.done : undefined));
};

describe("Climbing inside the workout", () => {
  beforeEach(() => {
    jest.useFakeTimers({ now: new Date(2026, 10, 17, 18, 0) });
  });
  afterEach(() => {
    jest.useRealTimers();
    cleanup();
    exerciseTallyStorage.remove();
    liveRunStorage.remove();
    jest.clearAllMocks();
  });

  it("adds a row per climb, steps its attempts, ticks it sent, and ends the set at its last climb", async () => {
    await renderWithHang(<SetsScreen run={fours} />, hangData());
    expect(screen.getByText("Select a gym")).toBeTruthy();
    expect(router.push).not.toHaveBeenCalled();

    await add("V5");
    for (let i = 0; i < 2; i++)
      await fireEvent.press(screen.getByLabelText("Increase Climb 1, V5 · Attempts"));
    await fireEvent.press(screen.getByLabelText("Climb 1, V5, Sent"));
    expect(screen.getByLabelText("Climb 1, V5, Sent").props.accessibilityState).toMatchObject({
      checked: true,
    });
    for (const g of ["V6", "V4"]) await add(g);
    expect(screen.queryByLabelText("Rest, 4:00 left")).toBeNull();

    await fireEvent.press(screen.getByLabelText("Climb 3, V4"));
    await fireEvent.press(screen.getByLabelText("Remove V4"));
    expect(screen.queryByLabelText("Climb 3, V4")).toBeNull();
    expect(screen.getByText("4x4s · V4 removed")).toBeTruthy();
    await fireEvent.press(screen.getByText("Undo"));
    expect(screen.getByLabelText("Climb 3, V4")).toBeTruthy();

    await add("V6");
    expect(screen.getByLabelText("Rest, 4:00 left")).toBeTruthy();
    expect(screen.getByLabelText("Climb 1, V5, Sent")).toBeTruthy();
    await advance(60_000);
    expect(screen.getByLabelText("Rest, 3:00 left")).toBeTruthy();

    const done = (await finished()) as { exercise: string; sets: { climbs: unknown[] }[] }[];
    expect(done[0]?.sets[0]?.climbs).toEqual([
      { grade: "V5", scale: "v", tries: 3, sent: true, style: "redpoint" },
      { grade: "V6", scale: "v", tries: 1, sent: false },
      { grade: "V4", scale: "v", tries: 1, sent: false },
      { grade: "V6", scale: "v", tries: 1, sent: false },
    ]);
  });

  it("runs a warm-up checklist in a climbing workout as a checklist, never as climbing", async () => {
    const warm = {
      exercise: "Checklist",
      dose: { sets: 2 },
      checklist: { lines: ["Jog", "Swing"] },
    };
    await renderWithHang(
      <SetsScreen run={{ ...fours, items: [warm, ...fours.items] }} />,
      hangData()
    );
    expect(screen.getByText("Jog")).toBeTruthy();
    expect(screen.getByText(/Exercise 1 of 1/)).toBeTruthy();
    expect(screen.getAllByLabelText("V5")).toHaveLength(1);
    await add("V5");
    const done = (await finished()) as { exercise: string; checklist?: unknown }[];
    expect(done.map((d) => [d.exercise, d.checklist !== undefined])).toEqual([
      ["Checklist", true],
      ["4x4s", false],
    ]);
  });

  it("picks up a run left on the old tally with its climbs where they were", async () => {
    let draft = startExercise(
      null,
      { item: 0, name: "4x4s", sets: 2, climbs: 4, restS: 240 },
      new Date()
    );
    const climbed = newTallyClimb(draft, { kind: "grade", scale: "v", grade: "V7" }, "sent");
    draft = withExerciseClimb(climbed.draft, climbed.key);
    writeStoredDraft(exerciseTallyStorage, draft, new Date());
    liveRunOf(fours);
    await renderWithHang(<SetsScreen run={fours} />, hangData());
    expect(screen.getByLabelText("Climb 1, V7, Sent").props.accessibilityState).toMatchObject({
      checked: true,
    });
  });

  it("ticks a lap at its moves, lowers them for a fall, and takes back a lap with its −", async () => {
    await renderWithHang(<SetsScreen run={laps} />, hangData(), { exercises });
    await fireEvent.press(screen.getByLabelText("Lap 1"));
    for (let i = 0; i < 3; i++) await fireEvent.press(screen.getByLabelText("Lap 2 · Fewer moves"));
    await fireEvent.press(screen.getByLabelText("Lap 2"));
    await fireEvent.press(screen.getByLabelText(/^Open Circuit laps/));
    await fireEvent.press(screen.getByText("Add lap"));
    await fireEvent.press(screen.getByText("Add lap"));
    await fireEvent.press(screen.getByText("4"));
    await fireEvent.press(screen.getByLabelText("Remove lap 4"));
    expect(screen.queryByLabelText("Remove lap 4")).toBeNull();
    expect(screen.getByText("Circuit laps · Lap 4 removed")).toBeTruthy();
    await fireEvent.press(screen.getByText("Undo"));
    await fireEvent.press(screen.getByText("4"));
    await fireEvent.press(screen.getByLabelText("Remove lap 4"));

    expect(await finished()).toEqual([
      { item: 0, exercise: "Circuit laps", sets: [{ reps: 40 }, { reps: 37 }] },
    ]);
  });

  it("reads a timed lap as its time on the tally or off it", async () => {
    const timed: WorkoutRun = {
      ...laps,
      items: [
        { exercise: "Circuit laps", dose: { sets: 2, onS: 270 } },
        { exercise: "4x4s", dose: { sets: 1, reps: 2 } },
      ],
    };
    await renderWithHang(<SetsScreen run={timed} />, hangData(), { exercises });
    await fireEvent.press(screen.getByLabelText("Lap 1"));
    await fireEvent.press(screen.getByLabelText("Climb in set 1"));
    expect(screen.getByText("4:30 of 4:30")).toBeTruthy();
    expect(screen.queryByLabelText("Lap 1 · Fewer moves")).toBeNull();
  });

  it("folds a finished time set to its climbs line, as any climbing card", async () => {
    const arc = runOf("ARC", { sets: 1, onS: 60 });
    await renderWithHang(<SetsScreen run={arc} />, hangData(), {
      exercises: [anExercise("e2", "ARC", "climbing", { measure: "seconds" })],
    });
    await add("V1");
    await fireEvent.press(screen.getByLabelText("Climb 1, V1, Sent"));
    await fireEvent.press(screen.getByLabelText("Start"));
    await advance(61_000);
    expect(screen.getByLabelText("Open ARC, 1 climb · 1 sent · top V1")).toBeTruthy();
  });

  it("keeps a timed lap's clock running while another card has the grades", async () => {
    const timed: WorkoutRun = {
      ...laps,
      items: [
        { exercise: "Circuit laps", dose: { sets: 2, onS: 270 } },
        { exercise: "4x4s", dose: { sets: 1, reps: 2 } },
      ],
    };
    await renderWithHang(<SetsScreen run={timed} />, hangData(), { exercises });
    await fireEvent.press(screen.getByLabelText("Lap 1, Start"));
    await advance(20_000);
    await fireEvent.press(screen.getByLabelText("Climb in set 1"));
    await advance(10_000);
    expect(screen.getByText("0:30 of 4:30")).toBeTruthy();
    await fireEvent.press(screen.getByLabelText("Lap 1"));
    const done = (await finished()) as { sets: { onS?: number }[] }[];
    expect(done[0]?.sets).toEqual([{ onS: 30 }]);
  });

  it("runs a time set's clock only from its own button, and ends the set at its time", async () => {
    const arc = runOf("ARC", { sets: 2, onS: 60, setRestS: 30 });
    await renderWithHang(<SetsScreen run={arc} />, hangData(), {
      exercises: [anExercise("e2", "ARC", "climbing", { measure: "seconds" })],
    });
    await add("V1");
    await advance(30_000);
    expect(screen.getByText("0:00")).toBeTruthy();
    await fireEvent.press(screen.getByLabelText("Start"));
    await advance(20_000);
    expect(screen.getByText("0:20")).toBeTruthy();
    await fireEvent.press(screen.getByLabelText("Pause"));
    await advance(30_000);
    expect(screen.getByText("0:20")).toBeTruthy();
    await fireEvent.press(screen.getByLabelText("Start"));
    await advance(41_000);
    expect(screen.getByLabelText("Rest, 0:30 left")).toBeTruthy();
    const done = (await finished()) as { sets: { onS?: number; climbs: unknown[] }[] }[];
    expect(done[0]?.sets[0]).toMatchObject({ onS: 60 });
  });

  it("keeps a set with no target open until the next set's line, and adds to an ended set from its line", async () => {
    const open = runOf("Limit bouldering", { sets: 2 });
    await renderWithHang(<SetsScreen run={open} />, hangData());
    await add("V6");
    await add("V6");
    expect(screen.getByLabelText("Climb 2, V6")).toBeTruthy();
    expect(screen.queryByText("Done")).toBeNull();
    await fireEvent.press(screen.getByLabelText("Climb in set 2"));
    expect(screen.getByText("Done")).toBeTruthy();
    await add("V4");
    await fireEvent.press(screen.getByLabelText("Climb in set 1"));
    await add("V3");
    const done = (await finished()) as { sets: { climbs: { grade: string }[] }[] }[];
    expect(done[0]?.sets.map((x) => x.climbs.map((c) => c.grade))).toEqual([
      ["V6", "V6", "V3"],
      ["V4"],
    ]);
  });

  it("keeps the rest a run from the last build left running on its old tally", async () => {
    let draft = startExercise(
      null,
      { item: 0, name: "4x4s", sets: 2, climbs: 4, restS: 240 },
      new Date()
    );
    for (const grade of ["V4", "V5", "V4", "V5"]) {
      const climbed = newTallyClimb(draft, { kind: "grade", scale: "v", grade }, "sent");
      draft = withExerciseClimb(climbed.draft, climbed.key);
    }
    writeStoredDraft(
      exerciseTallyStorage,
      { ...draft, exercise: { ...draft.exercise!, set: 2 } },
      new Date()
    );
    liveRun.writeAsIs({
      title: "Power endurance",
      workoutId: "w1",
      pathname: "/workout/sets",
      params: runParams(fours),
      startedAt: Date.now() - 300_000,
      state: { player: "sets", done: [{ item: 0, exercise: "4x4s", sets: [{}, {}] }], ticked: [] },
      rest: { at: "tally", next: null, seconds: 240, endsAt: Date.now() + 180_000 },
    });
    await renderWithHang(<SetsScreen run={fours} />, hangData());
    expect(screen.getByLabelText("Rest, 3:00 left")).toBeTruthy();
  });

  it("starts a fresh run on a clean tally, whatever an earlier one left behind", async () => {
    const left = withLapRemoved(
      startExercise(
        null,
        { item: 0, name: "Circuit laps", sets: 2, lap: { unit: "moves", target: 40 }, restS: 0 },
        new Date()
      )
    );
    writeStoredDraft(exerciseTallyStorage, left, new Date());
    await renderWithHang(<SetsScreen run={laps} />, hangData(), { exercises });
    await fireEvent.press(screen.getByText("2"));
    expect(screen.getByLabelText("Remove lap 2")).toBeTruthy();
  });

  it("puts a lap back on Undo after the tally has moved on to the next card", async () => {
    const both: WorkoutRun = {
      ...laps,
      items: [...laps.items, { exercise: "4x4s", dose: { sets: 1, reps: 2 } }],
    };
    await renderWithHang(<SetsScreen run={both} />, hangData(), { exercises });
    await fireEvent.press(screen.getByLabelText("Lap 1"));
    await fireEvent.press(screen.getByText("2"));
    await fireEvent.press(screen.getByLabelText("Remove lap 2"));
    expect(screen.getByLabelText(/^Open Circuit laps/)).toBeTruthy();
    await fireEvent.press(screen.getByText("Undo"));
    expect(screen.queryByLabelText(/^Open Circuit laps/)).toBeNull();
    expect(screen.getByText("2")).toBeTruthy();
  });

  it("hands the review an exercise never started as its planned sets, none ticked", async () => {
    const two: WorkoutRun = {
      ...fours,
      items: [...fours.items, { exercise: "ARC", dose: { sets: 2, onS: 600 } }],
    };
    await renderWithHang(<SetsScreen run={two} />, hangData(), {
      exercises: [anExercise("e2", "ARC", "climbing", { measure: "seconds" })],
    });
    await add("V5");
    await fireEvent.press(screen.getByText("Finish"));
    const href = jest.mocked(router.replace).mock.calls.at(-1)?.[0];
    const params = (typeof href === "object" ? href.params : {}) as Record<string, string>;
    const done = JSON.parse(params.done ?? "[]") as { exercise: string; sets: unknown[] }[];
    expect(done.map((d) => [d.exercise, d.sets.length])).toEqual([
      ["4x4s", 1],
      ["ARC", 2],
    ]);
    expect(JSON.parse(params.off ?? "[]")).toEqual(["1:0", "1:1"]);
  });

  it("moves the grades to a card pressed, and edits a climb from VoiceOver's actions", async () => {
    const two: WorkoutRun = {
      ...fours,
      items: [...fours.items, { exercise: "ARC", dose: { sets: 1, onS: 60 } }],
    };
    await renderWithHang(<SetsScreen run={two} />, hangData(), {
      exercises: [anExercise("e2", "ARC", "climbing", { measure: "seconds" })],
    });
    await add("V5");
    const row = screen.getByLabelText("Climb 1, V5");
    expect(row.props.accessibilityActions).toEqual([{ name: "longpress", label: "Edit climb" }]);
    expect(screen.queryAllByLabelText("Start")).toHaveLength(0);
    await fireEvent.press(screen.getAllByLabelText("Climb in set 1")[1]!);
    expect(screen.getByLabelText("Start")).toBeTruthy();
    expect(screen.getByLabelText("Climb 1, V5")).toBeTruthy();
    expect(screen.queryByText("Climb this now")).toBeNull();
  });

  it("keeps every climb editable and the picker on hand once both exercises are done", async () => {
    const one = runOf("4x4s", { sets: 1, reps: 1 });
    const two: WorkoutRun = {
      ...one,
      items: [...one.items, { exercise: "Crimp crawls", dose: { sets: 1, reps: 1 } }],
    };
    await renderWithHang(<SetsScreen run={two} />, hangData());
    await add("V3");
    await add("V5");
    await fireEvent.press(screen.getByLabelText(/^Open 4x4s/));
    await fireEvent.press(screen.getByLabelText("Increase Climb 1, V3 · Attempts"));
    expect(screen.getByLabelText("Climb 1, V3, Sent")).toBeTruthy();
    await add("V4");
    expect(screen.getByLabelText("Climb 2, V4")).toBeTruthy();
  });
});
