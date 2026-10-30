import { describe, expect, it, jest } from "@jest/globals";
import { act, fireEvent, screen } from "@testing-library/react-native";
import { router } from "expo-router";
import React from "react";
import { renderWithHang } from "../data/renderWithHang";
import type { WorkoutRun } from "../data/workoutRunParams";
import { ChecklistScreen } from "./ChecklistScreen";

jest.mock("expo-router", () => ({ router: { replace: jest.fn(), back: jest.fn() } }));
jest.mock("../../../lib/api", () => ({ useApi: () => undefined }));
jest.mock("@sendtally/features/activities", () => ({
  ...jest.requireActual<object>("@sendtally/features/activities"),
  useWeightUnit: () => "kg",
}));

const run: WorkoutRun = {
  kind: "mobility",
  title: "Morning mobility",
  date: "2026-10-22",
  workoutId: "w2",
  link: { membershipId: null, week: null, focus: null },
  minutes: 12,
  exerciseRestS: 60,
  items: [
    { exercise: "Cat-cow", dose: { sets: 2 } },
    { exercise: "Wrist circles", dose: { sets: 1 } },
  ],
};

describe("Checklist player", () => {
  it("ticks lines off, rests before the next, and logs the ticked ones on the clock, the rest unticked", async () => {
    jest.useFakeTimers({ now: new Date(2026, 9, 22, 7) });
    await renderWithHang(<ChecklistScreen run={run} />);
    expect(screen.getByText("Mobility · 12m")).toBeTruthy();
    const catCow = screen.getByLabelText("Cat-cow, 2 sets");
    await fireEvent.press(catCow);
    expect(catCow.props.accessibilityState).toEqual({ checked: true });
    expect(screen.getByText("Next: Wrist circles")).toBeTruthy();
    await act(async () => {
      jest.advanceTimersByTime(4 * 60_000);
    });
    expect(screen.queryByText("Next: Wrist circles")).toBeNull();
    await fireEvent.press(screen.getByLabelText("Wrist circles, 1 set"));
    await fireEvent.press(screen.getByLabelText("Wrist circles, 1 set"));

    await fireEvent.press(screen.getByText("Done for today"));
    expect(router.replace).toHaveBeenCalledWith({
      pathname: "/activity/new",
      params: {
        kind: "mobility",
        title: "Morning mobility",
        date: "2026-10-22",
        workoutId: "w2",
        minutes: "4",
        done: JSON.stringify([
          { item: 0, exercise: "Cat-cow", sets: [{}, {}] },
          { item: 1, exercise: "Wrist circles", sets: [{}] },
        ]),
        startTime: "07:00",
        off: JSON.stringify(["1:0"]),
        live: "1",
      },
    });
    jest.useRealTimers();
  });
});
