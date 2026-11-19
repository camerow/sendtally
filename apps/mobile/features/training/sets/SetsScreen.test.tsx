import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { act, fireEvent, renderHook, screen, within } from "@testing-library/react-native";
import { router } from "expo-router";
import React from "react";
import { liveRunStorage } from "../../../lib/liveRunStorage";
import { anExercise, hangData, readingOrder, renderWithHang } from "../data/renderWithHang";
import type { WorkoutRun } from "@sendtally/features/workouts";
import { liveRun } from "../../live-session/liveRun";
import { useLiveHold } from "../hold/useLiveHold";
import { SetsScreen } from "./SetsScreen";

jest.mock("expo-router", () => ({
  router: { replace: jest.fn(), push: jest.fn(), back: jest.fn(), canGoBack: () => true },
}));
jest.mock("../../../lib/api", () => ({ useApi: () => undefined }));
jest.mock("../../../lib/liveRunStorage");
jest.mock("@sendtally/features/activities", () => ({
  ...jest.requireActual<object>("@sendtally/features/activities"),
  useWeightUnit: () => "kg",
  useActivities: () => ({
    state: {
      status: "ready",
      data: [
        {
          workoutId: "w1",
          done: [
            { item: 0, exercise: "Back squat", sets: [{ reps: 5, weightKg: 97.5 }] },
            { item: 1, exercise: "Row", sets: [{ reps: 8, weightKg: 60 }] },
          ],
        },
      ],
    },
  }),
}));

const run: WorkoutRun = {
  kind: "strength",
  title: "Lower body A",
  date: "2026-10-22",
  workoutId: "w1",
  link: { membershipId: "m1", week: 2, focus: null },
  session: 0,
  minutes: 45,
  exerciseRestS: 120,
  items: [
    { exercise: "Back squat", dose: { sets: 2, reps: 5, weightKg: 100, setRestS: 90 } },
    { exercise: "Row", dose: { sets: 1, reps: 8 } },
    { exercise: "Plank", dose: { sets: 1, onS: 30 } },
  ],
};

const advance = async (ms: number): Promise<void> => {
  await act(async () => {
    jest.advanceTimersByTime(ms);
  });
};

describe("Sets player", () => {
  beforeEach(() => {
    jest.useFakeTimers({ now: new Date(2026, 9, 22, 18, 5) });
    liveRunStorage.remove();
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it("rests in line after each tick, folds a finished exercise, and logs the clock's minutes", async () => {
    await renderWithHang(<SetsScreen run={run} />, hangData(), {
      workouts: [
        {
          id: "w1",
          kind: "strength",
          name: "Lower body A",
          description: "Heavy squats, then rows.",
          minutes: 45,
          targetRpe: 8,
          items: run.items.map(({ exercise, dose }) => ({ exercise, doses: [dose] })),
          exerciseRestS: 180,
          focus: null,
          updatedAt: "2026-10-01T00:00:00.000Z",
        },
      ],
    });
    expect(screen.getByText("Strength")).toBeTruthy();
    await fireEvent.press(screen.getByLabelText("Minimize"));
    expect(router.back).toHaveBeenCalled();
    expect(screen.queryByLabelText("About this workout")).toBeNull();
    expect(screen.getByText("Heavy squats, then rows.")).toBeTruthy();
    expect(screen.getByText("Target RPE 8/10")).toBeTruthy();
    expect(screen.getByText("Exercise 1 of 3")).toBeTruthy();
    expect(screen.getByText("2 sets × 5 reps · 100 kg")).toBeTruthy();
    expect(screen.getByText("1 set × 8 reps")).toBeTruthy();
    expect(screen.getByText("1 set × 0:30")).toBeTruthy();
    expect(screen.queryByText(/^Last /)).toBeNull();
    expect(screen.queryByText("1:30 rest")).toBeNull();
    expect(screen.getAllByText("Rest 2:00")).toHaveLength(2);
    expect(readingOrder("Back squat, set 1", "Rest 1:30", "Back squat, set 2")).toEqual([
      "Back squat, set 1",
      "Rest 1:30",
      "Back squat, set 2",
    ]);
    await fireEvent.press(screen.getByLabelText("Back squat, set 1"));
    expect(screen.queryByText("Rest 1:30")).toBeNull();
    expect(
      readingOrder("Back squat, set 1", "Rest, 1:30 left", "Back squat, set 2", "Rest 2:00")
    ).toEqual([
      "Back squat, set 1",
      "Rest, 1:30 left",
      "Back squat, set 2",
      "Rest 2:00",
      "Rest 2:00",
    ]);
    await advance(30_000);
    expect(screen.getByLabelText("Rest, 1:00 left")).toBeTruthy();
    expect(screen.getByText("0:30")).toBeTruthy();

    await fireEvent.press(screen.getByLabelText("Back squat, set 2 · Reps"));
    await fireEvent.press(screen.getByLabelText("4"));
    await fireEvent.press(screen.getByLabelText("Done"));
    await fireEvent.press(screen.getByLabelText("Back squat, set 2"));
    expect(screen.queryByLabelText("Rest, 1:00 left")).toBeNull();
    const folded = "Open Back squat, 2 × 5 · 100 kg";
    expect(screen.getByLabelText(folded)).toBeTruthy();
    expect(screen.getByText("Exercise 2 of 3")).toBeTruthy();
    expect(screen.queryByTestId("rest-next")?.props.children).toBe("Row");
    expect(readingOrder(folded, "Rest, 2:00 left", "Row, set 1", "Rest 2:00")).toEqual([
      folded,
      "Rest, 2:00 left",
      "Row, set 1",
      "Rest 2:00",
    ]);
    await advance(120_000);
    expect(screen.queryByTestId("rest-next")).toBeNull();
    expect(screen.getAllByText("Rest 2:00")).toHaveLength(2);
    expect(screen.getByLabelText("Row, set 1 · Weight").props.accessibilityValue).toEqual({
      text: "60 kg",
    });
    await fireEvent.press(screen.getByLabelText("Row, set 1"));

    await fireEvent.press(screen.getByText("Finish"));
    expect(router.replace).toHaveBeenCalledWith({
      pathname: "/activity/new",
      params: {
        kind: "strength",
        title: "Lower body A",
        date: "2026-10-22",
        workoutId: "w1",
        session: "0",
        minutes: "3",
        membershipId: "m1",
        week: "2",
        startTime: "18:05",
        live: "1",
        done: JSON.stringify([
          {
            item: 0,
            exercise: "Back squat",
            sets: [
              { reps: 5, weightKg: 100, setRestS: 90 },
              { reps: 4, weightKg: 100, setRestS: 90 },
            ],
          },
          { item: 1, exercise: "Row", sets: [{ reps: 8, weightKg: 60 }] },
          { item: 2, exercise: "Plank", sets: [{ onS: 30 }] },
        ]),
        off: JSON.stringify(["2:0"]),
      },
    });
  });

  it("opens an exercise's description from the info button beside its name", async () => {
    await renderWithHang(<SetsScreen run={run} />, hangData(), {
      exercises: [
        anExercise("e1", "row", "strength", { description: "Pull to the hip." }),
        anExercise("e2", "Back squat", "strength"),
      ],
    });
    expect(screen.getAllByLabelText("About this exercise")).toHaveLength(1);
    expect(screen.queryByText("Pull to the hip.")).toBeNull();
    await fireEvent.press(screen.getByLabelText("About this exercise"));
    expect(screen.getByText("Pull to the hip.")).toBeTruthy();
    expect(screen.getAllByText("Row").length).toBeGreaterThan(1);
  });

  it("keeps a running rest when the player is minimised and opened again", async () => {
    const view = await renderWithHang(<SetsScreen run={run} />, hangData());
    await fireEvent.press(screen.getByLabelText("Back squat, set 1"));
    await view.unmount();
    await advance(30_000);
    await renderWithHang(<SetsScreen run={run} />, hangData());
    expect(readingOrder("Back squat, set 1", "Rest, 1:00 left", "Back squat, set 2")).toEqual([
      "Back squat, set 1",
      "Rest, 1:00 left",
      "Back squat, set 2",
    ]);
    await fireEvent.press(screen.getByText("Skip"));
    expect(screen.queryByLabelText("Rest, 1:00 left")).toBeNull();
    expect(liveRun.read()?.rest).toBeUndefined();
  });

  it("shows an exercise's own target under its name, and none where it sets none", async () => {
    const targeted: WorkoutRun = {
      ...run,
      items: [
        { exercise: "Back squat", dose: { sets: 2, reps: 5, targetRpe: 8 } },
        { exercise: "Row", dose: { sets: 1, reps: 8 } },
      ],
    };
    await renderWithHang(<SetsScreen run={targeted} />, hangData());
    expect(screen.getByText("Target RPE 8/10")).toBeTruthy();
    expect(screen.getAllByText(/RPE/)).toHaveLength(2);
  });

  it("asks a ticked set's RPE only where the exercise sets a target", async () => {
    const targeted: WorkoutRun = {
      ...run,
      items: [
        { exercise: "Back squat", dose: { sets: 2, reps: 5, targetRpe: 8 } },
        { exercise: "Row", dose: { sets: 1, reps: 8 } },
      ],
    };
    await renderWithHang(<SetsScreen run={targeted} />, hangData());
    expect(screen.queryByLabelText("Back squat, set 1 · RPE")).toBeNull();
    await fireEvent.press(screen.getByLabelText("Back squat, set 1"));
    await fireEvent.press(screen.getByLabelText("Row, set 1"));
    expect(screen.getByLabelText("Back squat, set 1 · RPE")).toBeTruthy();
    expect(screen.queryByLabelText("Row, set 1 · RPE")).toBeNull();
  });

  it("selects a set from its number only, never from a tick or a typed value", async () => {
    await renderWithHang(<SetsScreen run={run} />, hangData());
    expect(screen.queryByLabelText(/^Remove set/)).toBeNull();
    await fireEvent.press(within(screen.getByTestId("set-row-0-1")).getByText("2"));
    expect(screen.getByLabelText("Remove set 2")).toBeTruthy();
    await fireEvent.press(screen.getByLabelText("Back squat, set 1 · Reps"));
    await fireEvent.press(screen.getByLabelText("4"));
    await fireEvent.press(screen.getByLabelText("Done"));
    await fireEvent.press(screen.getByLabelText("Back squat, set 1"));
    expect(screen.getAllByLabelText(/^Remove set/)).toHaveLength(1);
    expect(screen.getByLabelText("Remove set 2")).toBeTruthy();
    await fireEvent.press(within(screen.getByTestId("set-row-1-0")).getByText("1"));
    expect(screen.getAllByLabelText(/^Remove set/)).toHaveLength(1);
    expect(screen.getByLabelText("Remove set 1")).toBeTruthy();
  });

  it("says whether an exercise card is open", async () => {
    await renderWithHang(<SetsScreen run={run} />, hangData());
    expect(screen.getByLabelText("Fold Back squat")).toHaveProp("accessibilityState", {
      expanded: true,
    });
    await fireEvent.press(screen.getByLabelText("Fold Back squat"));
    expect(screen.getByLabelText(/^Open Back squat, /)).toHaveProp("accessibilityState", {
      expanded: false,
    });
  });

  it("adds a set to any exercise, and takes the current one out with Undo", async () => {
    await renderWithHang(<SetsScreen run={run} />, hangData());
    await fireEvent.press(screen.getByLabelText("Add a set to Row"));
    expect(screen.getByLabelText("Row, set 2")).toBeTruthy();
    await fireEvent.press(screen.getByLabelText("Back squat, set 2"));
    expect(screen.queryByLabelText(/^Remove set/)).toBeNull();
    await fireEvent.press(within(screen.getByTestId("set-row-0-1")).getByText("2"));
    expect(screen.getAllByLabelText(/^Remove set/)).toHaveLength(1);
    await fireEvent.press(screen.getByLabelText("Remove set 2"));
    expect(screen.queryByLabelText("Back squat, set 2")).toBeNull();
    expect(screen.getByText("Back squat · Set 2 removed")).toBeTruthy();
    await fireEvent.press(screen.getByText("Undo"));
    expect(screen.getByLabelText("Back squat, set 2")).toHaveProp("accessibilityState", {
      checked: true,
    });
  });

  it("edits any set's numbers in any order, with no Edit step", async () => {
    await renderWithHang(<SetsScreen run={run} />, hangData());
    await fireEvent.press(screen.getByLabelText("Row, set 1 · Reps"));
    await fireEvent.press(screen.getByLabelText("6"));
    await fireEvent.press(screen.getByLabelText("Done"));
    expect(screen.getByLabelText("Row, set 1 · Reps").props.accessibilityValue).toEqual({
      text: "6",
    });
    expect(screen.getByLabelText("Back squat, set 2 · Reps")).toBeTruthy();
  });

  it("folds a finished exercise, opens it to edit, and folds an open one from its title", async () => {
    await renderWithHang(<SetsScreen run={run} />, hangData());
    await fireEvent.press(screen.getByLabelText("Row, set 1"));
    await fireEvent.press(screen.getByLabelText("Open Row, 1 × 8 · 60 kg"));
    expect(screen.getByLabelText("Row, set 1 · Reps")).toBeTruthy();
    await fireEvent.press(screen.getByLabelText("Fold Row"));
    expect(screen.queryByLabelText("Row, set 1 · Reps")).toBeNull();
    await fireEvent.press(screen.getByLabelText("Fold Back squat"));
    expect(screen.getByLabelText("Open Back squat, 2 × 5 · 100 kg")).toBeTruthy();
  });

  it("ticks a checklist's typed lines in any order and logs which were ticked", async () => {
    const lines = ["Jog 5 min", "Arm circles x20", "Easy boulders x10"];
    const warm: WorkoutRun = {
      ...run,
      items: [{ exercise: "Checklist", dose: { sets: 3 }, checklist: { lines } }, run.items[1]!],
    };
    await renderWithHang(<SetsScreen run={warm} />, hangData());
    expect(screen.getByText("Checklist")).toBeTruthy();
    await fireEvent.press(screen.getByLabelText("Easy boulders x10"));
    await fireEvent.press(screen.getByLabelText("Jog 5 min"));
    expect(screen.getByLabelText("Jog 5 min").props.accessibilityState).toMatchObject({
      checked: true,
    });
    expect(screen.queryByLabelText("Checklist, set 1")).toBeNull();
    await fireEvent.press(screen.getByText("Finish"));
    const { params } = (router.replace as jest.Mock).mock.calls.at(-1)![0] as {
      params: { done: string };
    };
    expect(JSON.parse(params.done)[0]).toEqual({
      item: 0,
      exercise: "Checklist",
      sets: [],
      checklist: { lines, checked: [0, 2] },
    });
  });

  it("runs a warm-up and a cool-down checklist around two exercises, counting the exercises only", async () => {
    const warm = { exercise: "Checklist", dose: { sets: 1 }, checklist: { lines: ["Jog"] } };
    const cool = { exercise: "Checklist", dose: { sets: 1 }, checklist: { lines: ["Stretch"] } };
    await renderWithHang(
      <SetsScreen run={{ ...run, items: [warm, run.items[1]!, run.items[2]!, cool] }} />,
      hangData()
    );
    expect(screen.getByText("Exercise 1 of 2")).toBeTruthy();
    await fireEvent.press(screen.getByLabelText("Jog"));
    await fireEvent.press(screen.getByLabelText("Stretch"));
    await fireEvent.press(screen.getByText("Finish"));
    const { params } = (router.replace as jest.Mock).mock.calls.at(-1)![0] as {
      params: { done: string };
    };
    const done = JSON.parse(params.done) as { checklist?: { checked: number[] } }[];
    expect(done.filter((d) => d.checklist !== undefined).map((d) => d.checklist?.checked)).toEqual([
      [0],
      [0],
    ]);
  });

  it("shows no exercise counter on a run that is only a checklist", async () => {
    const warm = { exercise: "Checklist", dose: { sets: 1 }, checklist: { lines: ["Jog"] } };
    await renderWithHang(<SetsScreen run={{ ...run, items: [warm] }} />, hangData());
    expect(screen.queryByText(/^Exercise \d/)).toBeNull();
  });

  it("skips an exercise to the end and logs exercises in the order they ended in", async () => {
    await renderWithHang(<SetsScreen run={run} />, hangData());
    await fireEvent.press(screen.getAllByLabelText("More for this exercise")[0]!);
    await fireEvent.press(screen.getByText("Skip for now"));
    const skipped = "Open Back squat, Skipped";
    expect(readingOrder("Row, set 1", "Plank, set 1", skipped)).toEqual([
      "Row, set 1",
      "Plank, set 1",
      skipped,
    ]);
    await fireEvent.press(screen.getByLabelText(skipped));
    await fireEvent.press(screen.getByLabelText("Back squat, set 1"));
    await fireEvent.press(screen.getByText("Finish"));
    const { params } = (router.replace as jest.Mock).mock.calls.at(-1)![0] as {
      params: { done: string; off: string };
    };
    expect((JSON.parse(params.done) as { exercise: string }[]).map((d) => d.exercise)).toEqual([
      "Row",
      "Plank",
      "Back squat",
    ]);
    expect(JSON.parse(params.off)).toEqual(["0:0", "1:0", "2:1"]);
  });

  it("opens a workout with no exercises on its description, unfolded", async () => {
    const bare: WorkoutRun = { ...run, kind: "other", items: [] };
    await renderWithHang(<SetsScreen run={bare} />, hangData(), {
      workouts: [
        {
          id: "w1",
          kind: "other",
          name: "Warm-up",
          description: "1. Jog 5 min\n2. Arm circles x20",
          minutes: 15,
          targetRpe: null,
          items: [],
          exerciseRestS: 60,
          focus: null,
          updatedAt: "2026-10-01T00:00:00.000Z",
        },
      ],
    });
    expect(screen.getByText("Arm circles x20")).toBeTruthy();
    expect(screen.queryByText("Add exercise")).toBeNull();
    expect(screen.getByText("Finish")).toBeTruthy();
  });

  it("never names which alternate an exercise runs", async () => {
    const alternating: WorkoutRun = {
      ...run,
      items: [
        { exercise: "Back squat", dose: { sets: 3, reps: 10, name: "Light" }, turn: 1 },
        { exercise: "Row", dose: { sets: 1, reps: 8 }, turn: 0 },
        { exercise: "Plank", dose: { sets: 1, onS: 30 } },
      ],
    };
    await renderWithHang(<SetsScreen run={alternating} />, hangData());
    for (const shown of ["A", "B", "Light"]) expect(screen.queryByText(shown)).toBeNull();
    expect(screen.getByText("3 sets × 10 reps")).toBeTruthy();
  });

  it("times a timed set in its row after a count-in, records what it held, and rests", async () => {
    const planks: WorkoutRun = {
      ...run,
      items: [{ exercise: "Plank", dose: { sets: 2, onS: 30, setRestS: 20 } }],
    };
    await renderWithHang(<SetsScreen run={planks} />, hangData());
    await fireEvent.press(screen.getByLabelText("Start Plank, 0:30"));
    expect(screen.getByText("Ready")).toBeTruthy();
    expect(screen.getByText("3")).toBeTruthy();
    await advance(13_000);
    expect(screen.getByText("0:10")).toBeTruthy();
    expect(screen.getByText("of 0:30")).toBeTruthy();
    expect(liveRun.read()?.hold?.name).toBe("Plank");
    await fireEvent.press(screen.getByRole("button", { name: "Done" }));
    expect(screen.getByLabelText("Plank, set 1")).toHaveProp("accessibilityState", {
      checked: true,
    });
    expect(screen.getByLabelText("Rest, 0:20 left")).toBeTruthy();

    await fireEvent.press(screen.getByLabelText("Start Plank, 0:30"));
    expect(screen.queryByLabelText("Rest, 0:20 left")).toBeNull();
    await advance(34_000);
    expect(liveRun.read()?.hold).toBeUndefined();
    expect(liveRun.read()?.state).toEqual({
      player: "sets",
      done: [
        expect.objectContaining({
          sets: [
            { onS: 10, setRestS: 20 },
            { onS: 30, setRestS: 20 },
          ],
        }),
      ],
      ticked: ["0:0", "0:1"],
      cards: { base: 1, order: [0], added: [], skipped: [], ended: [0], shut: [], open: [] },
    });
  });

  it("cancels a timed set from its count-in without recording it", async () => {
    const planks: WorkoutRun = {
      ...run,
      items: [{ exercise: "Plank", dose: { sets: 1, onS: 30 } }],
    };
    await renderWithHang(<SetsScreen run={planks} />, hangData());
    await fireEvent.press(screen.getByLabelText("Start Plank, 0:30"));
    await advance(1_000);
    await fireEvent.press(screen.getByRole("button", { name: "Done" }));
    expect(screen.getByLabelText("Plank, set 1")).toHaveProp("accessibilityState", {
      checked: false,
    });
    expect(screen.getByLabelText("Start Plank, 0:30")).toBeTruthy();
  });

  it("records a timed set that reaches its target while minimised, and starts its rest", async () => {
    const planks: WorkoutRun = {
      ...run,
      items: [{ exercise: "Plank", dose: { sets: 2, onS: 30, setRestS: 20 } }],
    };
    const root = await renderHook(() => useLiveHold());
    const view = await renderWithHang(<SetsScreen run={planks} />, hangData());
    await fireEvent.press(screen.getByLabelText("Start Plank, 0:30"));
    await view.unmount();
    await advance(35_000);
    expect(liveRun.read()?.hold).toBeUndefined();
    expect(liveRun.read()?.state).toMatchObject({
      ticked: ["0:0"],
      done: [{ sets: [{ onS: 30 }, {}] }],
    });
    expect(liveRun.read()?.rest).toMatchObject({ at: "0:0", seconds: 20 });
    await renderWithHang(<SetsScreen run={planks} />, hangData());
    expect(screen.getByLabelText("Plank, set 1")).toHaveProp("accessibilityState", {
      checked: true,
    });
    expect(screen.getByLabelText("Rest, 0:18 left")).toBeTruthy();
    await root.unmount();
  });

  it("runs a mix's grips as one fingerboard part: Start opens the timer, its ended rows edit in place, Finish logs the rest", async () => {
    const mix: WorkoutRun = {
      ...run,
      title: "Fingers and pull",
      items: [
        { exercise: "half", dose: { sets: 2, reps: 3, onS: 7, offS: 3 } },
        { exercise: "Row", dose: { sets: 1, reps: 8 } },
      ],
    };
    const view = await renderWithHang(<SetsScreen run={mix} />);
    expect(screen.getByText("Fingerboard")).toBeTruthy();
    expect(screen.getByText("Exercise 1 of 2")).toBeTruthy();
    expect(screen.getByText("Half crimp")).toBeTruthy();
    expect(screen.queryByLabelText("Half crimp, set 1")).toBeNull();
    await fireEvent.press(screen.getByText("Start"));
    expect(router.push).toHaveBeenCalledWith({
      pathname: "/workout/timer",
      params: { workoutId: "w1", gripId: "half", part: "1" },
    });
    await view.unmount();

    const live = liveRun.read();
    if (live === null || live.state.player !== "sets") throw new Error("no live run");
    const planned = {
      items: [
        {
          workout: {
            name: "Fingers and pull",
            kind: "hang" as const,
            hangS: 7,
            restS: 3,
            reps: 3,
            sets: 2,
            setRestS: 0,
            id: "w1",
            source: "mine" as const,
            grip: "half",
            timeUnits: { hangS: "s" as const, restS: "s" as const, setRestS: "s" as const },
          },
          dose: mix.items[0]?.dose,
        },
      ] as const,
      exerciseRestS: 120,
    };
    liveRun.writeAsIs({
      ...live,
      state: {
        ...live.state,
        fingers: {
          done: [
            {
              item: 0,
              exercise: "half",
              sets: [
                { reps: 3, onS: 7 },
                { reps: 0, onS: 7 },
              ],
            },
          ],
          setups: [{ edgeMm: 20, loadKg: 0 }],
          planned: { ...planned, items: [...planned.items] },
        },
      },
    });
    await renderWithHang(<SetsScreen run={mix} />);
    expect(screen.getByText("3 of 6 hangs")).toBeTruthy();
    expect(screen.getByLabelText("Half crimp, set 1 · Hangs")).toBeTruthy();
    await fireEvent.press(screen.getByText("Finish"));
    const [[{ params }]] = (router.replace as jest.Mock).mock.calls.slice(-1) as [
      [{ params: { done: string } }],
    ];
    expect(JSON.parse(params.done).map((d: { exercise: string }) => d.exercise)).toEqual(["Row"]);
  });
  it("counts the exercise after a finished fingerboard part while the warm-up checklist is still open", async () => {
    const warm = { exercise: "Checklist", dose: { sets: 1 }, checklist: { lines: ["Jog"] } };
    const mix: WorkoutRun = {
      ...run,
      title: "Warm-up, fingers and pull",
      items: [
        warm,
        { exercise: "half", dose: { sets: 1, reps: 1, onS: 7, offS: 0 } },
        { exercise: "Row", dose: { sets: 1, reps: 8 } },
      ],
    };
    const view = await renderWithHang(<SetsScreen run={mix} />);
    expect(screen.getByText("Exercise 1 of 2")).toBeTruthy();
    await view.unmount();
    const live = liveRun.read();
    if (live === null || live.state.player !== "sets") throw new Error("no live run");
    liveRun.writeAsIs({
      ...live,
      state: {
        ...live.state,
        fingers: {
          done: [{ item: 1, exercise: "half", sets: [{ reps: 1, onS: 7 }] }],
          setups: [{ edgeMm: 20, loadKg: 0 }],
          planned: {
            items: [
              {
                workout: {
                  name: "Warm-up, fingers and pull",
                  kind: "hang",
                  hangS: 7,
                  restS: 0,
                  reps: 1,
                  sets: 1,
                  setRestS: 0,
                  id: "w1",
                  source: "mine",
                  grip: "half",
                  timeUnits: { hangS: "s", restS: "s", setRestS: "s" },
                },
                dose: { sets: 1, reps: 1, onS: 7, offS: 0 },
              },
            ],
            exerciseRestS: 0,
          },
        },
      },
    });
    await renderWithHang(<SetsScreen run={mix} />);
    expect(screen.getByLabelText("Jog")).toHaveProp("accessibilityState", { checked: false });
    expect(screen.getByText("Exercise 2 of 2")).toBeTruthy();
  });
  it("ends the run at its last tick when it sat open over 20 minutes after", async () => {
    await renderWithHang(<SetsScreen run={run} />, hangData());
    await advance(10 * 60_000);
    await fireEvent.press(screen.getByLabelText("Row, set 1"));
    await advance(2 * 60 * 60_000);
    await fireEvent.press(screen.getByText("Finish"));
    const { params } = (router.replace as jest.Mock).mock.calls.at(-1)![0] as {
      params: Record<string, string>;
    };
    expect([params.minutes, params.endTime, params.idle]).toEqual(["10", "18:15", "120"]);
  });
});
