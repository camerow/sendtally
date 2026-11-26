import { describe, expect, it, jest } from "@jest/globals";
import { act, fireEvent, render as rtlRender, screen, within } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { router } from "expo-router";
import { Alert } from "react-native";
import React from "react";
import type { ActivityRecord } from "@sendtally/api-client";
import type * as Activities from "@sendtally/features/activities";
import { activityFromDraft, justLogged, newActivityDraft } from "@sendtally/features/activities";
import { readingOrder } from "../data/renderWithHang";
import { ActivityForm } from "./ActivityForm";

const render = (ui: React.ReactElement): ReturnType<typeof rtlRender> =>
  rtlRender(<QueryClientProvider client={new QueryClient()}>{ui}</QueryClientProvider>);

const mockActions = {
  saveActivity: jest.fn(async (): Promise<boolean> => true),
  deleteActivity: jest.fn(async (): Promise<boolean> => true),
};
const mockWorkouts = { saveWorkout: jest.fn(), deleteWorkout: jest.fn() };

jest.mock("../../../components/Sheet", () => ({
  Sheet: ({ visible, children }: { visible: boolean; children: React.ReactNode }) =>
    visible ? children : null,
}));
jest.mock("expo-router", () => ({
  router: {
    canGoBack: jest.fn(() => true),
    back: jest.fn(),
    push: jest.fn(),
    dismiss: jest.fn(),
    replace: jest.fn(),
    dismissAll: jest.fn(),
    canDismiss: jest.fn(() => true),
  },
}));
jest.mock("expo-crypto", () => ({ randomUUID: () => "w-new" }));
jest.mock("@sendtally/features/workouts", () => ({
  ...jest.requireActual<object>("@sendtally/features/workouts"),
  useWorkoutActions: () => mockWorkouts,
}));
const mockApi = { climbs: () => Promise.resolve({ climbs: [] }) };
jest.mock("../../../lib/api", () => ({ useApi: () => mockApi }));
jest.mock("@sendtally/features/hang", () => ({
  ...jest.requireActual<object>("@sendtally/features/hang"),
  useGrips: () => ({ isGrip: () => false, gripName: (id: string) => id }),
}));
jest.mock("@sendtally/features/statistics", () => ({
  useExercises: () => ({
    state: {
      status: "ready",
      data: [{ name: "Circuit laps", kind: "climbing", measure: "laps", eachSide: false }],
    },
  }),
}));
jest.mock("@sendtally/features/activities", () => {
  const actual = jest.requireActual<typeof Activities>("@sendtally/features/activities");
  return {
    ...actual,
    useActivityActions: () => mockActions,
  };
});
jest.mock("../data/WithWeightUnit", () => ({
  WithWeightUnit: ({ children }: { children: (unit: "kg") => unknown }) => children("kg"),
}));

const logged = (post: Partial<ActivityRecord> = {}): ActivityRecord => ({
  ...activityFromDraft("a1", newActivityDraft({}, "2026-10-22")),
  stravaActivityId: null,
  postedAt: null,
  postState: null,
  postError: null,
  ...post,
});

/** Selects the nth set row by its number, then presses the Remove that takes the number's place. */
async function removeSetRow(n: number, of: number, position = n): Promise<void> {
  const rows = screen.getAllByTestId("review-set");
  expect(rows).toHaveLength(of);
  const row = rows[n - 1];
  if (row === undefined) throw new Error(`no set row ${n}`);
  await fireEvent.press(within(row).getByText(String(position)));
  await fireEvent.press(screen.getByLabelText(`Remove set ${position}`));
}

async function keys(...pressed: string[]): Promise<void> {
  for (const key of pressed) await fireEvent.press(screen.getByLabelText(key));
}

describe("Log activity", () => {
  it("saves an untitled activity under its kind's name with its effort, from the header, and lands on the tab it came from", async () => {
    jest.mocked(router.back).mockClear();
    await render(
      <ActivityForm id="a1" initial={newActivityDraft({}, "2026-10-22")} logged={null} />
    );
    await fireEvent.press(screen.getByText("Mobility"));
    await keys("Duration", "5", "4", "3", "0", "Done");
    await fireEvent.press(screen.getByLabelText("Effort 7 of 10"));
    expect(screen.queryByText("Training load")).toBeNull();
    expect(screen.getAllByText("Save")).toHaveLength(1);
    await fireEvent.press(screen.getByText("Save"));

    expect(mockActions.saveActivity).toHaveBeenCalledWith({
      id: "a1",
      kind: "mobility",
      title: "Mobility",
      date: "2026-10-22",
      startTime: null,
      minutes: 55,
      rpe: 7,
      notes: null,
      workoutId: null,
      membershipId: null,
      week: null,
      focus: null,
      done: [],
    });
    expect(router.dismissAll).toHaveBeenCalled();
    expect(router.back).not.toHaveBeenCalled();
    expect(justLogged.read()).toEqual({ id: "a1", name: "Mobility" });
  });

  it("lands on Today when nothing is under the review, as when the first-run wizard started the workout", async () => {
    jest.mocked(router.dismissAll).mockClear();
    jest.mocked(router.canDismiss).mockReturnValueOnce(false);
    jest.mocked(router.canGoBack).mockReturnValueOnce(false);
    await render(
      <ActivityForm id="a1" initial={newActivityDraft({}, "2026-10-22")} logged={null} />
    );
    await fireEvent.press(screen.getByText("Mobility"));
    await fireEvent.press(screen.getByText("Save"));
    expect(router.dismissAll).not.toHaveBeenCalled();
    expect(router.replace).toHaveBeenCalledWith("/(tabs)/today");
  });

  it("goes back to its parent when it cannot dismiss but has a screen under it", async () => {
    jest.mocked(router.dismissAll).mockClear();
    jest.mocked(router.back).mockClear();
    jest.mocked(router.replace).mockClear();
    jest.mocked(router.canDismiss).mockReturnValueOnce(false);
    await render(
      <ActivityForm id="a1" initial={newActivityDraft({}, "2026-10-22")} logged={null} />
    );
    await fireEvent.press(screen.getByText("Mobility"));
    await fireEvent.press(screen.getByText("Save"));
    expect(router.back).toHaveBeenCalledTimes(1);
    expect(router.dismissAll).not.toHaveBeenCalled();
    expect(router.replace).not.toHaveBeenCalled();
  });

  it("stays on the form with what is in it when the save fails", async () => {
    jest.mocked(router.dismissAll).mockClear();
    justLogged.clear();
    mockActions.saveActivity.mockResolvedValueOnce(false);
    await render(
      <ActivityForm id="a1" initial={newActivityDraft({}, "2026-10-22")} logged={null} />
    );
    await fireEvent.press(screen.getByText("Mobility"));
    await fireEvent.press(screen.getByText("Save"));
    expect(mockActions.saveActivity).toHaveBeenCalled();
    expect(router.dismissAll).not.toHaveBeenCalled();
    expect(justLogged.read()).toBeNull();
    expect(screen.getAllByText("Mobility").length).toBeGreaterThan(0);
  });

  it("reads a timed run's date, start and length, opening one in place to change it", async () => {
    const initial = newActivityDraft(
      { kind: "mobility", workoutId: "w1", startTime: "07:00", minutes: "4" },
      "2026-10-22"
    );
    await render(<ActivityForm id="a1" initial={initial} logged={null} timed kindSet />);
    expect(screen.queryByTestId("activity-date")).toBeNull();
    expect(screen.queryByTestId("activity-time")).toBeNull();
    expect(screen.queryByText("Focus")).toBeNull();
    await fireEvent.press(screen.getByLabelText(/^Started, /));
    expect(screen.getByTestId("activity-time")).toBeTruthy();
    expect(screen.getByText("Started")).toBeTruthy();
    expect(screen.queryByLabelText("Clear")).toBeNull();
    await fireEvent.press(screen.getByText("Save"));
    expect(mockActions.saveActivity).toHaveBeenLastCalledWith(
      expect.objectContaining({ kind: "mobility", startTime: "07:00", minutes: 4 })
    );
  });

  it("logs what a planned workout prescribes, and saves it with the plan it ran", async () => {
    const initial = newActivityDraft(
      { kind: "strength", membershipId: "m1", week: "2", workoutId: "w1" },
      "2026-10-22",
      [{ exercise: "Back squat", dose: { sets: 2, reps: 5, weightKg: 100 } }]
    );
    await render(
      <ActivityForm
        id="a1"
        initial={initial}
        logged={null}
        planned={[{ exercise: "Back squat", dose: { sets: 2, reps: 5, weightKg: 100 } }]}
      />
    );
    expect(screen.getByRole("header", { name: "Strength" })).toBeTruthy();
    expect(screen.queryByTestId("activity-title")).toBeNull();
    expect(screen.getByText("Back squat")).toBeTruthy();
    expect(screen.getByText("2 sets × 5 reps · 100 kg")).toBeTruthy();
    await fireEvent.press(screen.getByText("Save"));
    expect(mockActions.saveActivity).toHaveBeenLastCalledWith(
      expect.objectContaining({
        workoutId: "w1",
        membershipId: "m1",
        week: 2,
        done: [
          {
            item: 0,
            exercise: "Back squat",
            sets: [
              { reps: 5, weightKg: 100 },
              { reps: 5, weightKg: 100 },
            ],
          },
        ],
      })
    );
  });

  it("edits the sets of one exercise at a time in place, and saves them", async () => {
    const initial = {
      ...newActivityDraft({ kind: "strength", workoutId: "w1", title: "Lower body" }, "2026-10-22"),
      done: [
        { item: 0, exercise: "Back squat", sets: [{ reps: 5, weightKg: 100 }] },
        { item: 1, exercise: "Pull-up", sets: [{ reps: 8 }, { reps: 6, weightKg: 0 }] },
      ],
    };
    await render(<ActivityForm id="a1" initial={initial} logged={null} />);
    expect(screen.getByRole("header", { name: "Lower body" })).toBeTruthy();
    await fireEvent.press(screen.getByLabelText("Add a set to Back squat"));
    await keys("Back squat, set 2 · Reps", "4", "Done");
    await removeSetRow(3, 4, 1);
    await fireEvent.press(screen.getByText("Save"));

    expect(mockActions.saveActivity).toHaveBeenLastCalledWith(
      expect.objectContaining({
        title: "Lower body",
        done: [
          {
            item: 0,
            exercise: "Back squat",
            sets: [
              { reps: 5, weightKg: 100 },
              { reps: 4, weightKg: 100 },
            ],
          },
          { item: 1, exercise: "Pull-up", sets: [{ reps: 6, weightKg: 0 }] },
        ],
      })
    );
  });

  it("asks before removing an exercise's last set, then removes the exercise", async () => {
    const alert = jest.spyOn(Alert, "alert");
    alert.mockClear();
    const initial = {
      ...newActivityDraft({ kind: "strength" }, "2026-10-22"),
      done: [{ item: 0, exercise: "Back squat", sets: [{ reps: 5, weightKg: 100 }] }],
    };
    await render(<ActivityForm id="a1" initial={initial} logged={null} />);
    expect(screen.getByTestId("activity-title")).toBeTruthy();
    await removeSetRow(1, 1);
    expect(alert.mock.calls[0]?.[0]).toBe("Remove Back squat?");
    expect(screen.getByText("Back squat")).toBeTruthy();
    const buttons = alert.mock.calls[0]?.[2] ?? [];
    await act(async () => buttons.find((b) => b.style === "destructive")?.onPress?.());
    expect(screen.queryByText("Back squat")).toBeNull();
    expect(screen.queryByText("Details")).toBeNull();
    alert.mockRestore();
  });

  it("ticks sets on and off, fixes a hold's seconds, and saves only what is ticked", async () => {
    const done = [
      { item: 0, exercise: "Cat-cow", sets: [{}] },
      { item: 1, exercise: "Pigeon", sets: [{ onS: 60 }] },
      { item: 2, exercise: "Jefferson curl", sets: [{}] },
    ];
    const initial = newActivityDraft(
      { kind: "mobility", workoutId: "w2", done: JSON.stringify(done), off: '["2:0"]' },
      "2026-10-22"
    );
    await render(<ActivityForm id="a1" initial={initial} logged={null} />);
    expect(screen.getByText("Log workout")).toBeTruthy();
    expect(screen.getAllByText("Mobility").length).toBeGreaterThan(0);
    expect(screen.getByLabelText("Pigeon, set 1 · Hold")).toBeTruthy();
    expect(screen.getByRole("checkbox", { name: "Jefferson curl, set 1" })).not.toBeChecked();
    await fireEvent.press(screen.getByRole("checkbox", { name: "Jefferson curl, set 1" }));
    await fireEvent.press(screen.getByRole("checkbox", { name: "Cat-cow, set 1" }));
    expect(screen.getByRole("checkbox", { name: "Cat-cow, set 1" })).not.toBeChecked();
    await keys("Pigeon, set 1 · Hold", "9", "0", "Done");
    await fireEvent.press(screen.getByText("Save"));

    expect(mockActions.saveActivity).toHaveBeenLastCalledWith(
      expect.objectContaining({
        done: [
          { item: 1, exercise: "Pigeon", sets: [{ onS: 90 }] },
          { item: 2, exercise: "Jefferson curl", sets: [{}] },
        ],
      })
    );
  });

  it("reads each exercise against its own dose when the run logged them out of the workout's order", async () => {
    const done = [{ item: 0, exercise: "Pull-ups", sets: [{ reps: 6 }] }];
    const initial = newActivityDraft(
      { kind: "strength", workoutId: "w5", done: JSON.stringify(done) },
      "2026-11-18"
    );
    await render(
      <ActivityForm
        id="a1"
        initial={initial}
        logged={null}
        timed
        kindSet
        live
        planned={[
          { exercise: "half", dose: { sets: 3, reps: 6, onS: 7 } },
          { exercise: "Pull-ups", dose: { sets: 3, reps: 8 } },
        ]}
      />
    );
    expect(screen.getByText("3 sets × 8 reps")).toBeTruthy();
  });

  it("says under the measured duration that a run left open ended at its last set", async () => {
    const initial = newActivityDraft(
      { kind: "strength", workoutId: "w3", minutes: "47", startTime: "17:55" },
      "2026-11-16"
    );
    await render(
      <ActivityForm
        id="a1"
        initial={initial}
        logged={null}
        timed
        kindSet
        live
        idleEnd={{ minutes: 47, line: "Ended at your last set, 6:42 PM · left open 2h 23m after" }}
      />
    );
    expect(
      readingOrder("Duration, 47m", "Ended at your last set, 6:42 PM · left open 2h 23m after")
    ).toEqual(["Duration, 47m", "Ended at your last set, 6:42 PM · left open 2h 23m after"]);
  });

  it("drops that line once the duration is not the one the run was cut to", async () => {
    const initial = newActivityDraft(
      { kind: "strength", workoutId: "w3", minutes: "47", startTime: "17:55" },
      "2026-11-16"
    );
    await render(
      <ActivityForm
        id="a1"
        initial={{ ...initial, minutes: 50 }}
        logged={null}
        timed
        kindSet
        live
        idleEnd={{ minutes: 47, line: "Ended at your last set, 6:42 PM · left open 2h 23m after" }}
      />
    );
    expect(
      screen.queryByText("Ended at your last set, 6:42 PM · left open 2h 23m after")
    ).toBeNull();
  });

  it("states a circuit's target as laps of moves, its laps as the run's lap rows", async () => {
    const done = [{ item: 0, exercise: "Circuit laps", sets: [{ reps: 40 }, { reps: 8 }] }];
    const initial = newActivityDraft(
      { kind: "climbing", workoutId: "w4", done: JSON.stringify(done) },
      "2026-11-17"
    );
    await render(
      <ActivityForm
        id="a1"
        initial={initial}
        logged={null}
        timed
        kindSet
        live
        planned={[{ exercise: "Circuit laps", dose: { sets: 3, reps: 40 } }]}
      />
    );
    expect(screen.getByText("3 laps × 40 moves")).toBeTruthy();
    expect(screen.queryByText("8 of 40 moves")).toBeNull();
    expect(screen.queryByText("Lap")).toBeNull();
    expect(screen.getAllByText("of 40 moves")).toHaveLength(2);
    expect(screen.getByLabelText("Lap 2 · Fewer moves")).toBeTruthy();
    expect(screen.getByText("Add lap")).toBeTruthy();
    expect(screen.queryByText("Remove lap")).toBeNull();
    expect(screen.queryByText("Add set")).toBeNull();
  });

  it("corrects a timed lap's time in its row, as Log workout and Edit workout allow", async () => {
    const done = [{ item: 0, exercise: "Circuit laps", sets: [{ onS: 270 }, { onS: 200 }] }];
    const initial = newActivityDraft(
      { kind: "climbing", workoutId: "w4", done: JSON.stringify(done) },
      "2026-11-17"
    );
    await render(
      <ActivityForm
        id="a1"
        initial={initial}
        logged={null}
        timed
        kindSet
        live
        planned={[{ exercise: "Circuit laps", dose: { sets: 2, onS: 270 } }]}
      />
    );
    await fireEvent.press(screen.getByLabelText("Lap 2 · Time"));
    for (const key of ["3", "0", "0", "Done"]) await fireEvent.press(screen.getByLabelText(key));
    expect(screen.queryByText("3:20")).toBeNull();
    expect(screen.getAllByText(/3:00/).length).toBeGreaterThan(0);
  });

  it("groups a superset's members under one header, from the log itself", async () => {
    const group = { id: "s1", rounds: 2 };
    const done = [
      { item: 0, exercise: "Pull-ups", sets: [{ reps: 6 }, { reps: 6 }], group },
      { item: 1, exercise: "Push-ups", sets: [{ reps: 15 }, { reps: 15 }], group },
      { item: 2, exercise: "Plank", sets: [{ onS: 45 }] },
    ];
    const initial = newActivityDraft(
      { kind: "strength", workoutId: "w6", done: JSON.stringify(done), off: "[]" },
      "2026-11-18"
    );
    await render(<ActivityForm id="a1" initial={initial} logged={null} timed kindSet live />);
    expect([
      ...new Set(readingOrder("Superset · 2 rounds", "Pull-ups", "Push-ups", "Plank")),
    ]).toEqual(["Superset · 2 rounds", "Pull-ups", "Push-ups", "Plank"]);
    expect(screen.getAllByText("Superset · 2 rounds")).toHaveLength(1);
  });

  it("puts each checklist above the exercises, with no Sets heading", async () => {
    const done = [
      { item: 0, exercise: "Checklist", sets: [], checklist: { lines: ["Jog"], checked: [0] } },
      { item: 1, exercise: "Back squat", sets: [{ reps: 5 }] },
      { item: 2, exercise: "Checklist", sets: [], checklist: { lines: ["Stretch"], checked: [] } },
    ];
    const initial = newActivityDraft(
      { kind: "strength", workoutId: "w6", done: JSON.stringify(done), off: "[]" },
      "2026-11-18"
    );
    await render(<ActivityForm id="a1" initial={initial} logged={null} timed kindSet live />);
    expect([...new Set(readingOrder("Jog", "Stretch", "Back squat"))]).toEqual([
      "Jog",
      "Stretch",
      "Back squat",
    ]);
    expect(screen.queryByText("Sets")).toBeNull();
  });

  it("reviews a checklist as its lines with a tick each, no count", async () => {
    const lines = ["Jog 5 min", "Arm circles x20", "Easy boulders x10"];
    const done = [{ item: 0, exercise: "Checklist", sets: [], checklist: { lines, checked: [0] } }];
    const initial = newActivityDraft(
      { kind: "strength", workoutId: "w6", done: JSON.stringify(done), off: "[]" },
      "2026-11-18"
    );
    await render(<ActivityForm id="a1" initial={initial} logged={null} timed kindSet live />);
    expect(screen.getByText("Checklist")).toBeTruthy();
    expect(screen.queryByText("Checklist · 1 of 3")).toBeNull();
    const line = screen.getByRole("checkbox", { name: "Easy boulders x10" });
    expect(line).not.toBeChecked();
    await fireEvent.press(line);
    expect(screen.getByRole("checkbox", { name: "Easy boulders x10" })).toBeChecked();
    expect(screen.queryByText("Add set")).toBeNull();
  });

  it("keeps a climbing exercise with nothing logged, its planned sets there to climb in", async () => {
    const done = [{ item: 0, exercise: "Volume climbing", sets: [{ onS: 600 }, { onS: 600 }] }];
    const initial = newActivityDraft(
      { kind: "climbing", workoutId: "w6", done: JSON.stringify(done), off: '["0:0","0:1"]' },
      "2026-11-18"
    );
    await render(
      <ActivityForm
        id="a1"
        initial={initial}
        logged={null}
        timed
        kindSet
        live
        planned={[{ exercise: "Volume climbing", dose: { sets: 2, onS: 600 } }]}
      />
    );
    expect(screen.queryByText("Not started")).toBeNull();
    expect(screen.getByText("2 sets")).toBeTruthy();
    expect(screen.getByLabelText("Climb in set 2")).toBeTruthy();
    expect(screen.getAllByLabelText("V3")).toHaveLength(1);
  });

  it("edits a logged climbing exercise as the run drew it: attempts, Sent, a grade picked, Add set", async () => {
    const climb = { grade: "V3", scale: "v", tries: 1, sent: true, style: "flash" };
    const done = [{ item: 0, exercise: "Crimp crawls", sets: [{ climbs: [climb] }] }];
    const initial = newActivityDraft(
      { kind: "climbing", workoutId: "w6", done: JSON.stringify(done), off: "[]" },
      "2026-11-22"
    );
    await render(<ActivityForm id="a1" initial={initial} logged={null} />);
    await fireEvent.press(screen.getByLabelText("Increase Climb 1, V3 · Attempts"));
    await fireEvent.press(screen.getByLabelText("V5"));
    await fireEvent.press(screen.getByLabelText("Climb 2, V5, Sent"));
    await fireEvent.press(screen.getByText("Add set"));
    await fireEvent.press(screen.getByLabelText("V4"));
    await fireEvent.press(screen.getByText("Save"));
    expect(mockActions.saveActivity).toHaveBeenLastCalledWith(
      expect.objectContaining({
        done: [
          {
            item: 0,
            exercise: "Crimp crawls",
            sets: [
              {
                climbs: [
                  { grade: "V3", scale: "v", tries: 2, sent: true, style: "redpoint" },
                  { grade: "V5", scale: "v", tries: 1, sent: true, style: "flash" },
                ],
              },
              { climbs: [{ grade: "V4", scale: "v", tries: 1, sent: false }] },
            ],
          },
        ],
      })
    );
  });

  it("reviews a run: its target once in the head, no short line, and Discard ends the run once confirmed", async () => {
    jest.clearAllMocks();
    const alert = jest.spyOn(Alert, "alert").mockImplementation(() => undefined);
    const done = [
      { item: 0, exercise: "Ring row", sets: [{ reps: 10 }, { reps: 7 }, { reps: 10 }] },
    ];
    const initial = newActivityDraft(
      { kind: "strength", workoutId: "w3", done: JSON.stringify(done), off: '["0:2"]' },
      "2026-10-22"
    );
    await render(
      <ActivityForm
        id="a1"
        initial={initial}
        logged={null}
        timed
        kindSet
        live
        planned={[{ exercise: "Ring row", dose: { sets: 3, reps: 10 } }]}
      />
    );
    expect(screen.getAllByText("Strength").length).toBeGreaterThan(0);
    expect(screen.queryByText(/^From the timer/)).toBeNull();
    expect(screen.getByText("3 sets × 10 reps")).toBeTruthy();
    expect(screen.queryByText("7 of 10 reps")).toBeNull();
    expect(screen.queryByText("Remove last set")).toBeNull();
    await fireEvent.press(screen.getByText("Discard"));
    expect(router.back).not.toHaveBeenCalled();
    await act(async () =>
      jest
        .mocked(Alert.alert)
        .mock.calls.at(-1)?.[2]
        ?.find((b) => b.style === "destructive")
        ?.onPress?.()
    );
    expect(router.back).toHaveBeenCalled();
    expect(mockActions.saveActivity).not.toHaveBeenCalled();
    alert.mockRestore();
  });

  it("asks a set RPE of an exercise with a Target RPE or a rating already, and shows the session's Target RPE by the RPE field", async () => {
    const done = [
      { item: 0, exercise: "Pull-ups", sets: [{ reps: 5 }], targetRpe: 8 },
      { item: 1, exercise: "Dips", sets: [{ reps: 8 }] },
      { item: 2, exercise: "Rows", sets: [{ reps: 8, rpe: 7 }] },
    ];
    const initial = newActivityDraft(
      { kind: "strength", workoutId: "w7", done: JSON.stringify(done), off: "[]" },
      "2026-11-19"
    );
    await render(
      <ActivityForm id="a1" initial={initial} logged={null} timed kindSet live targetRpe={7} />
    );
    expect(screen.getByText("Target RPE 7/10")).toBeTruthy();
    expect(screen.getByLabelText("Pull-ups, set 1 · RPE")).toBeTruthy();
    expect(screen.queryByLabelText("Dips, set 1 · RPE")).toBeNull();
    expect(screen.getByLabelText("Rows, set 1 · RPE")).toBeTruthy();
  });

  it("selects a set by pressing its row, and a press off the rows unselects it", async () => {
    const done = [{ item: 0, exercise: "Dips", sets: [{ reps: 8 }, { reps: 8 }] }];
    const initial = newActivityDraft(
      { kind: "strength", workoutId: "w8", done: JSON.stringify(done), off: "[]" },
      "2026-11-19"
    );
    await render(<ActivityForm id="a1" initial={initial} logged={null} timed kindSet live />);
    const row = screen.getAllByTestId("review-set")[0];
    if (row === undefined) throw new Error("no set row");
    await fireEvent.press(within(row).getByText("1"));
    expect(screen.getByLabelText("Remove set 1")).toBeTruthy();
    await fireEvent.press(screen.getByTestId("review-body"));
    expect(screen.queryByLabelText("Remove set 1")).toBeNull();
  });

  it("asks Focus only of an activity with no workout, and saves Log it with the workout's focus", async () => {
    await render(
      <ActivityForm id="a1" initial={newActivityDraft({}, "2026-10-22")} logged={null} />
    );
    expect(screen.getByText("Focus")).toBeTruthy();
    const initial = newActivityDraft(
      { kind: "strength", workoutId: "w3", focus: "recovery" },
      "2026-10-22"
    );
    await render(<ActivityForm id="a1" initial={initial} logged={null} kindSet />);
    expect(screen.queryByText("Focus")).toBeNull();
    await fireEvent.press(screen.getByText("Save"));
    expect(mockActions.saveActivity).toHaveBeenLastCalledWith(
      expect.objectContaining({ focus: "recovery" })
    );
  });

  it("leaves Log it at once on Discard, with nothing to confirm", async () => {
    jest.clearAllMocks();
    const alert = jest.spyOn(Alert, "alert");
    const initial = newActivityDraft({ kind: "strength", workoutId: "w3" }, "2026-10-22");
    await render(<ActivityForm id="a1" initial={initial} logged={null} kindSet />);
    expect(screen.queryByText("Cancel")).toBeNull();
    await fireEvent.press(screen.getByText("Discard"));
    expect(alert).not.toHaveBeenCalled();
    expect(router.back).toHaveBeenCalled();
    alert.mockRestore();
  });

  it("saves what a logged session did as a library workout of its kind", async () => {
    const initial = {
      ...newActivityDraft({ kind: "mobility", title: "Hip flow" }, "2026-10-22"),
      rpe: 3,
      done: [{ item: 0, exercise: "Pigeon", sets: [{ onS: 60 }] }],
    };
    await render(<ActivityForm id="a1" initial={initial} logged={logged()} />);
    await fireEvent.press(screen.getByText("Save as workout"));
    expect(mockWorkouts.saveWorkout).toHaveBeenCalledWith("w-new", {
      kind: "mobility",
      name: "Hip flow",
      description: "",
      minutes: 60,
      targetRpe: 3,
      items: [{ exercise: "Pigeon", doses: [{ sets: 1, onS: 60 }] }],
      exerciseRestS: 0,
      focus: null,
    });
    expect(router.push).toHaveBeenCalledWith({
      pathname: "/workout/[id]",
      params: { id: "w-new" },
    });
  });

  it("keeps a logged activity's kind", async () => {
    await render(
      <ActivityForm id="a1" initial={newActivityDraft({}, "2026-10-22")} logged={logged()} />
    );
    expect(screen.queryByText("Mobility")).toBeNull();
  });

  it("offers no Save as workout with nothing done", async () => {
    await render(
      <ActivityForm id="a1" initial={newActivityDraft({}, "2026-10-22")} logged={logged()} />
    );
    expect(screen.queryByText("Save as workout")).toBeNull();
  });

  it("edits under the workout's name, with no Delete: that lives in the summary's menu", async () => {
    const initial = newActivityDraft({ kind: "strength", title: "Lower body" }, "2026-10-22");
    await render(<ActivityForm id="a1" initial={initial} logged={logged()} />);
    expect(screen.getByText("Edit workout")).toBeTruthy();
    expect(screen.queryByText("Delete workout")).toBeNull();
  });
});
