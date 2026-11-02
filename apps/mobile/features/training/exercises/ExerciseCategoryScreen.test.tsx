import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { fireEvent, screen } from "@testing-library/react-native";
import { router } from "expo-router";
import React from "react";
import { anExercise, hangData, renderWithHang } from "../data/renderWithHang";
import { ExerciseCategoryScreen } from "./ExerciseCategoryScreen";

jest.mock("expo-router", () => ({ router: { push: jest.fn(), back: jest.fn() } }));

beforeEach(() => {
  jest.clearAllMocks();
});

describe("exercise category", () => {
  it("lists the category's exercises with the user's own badged, to search, open or add to", async () => {
    await renderWithHang(<ExerciseCategoryScreen kind="strength" />, hangData(), {
      exercises: [
        anExercise("e1", "Nordic curl", "strength"),
        anExercise("e2", "Pigeon", "mobility"),
      ],
    });
    expect(screen.getByText("Strength")).toBeTruthy();
    expect(screen.getByText("A lift, like Back squat.")).toBeTruthy();
    expect(screen.getByText("Nordic curl")).toBeTruthy();
    expect(screen.getByText("Back squat")).toBeTruthy();
    expect(screen.queryByText("Pigeon")).toBeNull();
    expect(screen.getAllByText("Mine")).toHaveLength(1);

    await fireEvent.changeText(screen.getByLabelText("Search Strength"), "nordic");
    expect(screen.queryByText("Back squat")).toBeNull();
    await fireEvent.press(screen.getByText("Nordic curl"));
    expect(router.push).toHaveBeenLastCalledWith({
      pathname: "/exercise/[id]",
      params: { id: "e1" },
    });

    await fireEvent.press(screen.getByLabelText("New exercise in Strength"));
    expect(router.push).toHaveBeenLastCalledWith({
      pathname: "/exercise/edit",
      params: { kind: "strength" },
    });
  });
});
