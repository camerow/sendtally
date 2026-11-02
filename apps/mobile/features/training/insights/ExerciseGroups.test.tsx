import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, screen } from "@testing-library/react-native";
import { router } from "expo-router";
import React from "react";
import type { ExerciseGroupVM } from "@sendtally/features/statistics";
import { aHang, anExercise, hangData, renderWithHang } from "../data/renderWithHang";
import { ExerciseGroups } from "./ExerciseGroups";

jest.mock("expo-router", () => ({ router: { push: jest.fn() } }));
jest.mock("../../../lib/api", () => ({ useApi: () => undefined }));
jest.mock("@sendtally/features/activities", () => ({
  ...jest.requireActual<object>("@sendtally/features/activities"),
  useWeightUnit: () => "kg",
}));

const groups: ExerciseGroupVM[] = [
  {
    kind: "hangboard",
    rows: [
      {
        key: "half",
        name: "Half crimp",
        count: 1,
        values: [4],
        change: 0,
        metric: "load",
        meta: "20\u00A0mm · 10s · 1 time",
      },
    ],
  },
  {
    kind: "strength",
    rows: [
      { key: "pull-up", name: "Pull-up", count: 2, values: [5, 10], change: 5, metric: "load" },
      { key: "dips", name: "Dips", count: 1, values: [0], change: 0, metric: "load" },
    ],
  },
];

describe("exercise trends", () => {
  it("opens an exercise's trend over time, a grip on its own screen", async () => {
    await renderWithHang(<ExerciseGroups groups={groups} />, hangData(), {
      exercises: [anExercise("e1", "Pull-up", "strength")],
    });
    const pullUp = screen.getByLabelText("Pull-up, 2 times, +5 kg");
    expect(pullUp.props.accessibilityRole).toBe("button");
    await fireEvent.press(pullUp);
    expect(router.push).toHaveBeenCalledWith({ pathname: "/exercise/[id]", params: { id: "e1" } });

    expect(screen.getByText("20\u00A0mm · 10s · 1 time")).toBeTruthy();
    await fireEvent.press(screen.getByLabelText(/^Half crimp/));
    expect(router.push).toHaveBeenCalledWith({ pathname: "/grip/[id]", params: { id: "half" } });
  });

  it("compares grips from the hangboard heading once two are complete on one setup", async () => {
    await renderWithHang(
      <ExerciseGroups groups={groups} />,
      hangData({
        sessions: [aHang({ gripId: "half" }), aHang({ gripId: "open" })],
      })
    );
    await fireEvent.press(screen.getByLabelText("Compare exercises"));
    expect(router.push).toHaveBeenCalledWith("/grip/compare");
  });

  it("offers no compare with only one grip complete on a setup", async () => {
    await renderWithHang(
      <ExerciseGroups groups={groups} />,
      hangData({
        sessions: [aHang({ gripId: "half" }), aHang({ gripId: "open", pct: 50 })],
      })
    );
    expect(screen.queryByLabelText("Compare exercises")).toBeNull();
  });

  it("draws a sparkline from two points, none from one", async () => {
    await renderWithHang(<ExerciseGroups groups={groups} />);
    expect(screen.getAllByTestId("sparkline")).toHaveLength(1);
  });

  it("leaves a row with nowhere to go as a plain row", async () => {
    await renderWithHang(<ExerciseGroups groups={groups} />);
    expect(screen.getByLabelText(/^Dips/).props.accessibilityRole).toBeUndefined();
  });
});
