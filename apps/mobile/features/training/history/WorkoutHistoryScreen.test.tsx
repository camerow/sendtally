import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { fireEvent, screen } from "@testing-library/react-native";
import { router } from "expo-router";
import React from "react";
import type { ActivityRecord, WorkoutRecord } from "@sendtally/api-client";
import { hangData, readingOrder, renderWithHang } from "../data/renderWithHang";
import { WorkoutHistoryScreen } from "./WorkoutHistoryScreen";

jest.mock("expo-router", () => ({ router: { push: jest.fn(), back: jest.fn() } }));
jest.mock("../../../lib/api", () => ({ useApi: () => undefined }));

const legs: WorkoutRecord = {
  id: "legs",
  kind: "strength",
  name: "Gym, legs",
  description: "",
  minutes: 50,
  targetRpe: null,
  items: [],
  exerciseRestS: 180,
  focus: null,
  updatedAt: "t",
};

const ran = (id: string, date: string, workoutId = "legs"): ActivityRecord => ({
  id,
  kind: "strength",
  title: "Gym, legs",
  date,
  startTime: null,
  minutes: 45,
  rpe: 7,
  notes: null,
  workoutId,
  membershipId: null,
  week: null,
  focus: null,
  done: [],
  stravaActivityId: null,
  postedAt: null,
  postState: null,
  postError: null,
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe("A workout's history", () => {
  it("lists only its sessions, newest first, each titled by its day and opening it", async () => {
    await renderWithHang(<WorkoutHistoryScreen id="legs" current="a2" />, hangData(), {
      workouts: [legs],
      activities: [ran("a1", "2026-09-20"), ran("a2", "2026-09-27"), ran("x", "2026-09-25", "o")],
    });
    expect(screen.getByRole("header", { name: "Gym, legs" })).toBeTruthy();
    expect(readingOrder("Sun, Sep 27", "Sun, Sep 20")).toEqual(["Sun, Sep 27", "Sun, Sep 20"]);
    expect(screen.queryByText("Fri, Sep 25")).toBeNull();
    await fireEvent.press(screen.getByText("Sun, Sep 20"));
    expect(router.push).toHaveBeenCalledWith({ pathname: "/activity/[id]", params: { id: "a1" } });
  });

  it("says so when it has none", async () => {
    await renderWithHang(<WorkoutHistoryScreen id="legs" />, hangData(), { workouts: [legs] });
    expect(screen.getByText("No sessions yet")).toBeTruthy();
  });
});
