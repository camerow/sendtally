import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { act, fireEvent, screen } from "@testing-library/react-native";
import { router } from "expo-router";
import React from "react";
import { Alert, type AlertButton } from "react-native";
import { ApiError, type ActivityRecord, type WorkoutRecord } from "@sendtally/api-client";
import { anExercise, renderWithHang, hangData } from "../data/renderWithHang";
import { ExerciseScreen } from "./ExerciseScreen";

const mockApi = {
  saveExercise: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
  mergeExercise: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
  removeExercise: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
};

jest.mock("../../../lib/api", () => ({ useApi: () => mockApi }));
jest.mock("@sendtally/features/activities", () => ({
  ...jest.requireActual<object>("@sendtally/features/activities"),
  useWeightUnit: () => "kg",
}));
jest.mock("../../../components/Sheet", () => ({
  Sheet: ({ visible, children }: { visible: boolean; children: React.ReactNode }) =>
    visible ? children : null,
}));
jest.mock("expo-router", () => ({
  router: { push: jest.fn(), replace: jest.fn(), back: jest.fn() },
}));

const exercises = [
  anExercise("e1", "Back squat", "strength"),
  anExercise("e2", "Squat", "strength"),
];

const legs: WorkoutRecord = {
  id: "legs",
  kind: "strength",
  name: "Gym, legs",
  description: "",
  minutes: 50,
  targetRpe: null,
  items: [{ exercise: "back squat", doses: [{ sets: 5, reps: 5 }] }],
  exerciseRestS: 180,
  focus: null,
  updatedAt: "t",
};

const squatted: ActivityRecord = {
  id: "a1",
  kind: "strength",
  title: "Legs",
  date: "2026-09-22",
  startTime: null,
  minutes: 50,
  rpe: 7,
  notes: null,
  workoutId: "legs",
  membershipId: null,
  week: null,
  focus: null,
  done: [{ item: 0, exercise: "Back squat", sets: [{ reps: 5, weightKg: 100 }] }],
  stravaActivityId: null,
  postedAt: null,
  postState: null,
  postError: null,
};

const world = { exercises, workouts: [legs], activities: [squatted] };

const press = async (title: string): Promise<void> => {
  const calls = jest.mocked(Alert.alert).mock.calls;
  const buttons = (calls[calls.length - 1]?.[2] ?? []) as AlertButton[];
  const button = buttons.find((b) => b.text === title);
  expect(button).toBeDefined();
  await act(async () => button?.onPress?.());
};

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(Alert, "alert").mockImplementation(() => undefined);
});

describe("exercise screen", () => {
  it("shows its best set and the workouts that use it", async () => {
    await renderWithHang(<ExerciseScreen id="e1" />, hangData(), world);
    expect(screen.getByText("Heaviest set done")).toBeTruthy();
    expect(screen.getByText("Used in")).toBeTruthy();
    await fireEvent.press(screen.getByText("Gym, legs"));
    expect(router.push).toHaveBeenCalledWith({
      pathname: "/workout/[id]",
      params: { id: "legs" },
    });
  });

  it("offers to merge when a rename takes another exercise's name", async () => {
    mockApi.saveExercise.mockRejectedValue(
      new ApiError(409, "name taken", { exercise: exercises[1] })
    );
    mockApi.mergeExercise.mockResolvedValue({ exercise: exercises[1] });
    await renderWithHang(<ExerciseScreen id="e1" />, hangData(), world);
    await fireEvent.press(screen.getByLabelText("More for this exercise"));
    await press("Edit");
    await fireEvent.changeText(screen.getByLabelText("Name"), "squat");
    await fireEvent.press(screen.getByText("Save"));
    expect(mockApi.saveExercise).toHaveBeenCalledWith("e1", {
      name: "squat",
      kind: "strength",
      measure: "repsWeight",
      eachSide: false,
    });
    await act(async () => undefined);
    expect(Alert.alert).toHaveBeenLastCalledWith(
      "Merge Back squat into Squat?",
      "Every workout and log that names Back squat will name Squat instead.",
      expect.anything()
    );
    await press("Merge");
    await act(async () => undefined);
    expect(mockApi.mergeExercise).toHaveBeenCalledWith("e1", "e2");
    expect(router.replace).toHaveBeenCalledWith({
      pathname: "/exercise/[id]",
      params: { id: "e2" },
    });
  });

  it("warns before changing how a logged exercise is measured", async () => {
    mockApi.saveExercise.mockResolvedValue({ exercise: exercises[0] });
    await renderWithHang(<ExerciseScreen id="e1" />, hangData(), world);
    await fireEvent.press(screen.getByLabelText("More for this exercise"));
    await press("Edit");
    await fireEvent.press(screen.getByText("Seconds"));
    await fireEvent.press(screen.getByLabelText("Each side"));
    await fireEvent.press(screen.getByText("Save"));
    expect(mockApi.saveExercise).not.toHaveBeenCalled();
    expect(Alert.alert).toHaveBeenLastCalledWith(
      "Change how Back squat is measured?",
      "Sets you logged keep their numbers. New sets ask for the new fields.",
      expect.anything()
    );
    await press("Change");
    expect(mockApi.saveExercise).toHaveBeenCalledWith("e1", {
      name: "Back squat",
      kind: "strength",
      measure: "seconds",
      eachSide: true,
    });
  });

  it("archives an exercise in use and deletes one nothing uses, asking first", async () => {
    mockApi.removeExercise.mockResolvedValue({ removed: "archived" });
    await renderWithHang(<ExerciseScreen id="e1" />, hangData(), world);
    await fireEvent.press(screen.getByLabelText("More for this exercise"));
    await press("Archive");
    expect(Alert.alert).toHaveBeenLastCalledWith(
      "Archive Back squat?",
      "It leaves the picker and Exercises but keeps its history. Making it again brings it back.",
      expect.anything()
    );
    await press("Archive");
    expect(mockApi.removeExercise).toHaveBeenCalledWith("e1");
    expect(router.back).toHaveBeenCalled();

    await renderWithHang(<ExerciseScreen id="e2" />, hangData(), world);
    await fireEvent.press(screen.getByLabelText("More for this exercise"));
    await press("Delete");
    expect(Alert.alert).toHaveBeenLastCalledWith(
      "Delete Squat?",
      "Nothing uses it, so it goes for good.",
      expect.anything()
    );
  });
});
