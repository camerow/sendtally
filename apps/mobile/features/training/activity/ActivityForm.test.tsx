import { describe, expect, it, jest } from "@jest/globals";
import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { router } from "expo-router";
import { Alert } from "react-native";
import React from "react";
import type { ActivityRecord } from "@sendtally/api-client";
import type * as Activities from "@sendtally/features/activities";
import { activityFromDraft, newActivityDraft } from "@sendtally/features/activities";
import { ActivityForm } from "./ActivityForm";

const mockActions = { saveActivity: jest.fn(), deleteActivity: jest.fn() };
const mockWorkouts = { saveWorkout: jest.fn(), deleteWorkout: jest.fn() };

jest.mock("../../../components/Sheet", () => ({
  Sheet: ({ visible, children }: { visible: boolean; children: React.ReactNode }) =>
    visible ? children : null,
}));
jest.mock("expo-router", () => ({
  router: { back: jest.fn(), push: jest.fn(), dismiss: jest.fn() },
}));
jest.mock("expo-crypto", () => ({ randomUUID: () => "w-new" }));
jest.mock("@sendtally/features/workouts", () => ({ useWorkoutActions: () => mockWorkouts }));
jest.mock("../../../lib/api", () => ({ useApi: () => undefined }));
jest.mock("@sendtally/features/activities", () => {
  const actual = jest.requireActual<typeof Activities>("@sendtally/features/activities");
  return {
    ...actual,
    useActivityActions: () => mockActions,
    useWeightUnit: () => "kg",
  };
});

const logged = (post: Partial<ActivityRecord> = {}): ActivityRecord => ({
  ...activityFromDraft("a1", newActivityDraft({}, "2026-10-22")),
  stravaActivityId: null,
  postedAt: null,
  postState: null,
  postError: null,
  ...post,
});

async function keys(...pressed: string[]): Promise<void> {
  for (const key of pressed) await fireEvent.press(screen.getByLabelText(key));
}

describe("Log activity", () => {
  it("saves an untitled activity under its kind's name with its effort, from the header", async () => {
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
    expect(router.back).toHaveBeenCalled();
  });

  it("keeps a timed run's start and length, showing only its date", async () => {
    const initial = newActivityDraft(
      { kind: "mobility", startTime: "07:00", minutes: "4" },
      "2026-10-22"
    );
    await render(<ActivityForm id="a1" initial={initial} logged={null} timed kindSet />);
    expect(screen.getByTestId("activity-date")).toBeTruthy();
    expect(screen.queryByTestId("activity-time")).toBeNull();
    expect(screen.queryAllByText("Strength")).toHaveLength(1);
    expect(screen.queryByLabelText("Duration")).toBeNull();
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
    await render(<ActivityForm id="a1" initial={initial} logged={null} />);
    expect(screen.getByRole("header", { name: "Strength" })).toBeTruthy();
    expect(screen.queryByTestId("activity-title")).toBeNull();
    expect(screen.getByText("Back squat")).toBeTruthy();
    expect(screen.getByText("2 sets · kg")).toBeTruthy();
    expect(screen.getAllByText("5 × 100")).toHaveLength(2);
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
    expect(screen.getByText("8")).toBeTruthy();
    expect(screen.getByText("6")).toBeTruthy();

    await fireEvent.press(screen.getByLabelText("Edit Back squat"));
    await fireEvent.press(screen.getByText("Add set"));
    await keys("Back squat, set 2 · Reps", "4", "Done");
    await fireEvent.press(screen.getByLabelText("Edit Pull-up"));
    expect(screen.queryByLabelText("Back squat, set 2 · Reps")).toBeNull();
    expect(screen.getAllByText("5 × 100")).toHaveLength(1);
    expect(screen.getByText("4 × 100")).toBeTruthy();
    await fireEvent.press(screen.getByLabelText("Remove set 1"));
    await fireEvent.press(screen.getByText("Done"));
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
    await fireEvent.press(screen.getByLabelText("Edit Back squat"));
    await fireEvent.press(screen.getByLabelText("Remove set 1"));
    expect(alert.mock.calls[0]?.[0]).toBe("Remove Back squat?");
    expect(screen.getByText("Back squat")).toBeTruthy();
    const buttons = alert.mock.calls[0]?.[2] ?? [];
    await act(async () => buttons.find((b) => b.style === "destructive")?.onPress?.());
    expect(screen.queryByText("Back squat")).toBeNull();
    expect(screen.queryByText("Details")).toBeNull();
    alert.mockRestore();
  });

  it("ticks a checklist's items, fixes a hold's seconds, and saves only what is ticked", async () => {
    const done = [
      { item: 0, exercise: "Cat-cow", sets: [{}] },
      { item: 1, exercise: "Pigeon", sets: [{ onS: 60 }] },
      { item: 2, exercise: "Jefferson curl", sets: [{}] },
    ];
    const initial = newActivityDraft(
      { kind: "mobility", workoutId: "w2", done: JSON.stringify(done), skipped: "[2]" },
      "2026-10-22"
    );
    await render(<ActivityForm id="a1" initial={initial} logged={null} />);
    expect(screen.getByText("2 of 3 done")).toBeTruthy();
    expect(screen.getByText("60s")).toBeTruthy();
    await fireEvent.press(screen.getByRole("checkbox", { name: "Jefferson curl" }));
    await fireEvent.press(screen.getByRole("checkbox", { name: "Cat-cow" }));
    expect(screen.getByText("2 of 3 done")).toBeTruthy();
    await fireEvent.press(screen.getByLabelText("Edit Pigeon"));
    await keys("Pigeon, set 1 · Hold", "9", "0", "Done");
    await fireEvent.press(screen.getByLabelText("Edit Pigeon"));
    expect(screen.getByText("90s")).toBeTruthy();
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
