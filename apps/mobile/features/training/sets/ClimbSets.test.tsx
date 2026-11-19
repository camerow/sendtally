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
const log = async (grade: string, go: "Attempt" | "Sent"): Promise<void> => {
  await fireEvent.press(screen.getByLabelText(grade));
  await fireEvent.press(screen.getByText(go));
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

  it("logs each climb in its set's row, flips one pressed wrong, and rests in place after the set", async () => {
    await renderWithHang(<SetsScreen run={fours} />, hangData());
    expect(screen.getByText("Climbs · 4 per set")).toBeTruthy();
    expect(screen.getByText("No gym")).toBeTruthy();
    expect(screen.getAllByText("4 climbs")).toHaveLength(2);
    expect(router.push).not.toHaveBeenCalled();

    await log("V5", "Sent");
    expect(screen.getByText("1 of 4 climbs")).toBeTruthy();
    await fireEvent.press(screen.getByLabelText("V5, Sent, tap to mark as attempt"));
    expect(screen.getByLabelText("V5, Attempt, tap to mark as sent")).toBeTruthy();

    await log("V6", "Sent");
    await log("V5", "Sent");
    await log("V6", "Attempt");
    expect(screen.getByLabelText("Rest, 4:00 left")).toBeTruthy();
    expect(screen.getByText("4 climbs")).toBeTruthy();
    await advance(60_000);
    expect(screen.getByLabelText("Rest, 3:00 left")).toBeTruthy();

    const done = (await finished()) as { exercise: string; sets: { climbs: unknown[] }[] }[];
    expect(done.map((d) => [d.exercise, d.sets.map((s) => s.climbs.length)])).toEqual([
      ["4x4s", [4]],
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
    await log("V5", "Sent");
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
    expect(screen.getByLabelText("V7, Sent, tap to mark as attempt")).toBeTruthy();
    expect(screen.getByText("1 of 4 climbs")).toBeTruthy();
  });

  it("logs a lap Sent, an Attempt lap as far as it got, and takes back a lap with its −", async () => {
    await renderWithHang(<SetsScreen run={laps} />, hangData(), { exercises });
    expect(screen.getByText("Moves · 40 a lap")).toBeTruthy();
    await fireEvent.press(screen.getByText("Sent"));
    await fireEvent.press(screen.getByText("Attempt"));
    for (let i = 0; i < 3; i++) await fireEvent.press(screen.getByLabelText("More moves"));
    expect(screen.getByText("3/40")).toBeTruthy();
    await fireEvent.press(screen.getByText("Save"));
    await fireEvent.press(screen.getByLabelText(/^Open Circuit laps/));
    await fireEvent.press(screen.getByText("Add lap"));
    await fireEvent.press(screen.getByLabelText("Remove lap 3"));
    expect(screen.queryByLabelText("Remove lap 3")).toBeNull();
    expect(screen.getByText("Circuit laps · Lap 3 removed")).toBeTruthy();
    await fireEvent.press(screen.getByText("Undo"));
    await fireEvent.press(screen.getByLabelText("Remove lap 3"));

    expect(await finished()).toEqual([
      { item: 0, exercise: "Circuit laps", sets: [{ reps: 40 }, { reps: 3 }] },
    ]);
  });

  it("takes a set's end and its rest back when Undo takes back its last climb", async () => {
    await renderWithHang(<SetsScreen run={fours} />, hangData());
    for (const g of ["V4", "V5", "V6"]) await log(g, "Sent");
    await log("V7", "Attempt");
    expect(screen.getByLabelText("Rest, 4:00 left")).toBeTruthy();
    await fireEvent.press(screen.getByText("Undo"));
    expect(screen.queryByLabelText("Rest, 4:00 left")).toBeNull();
    expect(screen.getByText("3 of 4 climbs")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Sent" })).toBeEnabled();
  });

  it("counts a time set down in its row from its first grade, and ends it at zero", async () => {
    const arc = runOf("ARC", { sets: 2, onS: 60, setRestS: 30 });
    await renderWithHang(<SetsScreen run={arc} />, hangData(), {
      exercises: [anExercise("e2", "ARC", "climbing", { measure: "seconds" })],
    });
    expect(screen.getByText("On the wall · 1:00")).toBeTruthy();
    await log("V1", "Sent");
    await advance(40_000);
    expect(screen.getByText("0:20 left")).toBeTruthy();
    expect(screen.getByLabelText("V1, Sent, tap to mark as attempt")).toBeTruthy();
    await advance(21_000);
    expect(screen.getByLabelText("Rest, 0:30 left")).toBeTruthy();
    const done = (await finished()) as { sets: { onS?: number; climbs: unknown[] }[] }[];
    expect(done[0]?.sets[0]).toMatchObject({ onS: 60 });
  });

  it("ends an open set on its tick", async () => {
    const open = runOf("Limit bouldering", { sets: 2 });
    await renderWithHang(<SetsScreen run={open} />, hangData());
    expect(screen.getByText("Climbs")).toBeTruthy();
    await log("V6", "Attempt");
    await log("V6", "Sent");
    expect(screen.getByText("2 climbs")).toBeTruthy();
    await fireEvent.press(screen.getByLabelText("End set 1"));
    expect(screen.getByLabelText("End set 2")).toBeTruthy();
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
    expect(screen.getByLabelText("Remove lap 2")).toBeTruthy();
  });

  it("puts a lap back on Undo after the tally has moved on to the next card", async () => {
    const both: WorkoutRun = {
      ...laps,
      items: [...laps.items, { exercise: "4x4s", dose: { sets: 1, reps: 2 } }],
    };
    await renderWithHang(<SetsScreen run={both} />, hangData(), { exercises });
    await fireEvent.press(screen.getByText("Sent"));
    await fireEvent.press(screen.getByLabelText("Remove lap 2"));
    expect(screen.getByLabelText(/^Open Circuit laps/)).toBeTruthy();
    await fireEvent.press(screen.getByText("Undo"));
    expect(screen.queryByLabelText(/^Open Circuit laps/)).toBeNull();
    expect(screen.getByLabelText("Remove lap 2")).toBeTruthy();
  });

  it("hands the review an exercise never started as its planned sets, none ticked", async () => {
    const two: WorkoutRun = {
      ...fours,
      items: [...fours.items, { exercise: "ARC", dose: { sets: 2, onS: 600 } }],
    };
    await renderWithHang(<SetsScreen run={two} />, hangData(), {
      exercises: [anExercise("e2", "ARC", "climbing", { measure: "seconds" })],
    });
    await log("V5", "Sent");
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

  it("moves the tally to a card from its menu, and edits a climb from VoiceOver's actions", async () => {
    const two: WorkoutRun = {
      ...fours,
      items: [...fours.items, { exercise: "ARC", dose: { sets: 1, onS: 60 } }],
    };
    await renderWithHang(<SetsScreen run={two} />, hangData(), {
      exercises: [anExercise("e2", "ARC", "climbing", { measure: "seconds" })],
    });
    await log("V5", "Sent");
    const chip = screen.getByLabelText("V5, Sent, tap to mark as attempt");
    expect(chip.props.accessibilityActions).toEqual([{ name: "longpress", label: "Edit climb" }]);
    await fireEvent.press(screen.getAllByLabelText("More for this exercise")[1]!);
    await fireEvent.press(screen.getByText("Climb this now"));
    expect(screen.getByText("1:00")).toBeTruthy();
    expect(screen.queryByText("1 of 4 climbs")).toBeNull();
  });

  it("never moves the tally from a tap in a row; only the card's menu does", async () => {
    const two: WorkoutRun = {
      ...fours,
      items: [...fours.items, { exercise: "ARC", dose: { sets: 1, onS: 60 } }],
    };
    await renderWithHang(<SetsScreen run={two} />, hangData(), {
      exercises: [anExercise("e2", "ARC", "climbing", { measure: "seconds" })],
    });
    await log("V5", "Sent");
    await fireEvent.press(screen.getByText("1:00"));
    expect(screen.getByText("1 of 4 climbs")).toBeTruthy();
  });

  it("offers Climb this now only on a card with climbing still to do", async () => {
    const one = runOf("4x4s", { sets: 1, reps: 1 });
    const two: WorkoutRun = {
      ...one,
      items: [...one.items, { exercise: "ARC", dose: { sets: 1, onS: 60 } }],
    };
    await renderWithHang(<SetsScreen run={two} />, hangData(), {
      exercises: [anExercise("e2", "ARC", "climbing", { measure: "seconds" })],
    });
    await log("V5", "Sent");
    const more = (n: number) => screen.getAllByLabelText("More for this exercise")[n]!;
    await fireEvent.press(screen.getByText("4x4s"));
    await fireEvent.press(more(1));
    await fireEvent.press(screen.getByText("Climb this now"));
    await fireEvent.press(more(0));
    expect(screen.getAllByText("Skip for now").length).toBeGreaterThan(0);
    expect(screen.queryByText("Climb this now")).toBeNull();
  });
});
