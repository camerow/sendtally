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
  link: { membershipId: "m1", week: 2, variation: 0 },
  minutes: 45,
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
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it("ticks sets without a rest clock and hands what was done to the activity form", async () => {
    await render(<SetsScreen run={run} />);
    expect(screen.getByText("Strength · 45m")).toBeTruthy();
    expect(screen.getAllByText("5 × 100 kg")).toHaveLength(2);
    expect(screen.getByText("30s")).toBeTruthy();
    expect(screen.getByText("Last 5 × 97.5 kg")).toBeTruthy();
    expect(screen.getByText("Last 8 × 60 kg")).toBeTruthy();
    await fireEvent.press(screen.getByLabelText("Back squat, set 1"));
    expect(screen.queryByText(/^Rest/)).toBeNull();
    await advance(30_000);

    const reps = screen.getByLabelText("Back squat, set 2 · Reps");
    await fireEvent(reps, "focus");
    await fireEvent.changeText(reps, "4");
    await fireEvent(reps, "blur");
    await fireEvent.press(screen.getByLabelText("Back squat, set 2"));
    await advance(120_000);
    expect(screen.getByLabelText("Row, set 1 · Weight").props.value).toBe("60");
    await fireEvent.press(screen.getByLabelText("Row, set 1"));

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
          { item: 1, exercise: "Row", sets: [{ reps: 8, weightKg: 60 }] },
          { item: 2, exercise: "Plank", sets: [] },
        ]),
      },
    });
  });
});
