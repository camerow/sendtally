import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { router } from "expo-router";
import React from "react";
import type { WorkoutDoneVM, WorkoutGroupVM } from "@sendtally/features/statistics";
import { WorkoutsDone } from "./WorkoutsDone";

jest.mock("expo-router", () => ({ router: { push: jest.fn(), navigate: jest.fn() } }));

const row = (key: string, name: string, total: number): WorkoutDoneVM => ({
  key,
  name,
  kind: "hangboard",
  meta: `${total} times`,
  sessions: [
    { id: `${key}-1`, dateLabel: "Sat, Nov 1", duration: "38m", rpe: "RPE 8" },
    { id: `${key}-2`, dateLabel: "Wed, Oct 29", duration: null, rpe: null },
  ],
  total,
});

const groups: WorkoutGroupVM[] = [
  {
    key: "hangboard",
    label: "Fingers",
    kind: "hangboard",
    rows: [row("max", "Max hangs", 14), row("rep", "Repeaters 7:3", 9)],
  },
];

describe("Workouts done", () => {
  it("opens one workout at a time to its last sessions", async () => {
    await render(<WorkoutsDone groups={groups} picked={null} onClear={() => {}} />);
    expect(screen.getByText("Workouts · most done first")).toBeTruthy();
    expect(screen.queryByText("Sat, Nov 1")).toBeNull();
    expect(screen.getAllByText("Fingers")).toHaveLength(1);

    await fireEvent.press(screen.getByLabelText("Max hangs, 14 times"));
    expect(screen.getByText("All 14 in Log")).toBeTruthy();

    await fireEvent.press(screen.getByLabelText("Repeaters 7:3, 9 times"));
    expect(screen.getByText("All 9 in Log")).toBeTruthy();
    expect(screen.queryByText("All 14 in Log")).toBeNull();
  });

  it("opens a session's summary, and the log narrowed to the workout", async () => {
    await render(<WorkoutsDone groups={groups} picked={null} onClear={() => {}} />);
    await fireEvent.press(screen.getByLabelText("Max hangs, 14 times"));
    await fireEvent.press(screen.getByLabelText("Sat, Nov 1, 38m, RPE 8"));
    expect(router.push).toHaveBeenLastCalledWith({
      pathname: "/activity/[id]",
      params: { id: "max-1" },
    });
    await fireEvent.press(screen.getByText("All 14 in Log"));
    expect(router.navigate).toHaveBeenLastCalledWith({
      pathname: "/(tabs)/sessions",
      params: { segment: "training", workout: "max" },
    });
  });

  it("names what the list is narrowed to, with a way to clear it", async () => {
    const onClear = jest.fn();
    await render(<WorkoutsDone groups={[]} picked="Power" onClear={onClear} />);
    expect(screen.getByText("Workouts · Power")).toBeTruthy();
    expect(screen.getByText("No Power workouts in this range")).toBeTruthy();
    await fireEvent.press(screen.getByText("Clear"));
    expect(onClear).toHaveBeenCalled();
  });

  it("says nothing with no workouts and nothing picked", async () => {
    await render(<WorkoutsDone groups={[]} picked={null} onClear={() => {}} />);
    expect(screen.queryByText("Workouts · most done first")).toBeNull();
  });
});
