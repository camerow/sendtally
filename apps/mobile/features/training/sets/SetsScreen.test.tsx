import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { act, fireEvent, screen } from "@testing-library/react-native";
import { router } from "expo-router";
import React from "react";
import { hangData, renderWithHang } from "../data/renderWithHang";
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
  link: { membershipId: "m1", week: 2 },
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
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it("rests in line after each tick, folds a finished exercise, and logs the clock's minutes", async () => {
    const { useAudioPlayer } = jest.requireMock<{ useAudioPlayer: () => { play: () => void } }>(
      "expo-audio"
    );
    const tone = jest.spyOn(useAudioPlayer(), "play");
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
          updatedAt: "2026-10-01T00:00:00.000Z",
        },
      ],
    });
    expect(screen.getByText("Strength · 45m")).toBeTruthy();
    expect(screen.getByText("Heavy squats, then rows.")).toBeTruthy();
    expect(screen.getByText("Target effort 8")).toBeTruthy();
    expect(screen.getAllByText("5 × 100 kg")).toHaveLength(2);
    expect(screen.getByText("30s")).toBeTruthy();
    expect(screen.getByText("Last 5 × 97.5 kg")).toBeTruthy();
    expect(screen.getByText("Last 8 × 60 kg")).toBeTruthy();
    expect(screen.getByText("8 × 60 kg")).toBeTruthy();
    expect(screen.getByText("1:30 rest")).toBeTruthy();
    await fireEvent.press(screen.getByLabelText("Back squat, set 1"));
    expect(screen.getByLabelText("Rest, 1:30 left")).toBeTruthy();
    await advance(30_000);
    expect(screen.getByLabelText("Rest, 1:00 left")).toBeTruthy();
    expect(screen.getByText("0:30")).toBeTruthy();

    const reps = screen.getByLabelText("Back squat, set 2 · Reps");
    await fireEvent(reps, "focus");
    await fireEvent.changeText(reps, "4");
    await fireEvent(reps, "blur");
    await fireEvent.press(screen.getByLabelText("Back squat, set 2"));
    expect(screen.queryByLabelText("Rest, 1:00 left")).toBeNull();
    expect(screen.getByLabelText("Back squat, 2 of 2 sets")).toBeTruthy();
    expect(screen.getByText("Next: Row")).toBeTruthy();
    expect(screen.getByLabelText("Rest, 2:00 left")).toBeTruthy();
    expect(tone).not.toHaveBeenCalled();
    await advance(120_000);
    expect(screen.queryByText("Next: Row")).toBeNull();
    expect(tone).toHaveBeenCalledTimes(1);
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
