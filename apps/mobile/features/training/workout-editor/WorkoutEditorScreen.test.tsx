import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, screen } from "@testing-library/react-native";
import { router } from "expo-router";
import React from "react";
import type * as Workouts from "@sendtally/features/workouts";
import { hangData, renderWithHang } from "../data/renderWithHang";
import { WorkoutEditorScreen } from "./WorkoutEditorScreen";

const mockWorkouts = { saveWorkout: jest.fn(), deleteWorkout: jest.fn() };

jest.mock("../../../components/Sheet", () => ({
  Sheet: ({ visible, children }: { visible: boolean; children: React.ReactNode }) =>
    visible ? children : null,
}));
jest.mock("expo-router", () => ({ router: { back: jest.fn() } }));
jest.mock("expo-crypto", () => ({ randomUUID: () => "w-new" }));
jest.mock("@sendtally/features/workouts", () => ({
  ...jest.requireActual<typeof Workouts>("@sendtally/features/workouts"),
  useWorkoutActions: () => mockWorkouts,
}));

async function type(label: string, text: string, index = 0): Promise<void> {
  const field = screen.getAllByLabelText(label)[index]!;
  await fireEvent(field, "focus");
  await fireEvent.changeText(field, text);
  await fireEvent(field, "blur");
}

describe("Workout editor", () => {
  it("makes a strength workout that alternates A, A, B", async () => {
    await renderWithHang(<WorkoutEditorScreen kind="strength" />);
    await fireEvent.changeText(screen.getByLabelText("Name"), "Leg day");
    await fireEvent.changeText(screen.getByLabelText("Exercise"), "Back squat");
    await type("Reps", "5");
    await type("Weight (kg)", "100");

    await fireEvent.press(screen.getByLabelText("Alternates"));
    await fireEvent.changeText(screen.getByLabelText("Variation A"), "5×5");
    await fireEvent.changeText(screen.getByLabelText("Variation B"), "3×10");
    await type("Reps", "10", 1);
    await fireEvent.press(screen.getByLabelText("Session 2: B, tap to change"));
    await fireEvent.press(screen.getByLabelText("Add a step"));
    await fireEvent.press(screen.getByText("Save"));

    expect(mockWorkouts.saveWorkout).toHaveBeenCalledWith("w-new", {
      kind: "strength",
      name: "Leg day",
      description: "",
      minutes: null,
      targetRpe: null,
      variations: [
        {
          label: "5×5",
          items: [{ exercise: "Back squat", dose: { sets: 3, reps: 5, weightKg: 100 } }],
        },
        {
          label: "3×10",
          items: [{ exercise: "Back squat", dose: { sets: 3, reps: 10, weightKg: 100 } }],
        },
      ],
      pattern: [0, 0, 1],
      exerciseRestS: 180,
    });
    expect(router.back).toHaveBeenCalled();
  });

  it("saves a weight typed in pounds while its field still has focus", async () => {
    mockWorkouts.saveWorkout.mockClear();
    const data = hangData();
    await renderWithHang(<WorkoutEditorScreen kind="strength" />, {
      ...data,
      settings: { ...data.settings, units: "lb" },
    });
    await fireEvent.changeText(screen.getByLabelText("Exercise"), "Back squat");
    const weight = screen.getByLabelText("Weight (lb)");
    await fireEvent(weight, "focus");
    await fireEvent.changeText(weight, "135");
    await fireEvent.press(screen.getByText("Save"));

    const [, saved] = mockWorkouts.saveWorkout.mock.calls[0] as [string, Workouts.WorkoutDraft];
    expect(saved.variations[0]?.items[0]?.dose.weightKg).toBeCloseTo(61.235, 3);
  });

  it("customises a built-in hangboard workout as a copy on another grip", async () => {
    mockWorkouts.saveWorkout.mockClear();
    await renderWithHang(<WorkoutEditorScreen from="max10" />);
    expect(screen.getByDisplayValue("Max hangs (copy)")).toBeTruthy();

    await fireEvent.press(screen.getByLabelText("Choose a grip: Half crimp"));
    await fireEvent.press(screen.getByText("Open hand"));
    await type("Hang time", "12");
    expect(screen.queryByText("Minutes")).toBeNull();
    expect(screen.getByText("16m")).toBeTruthy();
    await fireEvent.press(screen.getByText("Add grip"));
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
        variations: [
          {
            label: "",
            items: [
              { exercise: "open", dose: { sets: 5, reps: 1, onS: 12, setRestS: 180 } },
              { exercise: "open", dose: { sets: 5, reps: 1, onS: 12, setRestS: 180 } },
            ],
          },
        ],
      })
    );
  });
});
