import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, screen } from "@testing-library/react-native";
import { router } from "expo-router";
import React from "react";
import type * as Workouts from "@sendtally/features/workouts";
import { renderWithHang } from "../data/renderWithHang";
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
        { label: "5×5", items: [{ exercise: "Back squat", dose: { sets: 3, reps: 5 } }] },
        { label: "3×10", items: [{ exercise: "Back squat", dose: { sets: 3, reps: 10 } }] },
      ],
      pattern: [0, 0, 1],
    });
    expect(router.back).toHaveBeenCalled();
  });

  it("customises a built-in hangboard workout as a copy on another grip", async () => {
    mockWorkouts.saveWorkout.mockClear();
    await renderWithHang(<WorkoutEditorScreen from="max10" />);
    expect(screen.getByDisplayValue("Max hangs (copy)")).toBeTruthy();

    await fireEvent.press(screen.getByLabelText("Choose a grip: Half crimp"));
    await fireEvent.press(screen.getByText("Open hand"));
    await type("Hang", "12");
    await fireEvent.press(screen.getByText("Save"));

    expect(mockWorkouts.saveWorkout).toHaveBeenCalledWith(
      "w-new",
      expect.objectContaining({
        kind: "hangboard",
        name: "Max hangs (copy)",
        variations: [
          {
            label: "",
            items: [{ exercise: "open", dose: { sets: 5, reps: 1, onS: 12, setRestS: 180 } }],
          },
        ],
      })
    );
  });
});
