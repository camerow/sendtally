import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { router } from "expo-router";
import React from "react";
import type { WorkoutRun } from "../data/workoutRunParams";
import { SetsScreen } from "./SetsScreen";

jest.mock("expo-router", () => ({ router: { replace: jest.fn(), back: jest.fn() } }));
jest.mock("../../../lib/api", () => ({ useApi: () => undefined }));
jest.mock("@sendtally/features/activities", () => ({
  ...jest.requireActual<object>("@sendtally/features/activities"),
  useWeightUnit: () => "kg",
}));

const run: WorkoutRun = {
  kind: "strength",
  title: "Lower body A",
  date: "2026-10-22",
  workoutId: "w1",
  link: { membershipId: "m1", week: 2, variation: 0 },
  minutes: 45,
  exerciseRestS: 120,
  items: [
    { exercise: "Back squat", dose: { sets: 2, reps: 5, weightKg: 100, setRestS: 90 } },
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
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it("rests after each ticked set and hands what was done to the activity form", async () => {
    await render(<SetsScreen run={run} />);
    expect(screen.getByText("Strength · 45m")).toBeTruthy();
    expect(screen.getAllByText("5 × 100 kg")).toHaveLength(2);
    expect(screen.getByText("30s")).toBeTruthy();
    expect(screen.queryByText(/^Rest/)).toBeNull();

    await fireEvent.press(screen.getByLabelText("Back squat, set 1"));
    expect(screen.getByText("Rest 1:30")).toBeTruthy();
    await advance(30_000);
    expect(screen.getByText("Rest 1:00")).toBeTruthy();

    const reps = screen.getByLabelText("Back squat, set 2 · Reps");
    await fireEvent(reps, "focus");
    await fireEvent.changeText(reps, "4");
    await fireEvent(reps, "blur");
    await fireEvent.press(screen.getByLabelText("Back squat, set 2"));
    expect(screen.getByText("Rest 2:00")).toBeTruthy();
    await advance(120_000);
    expect(screen.queryByText(/^Rest/)).toBeNull();

    await fireEvent.press(screen.getByText("Finish"));
    expect(router.replace).toHaveBeenCalledWith({
      pathname: "/activity/new",
      params: {
        kind: "strength",
        title: "Lower body A",
        date: "2026-10-22",
        workoutId: "w1",
        minutes: "3",
        membershipId: "m1",
        week: "2",
        variation: "0",
        done: JSON.stringify([
          {
            item: 0,
            exercise: "Back squat",
            sets: [
              { reps: 5, weightKg: 100, setRestS: 90 },
              { reps: 4, weightKg: 100, setRestS: 90 },
            ],
          },
          { item: 1, exercise: "Plank", sets: [] },
        ]),
      },
    });
  });
});
