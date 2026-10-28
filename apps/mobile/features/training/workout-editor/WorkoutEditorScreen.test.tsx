import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { act, fireEvent, screen } from "@testing-library/react-native";
import { router } from "expo-router";
import React from "react";
import { Alert } from "react-native";
import type * as Workouts from "@sendtally/features/workouts";
import { anExercise, hangData, renderWithHang } from "../data/renderWithHang";
import { WorkoutEditorScreen } from "./WorkoutEditorScreen";

const mockWorkouts = { saveWorkout: jest.fn(), deleteWorkout: jest.fn() };
const mockApi = { saveExercise: jest.fn<(...args: unknown[]) => Promise<unknown>>() };

jest.mock("../../../lib/api", () => ({ useApi: () => mockApi }));
jest.mock("../../../components/Sheet", () => ({
  Sheet: ({
    visible,
    children,
    footer,
  }: {
    visible: boolean;
    children: React.ReactNode;
    footer?: React.ReactNode;
  }) =>
    visible ? (
      <>
        {children}
        {footer}
      </>
    ) : null,
}));
jest.mock("expo-router", () => ({ router: { back: jest.fn() } }));
jest.mock("expo-crypto", () => ({ randomUUID: () => "w-new" }));
jest.mock("@sendtally/features/workouts", () => ({
  ...jest.requireActual<typeof Workouts>("@sendtally/features/workouts"),
  useWorkoutActions: () => mockWorkouts,
}));

const squat = anExercise("e1", "Back squat", "strength");
const world = { exercises: [squat] };

beforeEach(() => {
  jest.clearAllMocks();
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

async function type(label: string, text: string, index = 0): Promise<void> {
  const field = screen.getAllByLabelText(label)[index]!;
  await fireEvent(field, "focus");
  await fireEvent.changeText(field, text);
  await fireEvent(field, "blur");
}

describe("Workout editor", () => {
  it("makes a strength workout whose squat alternates a named A and B, resting between sets", async () => {
    await renderWithHang(<WorkoutEditorScreen kind="strength" />, hangData(), world);
    await fireEvent.changeText(screen.getByLabelText("Name"), "Leg day");
    await pick("Back squat");
    await type("Reps", "5");
    await type("Weight (kg)", "100");

    await fireEvent.press(screen.getByLabelText("Alternate sessions: Back squat"));
    await type("Reps B", "10");
    await fireEvent.changeText(screen.getByLabelText("Name A"), "Heavy");
    await fireEvent.changeText(screen.getByLabelText("Name B"), " Light ");
    await type("Rest between sets", "2:00");
    await type("Rest between exercises", "3:00");
    await fireEvent.press(screen.getByText("Save"));

    expect(mockWorkouts.saveWorkout).toHaveBeenCalledWith("w-new", {
      kind: "strength",
      name: "Leg day",
      description: "",
      minutes: null,
      targetRpe: null,
      items: [
        {
          exercise: "Back squat",
          doses: [
            { sets: 3, reps: 5, weightKg: 100, setRestS: 120, name: "Heavy" },
            { sets: 3, reps: 10, weightKg: 100, setRestS: 120, name: "Light" },
          ],
        },
      ],
      exerciseRestS: 180,
    });
    expect(router.back).toHaveBeenCalled();
  });

  it("saves a weight typed in pounds while its field still has focus", async () => {
    const data = hangData();
    await renderWithHang(
      <WorkoutEditorScreen kind="strength" />,
      { ...data, settings: { ...data.settings, units: "lb" } },
      world
    );
    await pick("Back squat");
    const weight = screen.getByLabelText("Weight (lb)");
    await fireEvent(weight, "focus");
    await fireEvent.changeText(weight, "135");
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
    expect(screen.queryByText("Minutes")).toBeNull();
    expect(screen.getByText("16m")).toBeTruthy();
    await pick("Open hand");
    expect(screen.getByText("35m")).toBeTruthy();
    await type("Rest between exercises", "2:00");
    expect(screen.getByText("34m")).toBeTruthy();
    await fireEvent.press(screen.getByText("Save"));

    expect(mockWorkouts.saveWorkout).toHaveBeenCalledWith(
      "w-new",
      expect.objectContaining({
        kind: "hangboard",
        name: "Max hangs (copy)",
        minutes: null,
        exerciseRestS: 120,
        items: [
          { exercise: "open", doses: [{ sets: 5, reps: 1, onS: 12, setRestS: 180 }] },
          { exercise: "open", doses: [{ sets: 5, reps: 1, onS: 12, setRestS: 180 }] },
        ],
      })
    );
  });

  it("adds ticked exercises in tick order, a built-in made the user's own, the ones it has tagged", async () => {
    mockApi.saveExercise.mockResolvedValue({
      exercise: anExercise("new-id", "Bench press", "strength", { builtIn: "benchPress" }),
    });
    await renderWithHang(<WorkoutEditorScreen kind="mobility" />, hangData(), world);
    await fireEvent.press(screen.getByText("Add exercises"));
    expect(screen.queryByRole("checkbox", { name: "Back squat" })).toBeNull();
    await fireEvent.press(screen.getByRole("radio", { name: "Strength" }));
    await fireEvent.press(screen.getByRole("checkbox", { name: "Bench press" }));
    await fireEvent.press(screen.getByRole("checkbox", { name: "Back squat" }));
    await fireEvent.press(screen.getByText("Add 2 exercises"));
    await act(async () => undefined);

    expect(mockApi.saveExercise).toHaveBeenCalledWith("w-new", {
      name: "Bench press",
      kind: "strength",
      measure: "repsWeight",
      eachSide: false,
      builtIn: "benchPress",
    });
    await fireEvent.press(screen.getByText("Add exercises"));
    await fireEvent.press(screen.getByRole("radio", { name: "Strength" }));
    expect(screen.getAllByText("In workout")).toHaveLength(2);
    await fireEvent.press(screen.getByText("Save"));
    const [, saved] = mockWorkouts.saveWorkout.mock.calls[0] as [string, Workouts.WorkoutDraft];
    expect(saved.items.map((i) => i.exercise)).toEqual(["Bench press", "Back squat"]);
  });

  it("makes a new exercise from what was searched and adds it once saved", async () => {
    mockApi.saveExercise.mockResolvedValue({
      exercise: anExercise("new-id", "Nordic curl", "strength", { measure: "reps" }),
    });
    await renderWithHang(<WorkoutEditorScreen kind="strength" />, hangData(), world);
    await fireEvent.press(screen.getByText("Add exercises"));
    await fireEvent.changeText(screen.getByLabelText("Search exercises"), "Nordic curl");
    expect(screen.getByText("No exercise called Nordic curl")).toBeTruthy();
    await fireEvent.press(screen.getAllByText("New")[1]!);
    expect(screen.getAllByDisplayValue("Nordic curl")).toHaveLength(2);
    await fireEvent.press(screen.getAllByText("Save").at(-1)!);
    await act(async () => undefined);

    expect(screen.getByText("Nordic curl")).toBeTruthy();
    expect(screen.getByLabelText("Reps")).toBeTruthy();
    expect(screen.queryByLabelText("Weight (kg)")).toBeNull();
  });
});
