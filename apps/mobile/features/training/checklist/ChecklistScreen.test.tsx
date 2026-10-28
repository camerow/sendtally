import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, screen } from "@testing-library/react-native";
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
  link: { membershipId: null, week: null },
  minutes: 12,
  items: [
    { exercise: "Cat-cow", dose: { sets: 2 } },
    { exercise: "Wrist circles", dose: { sets: 1 } },
  ],
};

describe("Checklist player", () => {
  it("ticks lines off and hands the ticked ones to the activity form", async () => {
    await renderWithHang(<ChecklistScreen run={run} />);
    expect(screen.getByText("Mobility · 12m")).toBeTruthy();
    const catCow = screen.getByLabelText("Cat-cow, 2 sets");
    await fireEvent.press(catCow);
    expect(catCow.props.accessibilityState).toEqual({ checked: true });
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
        minutes: "12",
        done: JSON.stringify([{ item: 0, exercise: "Cat-cow", sets: [{}, {}] }]),
      },
    });
  });
});
