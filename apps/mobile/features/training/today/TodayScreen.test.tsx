import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, screen } from "@testing-library/react-native";
import { router } from "expo-router";
import React from "react";
import type { PlanItem } from "@sendtally/api-client";
import type { Schedule } from "@sendtally/core/hang";
import { hangData, renderWithHang } from "../data/renderWithHang";
import { TodayScreen } from "./TodayScreen";

jest.mock("../../../components/Sheet", () => ({ Sheet: () => null }));
jest.mock("../../../lib/api", () => ({ useApi: () => undefined }));
jest.mock("expo-router", () => ({
  router: { push: jest.fn() },
  useNavigation: () => ({ addListener: () => () => undefined }),
}));
const mockPlanItems: PlanItem[] = [];
const mockPlanActions = { setPlanItemSkip: jest.fn(() => Promise.resolve()) };
jest.mock("@sendtally/features/query", () => ({
  ...jest.requireActual<object>("@sendtally/features/query"),
  useQuery: ({ queryKey }: { queryKey: string[] }) => ({
    state: {
      status: "ready",
      data:
        queryKey[0] === "planItems"
          ? mockPlanItems
          : { sessions: [], hangSessions: [], activities: [] },
    },
    refreshFailed: false,
    reload: () => Promise.resolve(),
  }),
}));
jest.mock("../plan/usePlanActions", () => ({ usePlanActions: () => mockPlanActions }));

const schedule: Schedule = {
  id: "s1",
  workoutId: "max10",
  gripId: "half",
  days: [0, 1],
  start: "2026-09-28",
  end: null,
  skip: [],
};

const gym: PlanItem = {
  id: "p1",
  kind: "strength",
  title: "Gym, legs",
  days: [0, 1],
  perWeek: null,
  start: "2026-09-28",
  end: null,
  skip: [],
  minutes: 50,
  targetRpe: null,
  projectId: null,
  template: null,
};

describe("Today", () => {
  it("starts today's planned workout on its grip", async () => {
    await renderWithHang(<TodayScreen />, hangData({ schedules: [schedule] }));
    expect(screen.getByText("Up today · Hangboard")).toBeTruthy();
    await fireEvent.press(screen.getByText("Start"));
    expect(router.push).toHaveBeenCalledWith({
      pathname: "/workout/timer",
      params: { workoutId: "max10", gripId: "half" },
    });
  });

  it("shows a past planned day as missed and skips just that date", async () => {
    const { actions } = await renderWithHang(<TodayScreen />, hangData({ schedules: [schedule] }));
    await fireEvent.press(screen.getByLabelText(/^Monday.*0 logged, 1 planned$/));
    expect(screen.getByText("Missed")).toBeTruthy();
    await fireEvent.press(screen.getByLabelText(/^Skip Max hangs/));
    expect(actions.saveSchedules).toHaveBeenCalledWith([{ ...schedule, skip: ["2026-09-28"] }]);
  });

  it("counts the week as done of planned", async () => {
    await renderWithHang(<TodayScreen />, hangData({ schedules: [schedule] }));
    expect(screen.getByText("0 of 2")).toBeTruthy();
  });

  it("logs today's plan item through the activity form", async () => {
    mockPlanItems.splice(0, mockPlanItems.length, gym, {
      ...gym,
      id: "c1",
      kind: "climb",
      title: "Limit",
    });
    await renderWithHang(<TodayScreen />);
    expect(screen.getByText("Up today · Strength")).toBeTruthy();
    await fireEvent.press(screen.getByText("Log it"));
    expect(router.push).toHaveBeenCalledWith({
      pathname: "/activity/new",
      params: {
        kind: "strength",
        title: "Gym, legs",
        date: "2026-09-29",
        planItemId: "p1",
        minutes: "50",
      },
    });
    await fireEvent.press(screen.getByText("Log session"));
    expect(router.push).toHaveBeenCalledWith("/session/new");
  });

  it("skips a missed plan item on its day", async () => {
    mockPlanItems.splice(0, mockPlanItems.length, gym);
    await renderWithHang(<TodayScreen />);
    await fireEvent.press(screen.getByLabelText(/^Monday.*0 logged, 1 planned$/));
    expect(screen.getByText("Missed")).toBeTruthy();
    await fireEvent.press(screen.getByLabelText(/^Skip Gym, legs/));
    expect(mockPlanActions.setPlanItemSkip).toHaveBeenCalledWith("p1", "2026-09-28", true);
  });

  it("counts a weekly goal by the week, not the day", async () => {
    mockPlanItems.splice(0, mockPlanItems.length, { ...gym, days: [], perWeek: 3 });
    await renderWithHang(<TodayScreen />);
    expect(screen.getByText("0 of 3 this week")).toBeTruthy();
    expect(screen.getByText("0 of 3")).toBeTruthy();
  });
});
