import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render, screen } from "@testing-library/react-native";
import React from "react";
import { WorkoutWeeks, type WorkoutWeek } from "./WorkoutWeeks";

const workouts: WorkoutWeek[] = [
  { id: "a", name: "Max hangs", kind: "hangboard", mine: false, days: [0] },
  { id: "b", name: "Pull day", kind: "strength", mine: true, days: [2] },
];

describe("WorkoutWeeks", () => {
  it("gives each workout its own seven days, and a day toggles that workout on it", async () => {
    const onToggle = jest.fn();
    await render(
      <WorkoutWeeks workouts={workouts} meta="2 sessions" dim={[]} onToggle={onToggle} />
    );
    expect(screen.getAllByRole("checkbox")).toHaveLength(14);
    const wednesdays = screen.getAllByLabelText("Wednesday");
    expect(wednesdays[0]?.props.accessibilityState).toEqual({ checked: false });
    expect(wednesdays[1]?.props.accessibilityState).toEqual({ checked: true });
    await fireEvent.press(screen.getAllByLabelText("Friday")[1]!);
    expect(onToggle).toHaveBeenCalledWith("b", 4);
  });
});
