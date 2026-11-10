import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { act, fireEvent, screen } from "@testing-library/react-native";
import { randomUUID } from "expo-crypto";
import { router } from "expo-router";
import React from "react";
import { Alert } from "react-native";
import type { WorkoutRecord } from "@sendtally/api-client";
import type * as Workouts from "@sendtally/features/workouts";
import { aHang, anExercise, hangData, renderWithHang } from "../data/renderWithHang";
import { ExerciseEditorScreen } from "../exercises/ExerciseEditorScreen";
import { WorkoutEditorScreen } from "./WorkoutEditorScreen";

const mockWorkouts = { saveWorkout: jest.fn(), deleteWorkout: jest.fn() };
const mockApi = { saveExercise: jest.fn<(...args: unknown[]) => Promise<unknown>>() };

jest.mock("../../../lib/api", () => ({ useApi: () => mockApi }));
jest.mock("../../../components/Sheet", () => {
  const { useEffect } = jest.requireActual<typeof React>("react");
  return {
    Sheet: function MockSheet({
      visible,
      onClose,
      children,
      footer,
    }: {
      visible: boolean;
      onClose: () => void;
      children: React.ReactNode;
      footer?: React.ReactNode;
    }) {
      useEffect(() => {
        if (!visible) onClose();
      }, [visible, onClose]);
      return visible ? (
        <>
          {children}
          {footer}
        </>
      ) : null;
    },
  };
});
jest.mock("expo-router", () => ({ router: { back: jest.fn(), push: jest.fn() } }));
jest.mock("expo-crypto", () => ({ randomUUID: jest.fn() }));
jest.mock("@sendtally/features/workouts", () => ({
  ...jest.requireActual<typeof Workouts>("@sendtally/features/workouts"),
  useWorkoutActions: () => mockWorkouts,
}));

const squat = anExercise("e1", "Back squat", "strength");
const world = { exercises: [squat] };

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(randomUUID).mockReturnValue("w-new");
  jest.spyOn(Alert, "alert").mockImplementation(() => undefined);
});

async function pick(...names: string[]): Promise<void> {
  await fireEvent.press(screen.getByText("Add exercises"));
  for (const name of names) await fireEvent.press(screen.getByRole("checkbox", { name }));
  await fireEvent.press(
    screen.getByText(`Add ${names.length} exercise${names.length === 1 ? "" : "s"}`)
  );
  await act(async () => undefined);
}

async function keys(...pressed: string[]): Promise<void> {
  for (const key of pressed) await fireEvent.press(screen.getByLabelText(key));
}

/** Opens a field and types its digits on the keypad, then Done. */
async function type(label: string, digits: string, index = 0): Promise<void> {
  await fireEvent.press(screen.getAllByLabelText(label)[index]!);
  await keys(...digits, "Done");
}

describe("Workout editor", () => {
  it("starts on General and saves the focus picked, saying what it means", async () => {
    await renderWithHang(<WorkoutEditorScreen kind="climbing" />, hangData(), world);
    await fireEvent.press(screen.getByRole("button", { name: "Focus, General" }));
    await fireEvent.press(screen.getByRole("radio", { name: "Power endurance" }));
    expect(screen.getByText("Hard efforts of one to a few minutes with short rests.")).toBeTruthy();
    await fireEvent.press(screen.getByText("Save"));
    const [, saved] = mockWorkouts.saveWorkout.mock.calls[0] as [string, Workouts.WorkoutDraft];
    expect(saved.focus).toBe("power_endurance");
  });

  it("starts on the focus of the shelf it was made from", async () => {
    await renderWithHang(<WorkoutEditorScreen kind="strength" focus="power" />, hangData(), world);
    expect(screen.getByRole("button", { name: "Focus, Power" })).toBeTruthy();
  });

  it("starts a new fingers workout with no exercises", async () => {
    await renderWithHang(<WorkoutEditorScreen kind="hangboard" />, hangData(), world);
    expect(screen.queryByText("Half crimp")).toBeNull();
  });

  it("makes a strength workout whose squat alternates a named A and B, resting between sets", async () => {
    await renderWithHang(<WorkoutEditorScreen kind="strength" />, hangData(), world);
    await fireEvent.changeText(screen.getByLabelText("Name"), "Leg day");
    await pick("Back squat");
    await type("Reps", "5");
    await type("Weight", "100");

    await fireEvent.press(screen.getByLabelText("Alternate sessions: Back squat"));
    await type("Reps B", "10");
    await fireEvent.changeText(screen.getByLabelText("Name A"), "Heavy");
    await fireEvent.changeText(screen.getByLabelText("Name B"), " Light ");
    await type("Rest between sets", "200");
    await type("Rest between exercises", "300");
    await fireEvent.press(screen.getByText("Save"));

    expect(mockWorkouts.saveWorkout).toHaveBeenCalledWith("w-new", {
      kind: "strength",
      name: "Leg day",
      description: "",
      minutes: null,
      targetRpe: null,
      items: [
        {
          id: "w-new",
          exercise: "Back squat",
          doses: [
            { sets: 3, reps: 5, weightKg: 100, setRestS: 120, name: "Heavy" },
            { sets: 3, reps: 10, weightKg: 100, setRestS: 120, name: "Light" },
          ],
        },
      ],
      exerciseRestS: 180,
      focus: null,
    });
    expect(router.back).toHaveBeenCalled();
  });

  it("adds and removes a third alternate from the exercise's menu sheet", async () => {
    await renderWithHang(<WorkoutEditorScreen kind="strength" />, hangData(), world);
    await pick("Back squat");
    await fireEvent.press(screen.getByLabelText("Alternate sessions: Back squat"));

    await fireEvent.press(screen.getByLabelText("More for this exercise"));
    await fireEvent.press(screen.getByText("Add C"));
    expect(screen.getByLabelText("Name C")).toBeTruthy();

    await fireEvent.press(screen.getByLabelText("More for this exercise"));
    expect(screen.getByText("Swap exercise")).toBeTruthy();
    expect(screen.getByText("Remove Back squat")).toBeTruthy();
    await fireEvent.press(screen.getByText("Remove C"));
    expect(screen.queryByLabelText("Name C")).toBeNull();
  });

  it("fills a dose row on one keypad, Next walking Sets, Reps, Weight and the rest", async () => {
    await renderWithHang(<WorkoutEditorScreen kind="strength" />, hangData(), world);
    await pick("Back squat");
    await fireEvent.press(screen.getByLabelText("Sets"));
    await keys("4", "Next");
    expect(screen.getByLabelText("Reps").props.accessibilityState).toEqual({ expanded: true });
    await keys("5", "Next", "1", "0", "0", "Add 2.5", "Next");
    expect(screen.getByLabelText("Rest between sets").props.accessibilityState).toEqual({
      expanded: true,
    });
    expect(screen.queryByLabelText("Next")).toBeNull();
    await keys("1", "3", "0", "Done");
    expect(screen.getByLabelText("Rest between sets").props.accessibilityValue).toEqual({
      text: "00:01:30",
    });
    await fireEvent.press(screen.getByText("Save"));

    const [, saved] = mockWorkouts.saveWorkout.mock.calls[0] as [string, Workouts.WorkoutDraft];
    expect(saved.items[0]?.doses).toEqual([{ sets: 4, reps: 5, weightKg: 102.5, setRestS: 90 }]);
  });

  it("types a weight in pounds and keeps it in kg", async () => {
    const data = hangData();
    await renderWithHang(
      <WorkoutEditorScreen kind="strength" />,
      { ...data, settings: { ...data.settings, units: "lb" } },
      world
    );
    await pick("Back squat");
    expect(screen.getByLabelText("Weight").props.accessibilityValue).toEqual({
      text: "Bodyweight lb",
    });
    await type("Weight", "135");
    await fireEvent.press(screen.getByText("Save"));

    const [, saved] = mockWorkouts.saveWorkout.mock.calls[0] as [string, Workouts.WorkoutDraft];
    expect(saved.items[0]?.doses[0]?.weightKg).toBeCloseTo(61.235, 3);
  });

  it("customises a built-in hangboard workout as a copy on another grip", async () => {
    await renderWithHang(<WorkoutEditorScreen from="max10" />);
    expect(screen.getByDisplayValue("Max hangs (copy)")).toBeTruthy();

    await fireEvent.press(screen.getByLabelText("Swap exercise"));
    expect(screen.queryByText("Back squat")).toBeNull();
    await fireEvent.press(screen.getByRole("button", { name: "Open hand" }));
    await act(async () => undefined);
    await type("Hang time", "12");
    expect(screen.queryByText("Duration")).toBeNull();
    expect(screen.getByText("13m")).toBeTruthy();
    await pick("Open hand");
    expect(screen.getByText("29m")).toBeTruthy();
    await type("Rest between exercises", "200");
    expect(screen.getByText("28m")).toBeTruthy();
    await fireEvent.press(screen.getByText("Save"));

    expect(mockWorkouts.saveWorkout).toHaveBeenCalledWith(
      "w-new",
      expect.objectContaining({
        kind: "hangboard",
        name: "Max hangs (copy)",
        minutes: null,
        exerciseRestS: 120,
        items: [
          { id: "0", exercise: "open", doses: [{ sets: 5, reps: 1, onS: 12, setRestS: 180 }] },
          { id: "w-new", exercise: "open", doses: [{ sets: 5, reps: 1, onS: 12, setRestS: 180 }] },
        ],
      })
    );
  });

  it("lists Fingers exercises with their best and last day, each with a pencil to its editor", async () => {
    await renderWithHang(<WorkoutEditorScreen from="max10" />, hangData({ sessions: [aHang()] }));
    await fireEvent.press(screen.getByLabelText("Swap exercise"));
    expect(screen.getByText(/^Best bodyweight · Sep 20$/)).toBeTruthy();
    expect(screen.getAllByText("Not done yet").length).toBeGreaterThan(0);
    await fireEvent.press(screen.getByLabelText("Edit Open hand"));
    expect(screen.queryByLabelText("Edit Open hand")).toBeNull();
    expect(router.push).toHaveBeenCalledWith({
      pathname: "/exercise/edit",
      params: { kind: "hangboard", id: "open" },
    });
  });

  it("moves an exercise up and down, each keeping its id so a block's week changes follow it", async () => {
    const legs: WorkoutRecord = {
      id: "legs",
      kind: "strength",
      name: "Legs",
      description: "",
      minutes: null,
      targetRpe: null,
      items: [
        { exercise: "Back squat", doses: [{ sets: 5, reps: 5 }] },
        { exercise: "Deadlift", doses: [{ sets: 3, reps: 5 }] },
        { exercise: "Lunge", doses: [{ sets: 3, reps: 10 }] },
      ],
      exerciseRestS: 180,
      focus: null,
      updatedAt: "2026-11-01T00:00:00.000Z",
    };
    await renderWithHang(<WorkoutEditorScreen id="legs" />, hangData(), {
      ...world,
      workouts: [legs],
    });
    expect(screen.queryByLabelText("Move Back squat up")).toBeNull();
    expect(screen.queryByLabelText("Move Lunge down")).toBeNull();
    await fireEvent.press(screen.getByLabelText("Move Lunge up"));
    await fireEvent.press(screen.getByLabelText("Move Back squat down"));
    await fireEvent.press(screen.getByText("Save"));
    const [, saved] = mockWorkouts.saveWorkout.mock.calls[0] as [string, Workouts.WorkoutDraft];
    expect(saved.items.map((i) => [i.id, i.exercise])).toEqual([
      ["2", "Lunge"],
      ["0", "Back squat"],
      ["1", "Deadlift"],
    ]);
  });

  it("adds ticked exercises in tick order, a built-in made the user's own, the ones it has tagged", async () => {
    mockApi.saveExercise.mockResolvedValue({
      exercise: anExercise("new-id", "Bench press", "strength", { builtIn: "benchPress" }),
    });
    let uuids = 0;
    jest.mocked(randomUUID).mockImplementation(() => (uuids++ === 0 ? "w-new" : `item-${uuids}`));
    await renderWithHang(<WorkoutEditorScreen kind="mobility" />, hangData(), world);
    await fireEvent.press(screen.getByText("Add exercises"));
    expect(screen.queryByRole("checkbox", { name: "Back squat" })).toBeNull();
    const strength = screen.getAllByRole("radio", { name: "Strength" }).at(-1);
    if (strength === undefined) throw new Error("no Strength filter");
    await fireEvent.press(strength);
    await fireEvent.press(screen.getByRole("checkbox", { name: "Bench press" }));
    await fireEvent.press(screen.getByRole("checkbox", { name: "Back squat" }));
    await fireEvent.press(screen.getByText("Add 2 exercises"));
    await act(async () => undefined);

    expect(mockApi.saveExercise).toHaveBeenCalledWith("w-new", {
      name: "Bench press",
      kind: "strength",
      measure: "repsWeight",
      eachSide: false,
      progress: null,
      builtIn: "benchPress",
    });
    await fireEvent.press(screen.getByText("Add exercises"));
    const filter = screen.getAllByRole("radio", { name: "Strength" }).at(-1);
    if (filter === undefined) throw new Error("no Strength filter");
    await fireEvent.press(filter);
    expect(screen.getAllByText("In workout")).toHaveLength(2);
    await fireEvent.press(screen.getByText("Save"));
    const [, saved] = mockWorkouts.saveWorkout.mock.calls[0] as [string, Workouts.WorkoutDraft];
    expect(saved.items.map((i) => i.exercise)).toEqual(["Bench press", "Back squat"]);
  });

  it("makes a new exercise from what was searched in its editor and adds it once saved", async () => {
    mockApi.saveExercise.mockResolvedValue({
      exercise: anExercise("new-id", "Nordic curl", "strength", { measure: "reps" }),
    });
    const editor = await renderWithHang(<WorkoutEditorScreen kind="strength" />, hangData(), world);
    await fireEvent.press(screen.getByText("Add exercises"));
    await fireEvent.changeText(screen.getByLabelText("Search exercises"), "Nordic curl");
    expect(screen.getByText("No exercise called Nordic curl")).toBeTruthy();
    await fireEvent.press(screen.getAllByText("New")[1]!);
    expect(editor.queryByLabelText("Search exercises")).toBeNull();
    const [[route]] = jest.mocked(router.push).mock.calls as unknown as [
      [{ pathname: string; params: { kind: "strength"; name: string; ret: string } }],
    ];
    expect(route.pathname).toBe("/exercise/edit");
    expect(route.params).toMatchObject({ kind: "strength", name: "Nordic curl" });

    const exercise = await renderWithHang(<ExerciseEditorScreen {...route.params} />);
    expect(exercise.getByDisplayValue("Nordic curl")).toBeTruthy();
    await fireEvent.press(exercise.getByRole("radio", { name: "Reps" }));
    await fireEvent.press(exercise.getByText("Save"));
    await act(async () => undefined);

    expect(mockApi.saveExercise).toHaveBeenCalledWith("w-new", {
      name: "Nordic curl",
      kind: "strength",
      measure: "reps",
      eachSide: false,
      progress: null,
      builtIn: null,
    });
    expect(editor.getByText("Nordic curl")).toBeTruthy();
    expect(editor.getByLabelText("Reps")).toBeTruthy();
    expect(editor.queryByLabelText("Weight (kg)")).toBeNull();
  });

  it("asks which category a new exercise is in when the picker shows all of them", async () => {
    await renderWithHang(<WorkoutEditorScreen kind="strength" />, hangData(), world);
    await fireEvent.press(screen.getByText("Add exercises"));
    await fireEvent.press(screen.getByRole("radio", { name: "All" }));
    await fireEvent.press(screen.getByText("New"));
    expect(screen.getByText("What kind of exercise?")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Fingers" })).toBeNull();
    await fireEvent.press(screen.getByRole("button", { name: "Mobility" }));
    await act(async () => undefined);
    expect(router.push).toHaveBeenCalledWith({
      pathname: "/exercise/edit",
      params: { kind: "mobility", ret: expect.any(String) },
    });
    expect(screen.queryByText("What kind of exercise?")).toBeNull();
    expect(screen.queryByLabelText("Search exercises")).toBeNull();
  });
});
