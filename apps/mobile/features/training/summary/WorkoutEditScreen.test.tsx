import { describe, expect, it, jest } from "@jest/globals";
import { screen } from "@testing-library/react-native";
import type { ActivityRecord, WorkoutRecord } from "@sendtally/api-client";
import { anExercise, hangData, renderWithHang } from "../data/renderWithHang";
import { WorkoutEditScreen } from "./WorkoutEditScreen";

const mockApi = {
  sessions: () => new Promise(() => undefined),
  climbs: () => Promise.resolve({ climbs: [] }),
};
jest.mock("../../../lib/api", () => ({ useApi: () => mockApi }));
jest.mock("expo-router", () => ({
  router: { canGoBack: () => true, push: jest.fn(), back: jest.fn(), replace: jest.fn() },
}));

const logged: ActivityRecord = {
  id: "a1",
  kind: "climbing",
  title: "Capacity night",
  date: "2026-11-22",
  startTime: null,
  minutes: 52,
  rpe: 6,
  notes: null,
  workoutId: "w1",
  membershipId: null,
  week: null,
  focus: null,
  done: [
    {
      item: 0,
      exercise: "Capacity Bouldering",
      sets: [{ onS: 2700, climbs: [{ grade: "V5", scale: "v", tries: 1, sent: true }] }],
    },
  ],
  stravaActivityId: null,
  postedAt: null,
  postState: null,
  postError: null,
};

const workout = (doses: { sets: number; onS: number }[]): WorkoutRecord => ({
  id: "w1",
  kind: "climbing",
  name: "Capacity night",
  description: "",
  minutes: 45,
  targetRpe: 6,
  items: [{ exercise: "Capacity Bouldering", doses }],
  exerciseRestS: 0,
  focus: null,
  updatedAt: "t",
});

const exercises = [anExercise("e1", "Capacity Bouldering", "climbing", { measure: "seconds" })];

describe("Edit workout", () => {
  it("states each exercise's target, as Log workout does", async () => {
    await renderWithHang(<WorkoutEditScreen id="a1" />, hangData(), {
      activities: [logged],
      workouts: [workout([{ sets: 1, onS: 2700 }])],
      exercises,
    });
    expect(screen.getByText("45:00 min")).toBeTruthy();
  });

  it("states none for an alternating workout, whose turn the log does not keep", async () => {
    await renderWithHang(<WorkoutEditScreen id="a1" />, hangData(), {
      activities: [logged],
      workouts: [
        workout([
          { sets: 1, onS: 2700 },
          { sets: 2, onS: 1200 },
        ]),
      ],
      exercises,
    });
    expect(screen.getByText("Capacity Bouldering")).toBeTruthy();
    expect(screen.queryByText("45:00 min")).toBeNull();
  });
});
